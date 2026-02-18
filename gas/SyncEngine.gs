// ============================================================
// Q-TRAIN Google Sheets ↔ Firestore Sync - Sync Engine
// ============================================================

/**
 * 단일 컬렉션 동기화
 * @param {string} collectionKey - COLLECTIONS 키 (예: 'employees')
 * @param {string} direction - 'bidirectional' | 'toFirestore' | 'toSheets'
 * @returns {Object} { created, updated, skipped, errors }
 */
function syncCollection(collectionKey, direction) {
  var config = COLLECTIONS[collectionKey];
  if (!config) {
    throw new Error('Unknown collection: ' + collectionKey);
  }

  var result = { collection: collectionKey, created: 0, updated: 0, skipped: 0, errors: [] };

  try {
    // 1. Sheet 데이터 읽기 → Map<PK, object>
    var sheetMap = readSheetData(config);

    // 2. Firestore 데이터 읽기 → Map<PK, object>
    var firestoreMap = readFirestoreData(config);

    // 3. 동기화 모드별 처리
    switch (config.syncMode) {
      case 'bidirectional':
        syncBidirectional(sheetMap, firestoreMap, config, direction, result);
        break;
      case 'append_only':
        syncAppendOnly(sheetMap, firestoreMap, config, direction, result);
        break;
      case 'firestore_to_sheets':
        syncFirestoreToSheets(sheetMap, firestoreMap, config, result);
        break;
      default:
        throw new Error('Unknown sync mode: ' + config.syncMode);
    }
  } catch (e) {
    result.errors.push(e.toString());
  }

  return result;
}

/**
 * 전체 컬렉션 동기화
 * @param {string} direction - 동기화 방향
 * @returns {Object[]} 각 컬렉션별 결과 배열
 */
function syncAllCollections(direction) {
  var results = [];
  var keys = Object.keys(COLLECTIONS);

  for (var i = 0; i < keys.length; i++) {
    try {
      var result = syncCollection(keys[i], direction);
      results.push(result);
    } catch (e) {
      results.push({
        collection: keys[i],
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [e.toString()],
      });
    }
  }

  return results;
}

/**
 * 동기화 상태 반환
 */
function getSyncStatus() {
  var status = {};
  var keys = Object.keys(COLLECTIONS);

  for (var i = 0; i < keys.length; i++) {
    var config = COLLECTIONS[keys[i]];
    var sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(config.sheetName);
    status[keys[i]] = {
      sheetName: config.sheetName,
      syncMode: config.syncMode,
      sheetRows: sheet ? Math.max(0, sheet.getLastRow() - 1) : 0,
    };
  }

  return status;
}

// ==================== 내부 함수 ====================

/**
 * Sheet 데이터를 Map으로 읽기
 */
function readSheetData(config) {
  var sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(config.sheetName);
  var map = {};

  if (!sheet || sheet.getLastRow() < 2) return map;

  var data = sheet.getDataRange().getValues();
  // 첫 행은 헤더
  for (var i = 1; i < data.length; i++) {
    var obj = sheetRowToObject(data[i], config);
    var pk = obj[config.pk];
    if (pk) {
      map[String(pk)] = obj;
    }
  }

  return map;
}

/**
 * Firestore 데이터를 Map으로 읽기
 */
function readFirestoreData(config) {
  var docs = firestoreGetAll(config.collection);
  var map = {};

  for (var i = 0; i < docs.length; i++) {
    var obj = firestoreDocToObject(docs[i], config);
    if (obj) {
      var pk = obj[config.pk];
      if (pk) {
        map[String(pk)] = obj;
      }
    }
  }

  return map;
}

/**
 * 양방향 동기화
 */
function syncBidirectional(sheetMap, firestoreMap, config, direction, result) {
  // 양쪽 PK의 합집합
  var allKeys = {};
  var key;
  for (key in sheetMap) allKeys[key] = true;
  for (key in firestoreMap) allKeys[key] = true;

  var firestoreWrites = [];
  var sheetAppends = [];

  for (key in allKeys) {
    var inSheet = sheetMap.hasOwnProperty(key);
    var inFirestore = firestoreMap.hasOwnProperty(key);

    try {
      if (inSheet && inFirestore) {
        // 양쪽에 존재 → updated_at 비교 (last-write-wins)
        var sheetObj = sheetMap[key];
        var fsObj = firestoreMap[key];
        var cmp = compareTimestamps(sheetObj.updated_at || sheetObj.created_at, fsObj.updated_at || fsObj.created_at);

        if (cmp > 0 && direction !== 'toSheets') {
          // Sheet가 최신 → Firestore 업데이트
          firestoreWrites.push({
            collection: config.collection,
            docId: key,
            data: sheetObj,
            config: config,
          });
          result.updated++;
        } else if (cmp < 0 && direction !== 'toFirestore') {
          // Firestore가 최신 → Sheet 업데이트
          updateSheetRow(config, key, fsObj);
          result.updated++;
        } else {
          result.skipped++;
        }
      } else if (inSheet && !inFirestore) {
        // Sheet에만 → Firestore에 생성
        if (direction !== 'toSheets') {
          firestoreWrites.push({
            collection: config.collection,
            docId: key,
            data: sheetMap[key],
            config: config,
          });
          result.created++;
        } else {
          result.skipped++;
        }
      } else if (!inSheet && inFirestore) {
        // Firestore에만 → Sheet에 행 추가
        if (direction !== 'toFirestore') {
          sheetAppends.push(firestoreMap[key]);
          result.created++;
        } else {
          result.skipped++;
        }
      }
    } catch (e) {
      result.errors.push(key + ': ' + e.toString());
    }
  }

  // 배치 Firestore 쓰기
  if (firestoreWrites.length > 0) {
    firestoreBatchWrite(firestoreWrites);
  }

  // 시트에 행 추가
  if (sheetAppends.length > 0) {
    appendSheetRows(config, sheetAppends);
  }
}

