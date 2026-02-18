// ============================================================
// Q-TRAIN Google Sheets ↔ Firestore Sync - Firestore REST API Client
// ============================================================

/**
 * Firestore REST API 전체 문서 조회 (페이지네이션 처리)
 * @param {string} collection - Firestore 컬렉션 이름
 * @returns {Object[]} 문서 배열
 */
function firestoreGetAll(collection) {
  const token = ScriptApp.getOAuthToken();
  const baseUrl = CONFIG.FIRESTORE_BASE + '/projects/' + CONFIG.FIREBASE_PROJECT_ID +
    '/databases/(default)/documents/' + collection;

  const allDocs = [];
  let pageToken = null;

  do {
    let url = baseUrl + '?pageSize=300';
    if (pageToken) {
      url += '&pageToken=' + pageToken;
    }

    const response = UrlFetchApp.fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      muteHttpExceptions: true,
    });

    const statusCode = response.getResponseCode();
    if (statusCode !== 200) {
      throw new Error('Firestore GET failed (' + statusCode + '): ' + response.getContentText());
    }

    const data = JSON.parse(response.getContentText());

    if (data.documents) {
      allDocs.push(...data.documents);
    }

    pageToken = data.nextPageToken || null;
  } while (pageToken);

  return allDocs;
}

/**
 * Firestore 문서 생성/덮어쓰기 (PATCH = upsert)
 * @param {string} collection - 컬렉션 이름
 * @param {string} docId - 문서 ID
 * @param {Object} data - JS 객체 데이터
 * @param {Object} config - COLLECTIONS 설정
 */
function firestorePut(collection, docId, data, config) {
  const token = ScriptApp.getOAuthToken();
  const url = CONFIG.FIRESTORE_BASE + '/projects/' + CONFIG.FIREBASE_PROJECT_ID +
    '/databases/(default)/documents/' + collection + '/' + docId;

  const fields = objectToFirestoreFields(data, config);

  const response = UrlFetchApp.fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    payload: JSON.stringify({ fields: fields }),
    muteHttpExceptions: true,
  });

  const statusCode = response.getResponseCode();
  if (statusCode !== 200) {
    throw new Error('Firestore PUT failed (' + statusCode + '): ' + response.getContentText());
  }

  return JSON.parse(response.getContentText());
}

/**
 * Firestore 배치 쓰기 (최대 500건)
 * @param {Object[]} operations - [{collection, docId, data, config}] 배열
 */
function firestoreBatchWrite(operations) {
  if (operations.length === 0) return;

  const token = ScriptApp.getOAuthToken();
  const url = CONFIG.FIRESTORE_BASE + '/projects/' + CONFIG.FIREBASE_PROJECT_ID +
    '/databases/(default)/documents:commit';

  // 500건씩 나누어 처리
  const batchSize = 500;
  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);

    const writes = batch.map(function(op) {
      const docPath = 'projects/' + CONFIG.FIREBASE_PROJECT_ID +
        '/databases/(default)/documents/' + op.collection + '/' + op.docId;
      const fields = objectToFirestoreFields(op.data, op.config);

      return {
        update: {
          name: docPath,
          fields: fields,
        },
      };
    });

    const response = UrlFetchApp.fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      payload: JSON.stringify({ writes: writes }),
      muteHttpExceptions: true,
    });

    const statusCode = response.getResponseCode();
    if (statusCode !== 200) {
      throw new Error('Firestore batch write failed (' + statusCode + '): ' + response.getContentText());
    }
  }
}

/**
 * Firestore REST document → JS 객체 변환
 * @param {Object} doc - Firestore REST 응답의 document 객체
 * @param {Object} config - COLLECTIONS 설정
 * @returns {Object} JS 객체
 */
function firestoreDocToObject(doc, config) {
  if (!doc || !doc.fields) return null;

  const obj = {};
  const fields = doc.fields;

  for (const key in fields) {
    const field = fields[key];
    obj[key] = firestoreValueToJS(field, key, config);
  }

  return obj;
}

/**
 * Firestore REST value → JS 값 변환
 */
function firestoreValueToJS(field, key, config) {
  if (field.stringValue !== undefined) {
    // 배열 필드인데 쉼표 구분 문자열로 저장된 경우
    if (config.arrayFields.indexOf(key) >= 0) {
      return field.stringValue ? field.stringValue.split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s; }) : [];
    }
    return field.stringValue;
  }
  if (field.integerValue !== undefined) {
    return Number(field.integerValue);
  }
  if (field.doubleValue !== undefined) {
    return field.doubleValue;
  }
  if (field.booleanValue !== undefined) {
    return field.booleanValue;
  }
  if (field.nullValue !== undefined) {
    return null;
  }
  if (field.timestampValue !== undefined) {
    return field.timestampValue;
  }
  if (field.arrayValue !== undefined) {
    var values = field.arrayValue.values || [];
    return values.map(function(v) {
      return firestoreValueToJS(v, key, config);
    });
  }
  if (field.mapValue !== undefined) {
    var result = {};
    var mapFields = field.mapValue.fields || {};
    for (var k in mapFields) {
      result[k] = firestoreValueToJS(mapFields[k], k, config);
    }
    return result;
  }
  return null;
}

/**
 * JS 객체 → Firestore REST fields 변환
 * @param {Object} obj - JS 객체
 * @param {Object} config - COLLECTIONS 설정
 * @returns {Object} Firestore fields 객체
 */
function objectToFirestoreFields(obj, config) {
  const fields = {};

  for (const key in obj) {
    const value = obj[key];
    fields[key] = jsValueToFirestore(value, key, config);
  }

  return fields;
}

/**
 * JS 값 → Firestore REST value 변환
 */
function jsValueToFirestore(value, key, config) {
  if (value === null || value === undefined || value === '') {
    return { nullValue: null };
  }

  // 배열 필드
  if (config.arrayFields.indexOf(key) >= 0) {
    if (Array.isArray(value)) {
      return {
        arrayValue: {
          values: value.map(function(v) {
            return { stringValue: String(v) };
          }),
        },
      };
    }
    // 쉼표 구분 문자열 → 배열
    if (typeof value === 'string') {
      var items = value.split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s; });
      return {
        arrayValue: {
          values: items.map(function(v) {
            return { stringValue: v };
          }),
        },
      };
    }
  }

  // 불리언 필드
  if (config.booleanFields.indexOf(key) >= 0) {
    return { booleanValue: value === true || value === 'TRUE' || value === 'true' || value === 1 };
  }

  // 숫자 필드
  if (config.numberFields.indexOf(key) >= 0) {
    var num = Number(value);
    if (isNaN(num)) return { nullValue: null };
    // 정수와 소수 구분
    return Number.isInteger(num) ? { integerValue: String(num) } : { doubleValue: num };
  }

  // 불리언 값
  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }

  // 숫자 값
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }

  // 배열 값 (config에 없지만 실제 배열인 경우)
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(function(v) {
          return { stringValue: String(v) };
        }),
      },
    };
  }

  // 객체 값 (map)
  if (typeof value === 'object') {
    return { stringValue: JSON.stringify(value) };
  }

  // 기본: 문자열
  return { stringValue: String(value) };
}