/**
 * Append-only 동기화 (training_results용)
 * 생성만 허용, 수정 시 updated_at 비교, 절대 삭제 안함
 */
function syncAppendOnly(sheetMap, firestoreMap, config, direction, result) {
  var allKeys = {};
  var key;
  for (key in sheetMap) allKeys[key] = true;
  for (key in firestoreMap) allKeys[key] = true;

  var firestoreWrites = [];
  var sheetAppends = [];

  for (key in allKeys) {
    var inSheet = sheetMap.hasOwnProperty(key);
    var inFirestore = firestoreMap.hasOwnProperty(key);

    try {
      if (inSheet && inFirestore) {
        // 양쪽에 존재 → updated_at 비교로 최신 데이터 반영
        var sheetObj = sheetMap[key];
        var fsObj = firestoreMap[key];
        var cmp = compareTimestamps(sheetObj.updated_at || sheetObj.created_at, fsObj.updated_at || fsObj.created_at);

        if (cmp > 0 && direction !== 'toSheets') {
          firestoreWrites.push({
            collection: config.collection,
            docId: key,
            data: sheetObj,
            config: config,
          });
          result.updated++;
        } else if (cmp < 0 && direction !== 'toFirestore') {
          updateSheetRow(config, key, fsObj);
          result.updated++;
        } else {
          result.skipped++;
        }
      } else if (inSheet && !inFirestore) {
        // Sheet에만 → Firestore에 생성
        if (direction !== 'toSheets') {
          firestoreWrites.push({
            collection: config.collection,
            docId: key,
            data: sheetMap[key],
            config: config,
          });
          result.created++;
        } else {
          result.skipped++;
        }
      } else if (!inSheet && inFirestore) {
        // Firestore에만 → Sheet에 행 추가
        if (direction !== 'toFirestore') {
          sheetAppends.push(firestoreMap[key]);
          result.created++;
        } else {
          result.skipped++;
        }
      }
    } catch (e) {
      result.errors.push(key + ': ' + e.toString());
    }
  }

  if (firestoreWrites.length > 0) {
    firestoreBatchWrite(firestoreWrites);
  }
  if (sheetAppends.length > 0) {
    appendSheetRows(config, sheetAppends);
  }
}

/**
 * Firestore → Sheets 단방향 동기화 (로그 컬렉션용)
 */
function syncFirestoreToSheets(sheetMap, firestoreMap, config, result) {
  var sheetAppends = [];

  for (var key in firestoreMap) {
    if (!sheetMap.hasOwnProperty(key)) {
      // Firestore에만 존재 → Sheet에 추가
      sheetAppends.push(firestoreMap[key]);
      result.created++;
    } else {
      result.skipped++;
    }
  }

  if (sheetAppends.length > 0) {
    appendSheetRows(config, sheetAppends);
  }
}

// ==================== 시트 조작 함수 ====================

/**
 * 시트에서 PK로 행 찾아 업데이트
 */
function updateSheetRow(config, pkValue, obj) {
  var sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(config.sheetName);
  if (!sheet) return;

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var pkIndex = headers.indexOf(config.pk);

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][pkIndex]) === String(pkValue)) {
      var row = objectToSheetRow(obj, config);
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      return;
    }
  }
}

/**
 * 시트에 여러 행 추가
 */
function appendSheetRows(config, objects) {
  var sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(config.sheetName);
  if (!sheet) {
    // 시트가 없으면 생성
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    sheet = ss.insertSheet(config.sheetName);
    // 헤더 추가
    sheet.getRange(1, 1, 1, config.headers.length).setValues([config.headers]);
  }

  var rows = objects.map(function(obj) {
    return objectToSheetRow(obj, config);
  });

  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, config.headers.length).setValues(rows);
  }
}

// ==================== API 키 검증 ====================

/**
 * API 키 검증
 * @param {Object} e - doPost 이벤트 객체
 * @returns {boolean}
 */
function verifyApiKey(e) {
  var payload = JSON.parse(e.postData.contents);
  var apiKey = payload.apiKey;

  if (!CONFIG.SYNC_API_KEY) {
    // API 키가 설정되지 않으면 보안 경고
    Logger.log('WARNING: SYNC_API_KEY is not set in script properties');
    return false;
  }

  return apiKey === CONFIG.SYNC_API_KEY;
}
