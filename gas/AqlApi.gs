// ============================================================
// Q-TRAIN AQL Report API
// Google Drive에서 AQL CSV 파일을 검색하여 JSON으로 반환
// ============================================================

// 영문 월 이름 → 숫자
var MONTH_NAMES = {
  'JANUARY': 1, 'FEBRUARY': 2, 'MARCH': 3, 'APRIL': 4,
  'MAY': 5, 'JUNE': 6, 'JULY': 7, 'AUGUST': 8,
  'SEPTEMBER': 9, 'OCTOBER': 10, 'NOVEMBER': 11, 'DECEMBER': 12
};

// 표준 컬럼명 매핑
var HEADER_ALIASES = {
  'EMPLOYEE NO': ['EMPLOYEE NO', 'EMPLOYEE_NO', 'EMP NO', 'EMPLOYEE NUMBER', 'EMPNO'],
  'OFFICIAL INSPECTOR': ['OFFICIAL INSPECTOR', 'INSPECTOR', 'INSPECTOR NAME'],
  'RESULT': ['RESULT', 'RESULTS', 'STATUS', 'PASS/FAIL', 'JUDGMENT'],
  'PO NO 1.': ['PO NO 1.', 'PO NO', 'PO NUMBER', 'PO NO 1', 'PO_NO'],
  'BUILDING': ['BUILDING', 'BLDG', 'BLD', 'FACTORY'],
  'LINE': ['LINE', 'LINE NO', 'LINE_NO'],
  'DESCRIPTION': ['DESCRIPTION', 'DESC', 'DEFECT', 'DEFECT DESCRIPTION', 'ERROR'],
  'DATE': ['DATE', 'INSPECTION DATE', 'CHECK DATE', 'AQL DATE'],
  'MODEL': ['MODEL', 'MODEL NAME', 'STYLE', 'STYLE NO'],
  'MONTH': ['MONTH', 'YEAR-MONTH', 'YEAR_MONTH']
};

// ===== 메인 핸들러 =====

function doGet(e) {
  try {
    var action = e.parameter.action;
    switch (action) {
      case 'getMonths':
        return jsonResponse(getAvailableMonths());
      case 'getData':
        return jsonResponse(getMonthData(e.parameter.month));
      case 'getHeaders':
        return jsonResponse(getFileHeaders(e.parameter.month));
      case 'getManpower':
        return jsonResponse(getManpowerData());
      default:
        return jsonResponse({ success: false, error: 'Unknown action: ' + action });
    }
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== 파일 검색 (폴더 ID 불필요) =====

function searchAqlFiles() {
  var files = DriveApp.searchFiles(
    'title contains "AQL_REPORT" and title contains ".csv" and trashed = false'
  );
  var results = [];
  while (files.hasNext()) {
    results.push(files.next());
  }
  return results;
}

function findFileForMonth(yearMonth) {
  var allFiles = searchAqlFiles();
  for (var i = 0; i < allFiles.length; i++) {
    var parsed = parseFileName(allFiles[i].getName());
    if (parsed && parsed.year_month === yearMonth) {
      return allFiles[i];
    }
  }
  return null;
}

// ===== API: 월별 목록 =====

function getAvailableMonths() {
  var allFiles = searchAqlFiles();
  var months = [];

  for (var i = 0; i < allFiles.length; i++) {
    var parsed = parseFileName(allFiles[i].getName());
    if (parsed) {
      months.push(parsed);
    }
  }

  months.sort(function(a, b) {
    return b.year_month.localeCompare(a.year_month);
  });

  return { success: true, months: months };
}

// ===== API: 월별 데이터 =====

function getMonthData(yearMonth) {
  if (!yearMonth) {
    return { success: false, error: 'month parameter required (e.g. 2026-02)' };
  }

  var file = findFileForMonth(yearMonth);
  if (!file) {
    return { success: false, error: 'No CSV file found for: ' + yearMonth };
  }

  var csvContent = file.getBlob().getDataAsString('UTF-8');
  var parsed = parseCsv(csvContent);
  var headerMap = buildHeaderMap(parsed.headers);

  var rows = [];
  for (var i = 0; i < parsed.rows.length; i++) {
    var row = parsed.rows[i];
    var empNo = getMappedValue(row, headerMap, 'EMPLOYEE NO');
    if (!empNo || empNo.trim() === '') continue;

    var rowObj = {};
    for (var stdKey in headerMap) {
      rowObj[stdKey] = getMappedValue(row, headerMap, stdKey);
    }
    if (!rowObj['MONTH']) rowObj['MONTH'] = yearMonth;
    rows.push(rowObj);
  }

  var parts = yearMonth.split('-');
  return {
    success: true,
    data: rows,
    year: parseInt(parts[0]),
    month: parseInt(parts[1]),
    row_count: rows.length,
    file_name: file.getName(),
    headers: parsed.headers
  };
}

// ===== API: 헤더 확인 (디버그) =====

function getFileHeaders(yearMonth) {
  if (!yearMonth) {
    return { success: false, error: 'month parameter required' };
  }
  var file = findFileForMonth(yearMonth);
  if (!file) {
    return { success: false, error: 'No CSV file found for: ' + yearMonth };
  }
  var csvContent = file.getBlob().getDataAsString('UTF-8');
  var parsed = parseCsv(csvContent);
  return {
    success: true,
    file_name: file.getName(),
    raw_headers: parsed.headers,
    mapped_headers: buildHeaderMap(parsed.headers),
    total_rows: parsed.rows.length,
    sample_row: parsed.rows.length > 0 ? parsed.rows[0] : null
  };
}

// ===== 파일명 파싱 =====

function parseFileName(fileName) {
  var name = fileName.replace(/\.csv$/i, '').trim();
  // "AQL_REPORT_FEBRUARY_2026" → "FEBRUARY_2026"
  var idx = name.toUpperCase().indexOf('AQL_REPORT_');
  if (idx !== -1) name = name.substring(idx + 11);

  var parts = name.split('_');
  if (parts.length >= 2) {
    var monthStr = parts[0].toUpperCase();
    var yearStr = parts[parts.length - 1];
    var year = parseInt(yearStr);
    if (year >= 2020 && year <= 2030 && MONTH_NAMES[monthStr]) {
      var month = MONTH_NAMES[monthStr];
      var ym = year + '-' + (month < 10 ? '0' + month : String(month));
      return { year: year, month: month, year_month: ym, label: ym };
    }
  }
  return null;
}

// ===== CSV 파싱 =====

function parseCsv(content) {
  if (!content || content.trim() === '') return { headers: [], rows: [] };
  var lines = parseCsvLines(content);
  if (lines.length === 0) return { headers: [], rows: [] };

  var headers = lines[0].map(function(h) { return h.trim(); });
  var rows = [];
  for (var i = 1; i < lines.length; i++) {
    var line = lines[i];
    if (line.length === 0 || (line.length === 1 && line[0].trim() === '')) continue;
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = j < line.length ? line[j].trim() : '';
    }
    rows.push(row);
  }
  return { headers: headers, rows: rows };
}

function parseCsvLines(text) {
  var lines = [];
  var currentLine = [];
  var currentField = '';
  var inQuotes = false;
  for (var i = 0; i < text.length; i++) {
    var c = text[i];
    var next = i + 1 < text.length ? text[i + 1] : '';
    if (inQuotes) {
      if (c === '"' && next === '"') { currentField += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { currentField += c; }
    } else {
      if (c === '"') { inQuotes = true; }
      else if (c === ',') { currentLine.push(currentField); currentField = ''; }
      else if (c === '\r' && next === '\n') { currentLine.push(currentField); lines.push(currentLine); currentLine = []; currentField = ''; i++; }
      else if (c === '\n' || c === '\r') { currentLine.push(currentField); lines.push(currentLine); currentLine = []; currentField = ''; }
      else { currentField += c; }
    }
  }
  if (currentField !== '' || currentLine.length > 0) { currentLine.push(currentField); lines.push(currentLine); }
  return lines;
}

// ===== 헤더 매핑 =====

function buildHeaderMap(headers) {
  var map = {};
  var used = {};
  for (var stdKey in HEADER_ALIASES) {
    var aliases = HEADER_ALIASES[stdKey];
    for (var a = 0; a < aliases.length; a++) {
      var idx = findHeaderIndex(headers, aliases[a]);
      if (idx !== -1 && !used[idx]) {
        map[stdKey] = headers[idx];
        used[idx] = true;
        break;
      }
    }
  }
  return map;
}

function findHeaderIndex(headers, target) {
  var t = target.toUpperCase().trim();
  for (var i = 0; i < headers.length; i++) {
    if (headers[i].toUpperCase().trim() === t) return i;
  }
  return -1;
}

function getMappedValue(rowObj, headerMap, stdKey) {
  var h = headerMap[stdKey];
  return h ? (rowObj[h] || '') : '';
}

// ===== API: Manpower 데이터 (상사 링크) =====

// HR 프로젝트와 동일한 Google Drive 폴더 구조
// monthly_data 폴더 → {year}_{month:02d} 하위폴더 → basic_manpower_data.csv
var MONTHLY_DATA_FOLDER_ID = '1yFbEIjfpLgPKB7CQhTWyrdKLkn55NlXv';

function searchManpowerFiles() {
  var results = [];
  var seen = {};

  // 1) monthly_data 폴더에서 직접 검색 (가장 신뢰성 높음)
  try {
    var monthlyFolder = DriveApp.getFolderById(MONTHLY_DATA_FOLDER_ID);
    var subfolders = monthlyFolder.getFolders();
    while (subfolders.hasNext()) {
      var subfolder = subfolders.next();
      var files = subfolder.getFilesByName('basic_manpower_data.csv');
      while (files.hasNext()) {
        var f = files.next();
        if (!seen[f.getId()]) {
          seen[f.getId()] = true;
          results.push(f);
        }
      }
    }
    if (results.length > 0) return results;
  } catch (e) {
    Logger.log('monthly_data folder search failed: ' + e);
  }

  // 2) Fallback: 전체 Drive에서 Manpower CSV 검색
  var queries = [
    'title contains "manpower" and title contains ".csv" and trashed = false',
    'title contains "Manpower" and title contains ".csv" and trashed = false',
    'title = "basic_manpower_data.csv" and trashed = false'
  ];
  for (var q = 0; q < queries.length; q++) {
    var driveFiles = DriveApp.searchFiles(queries[q]);
    while (driveFiles.hasNext()) {
      var df = driveFiles.next();
      if (!seen[df.getId()]) {
        seen[df.getId()] = true;
        results.push(df);
      }
    }
    if (results.length > 0) return results;
  }
  return results;
}

function getManpowerData() {
  var allFiles = searchManpowerFiles();
  if (allFiles.length === 0) {
    return { success: false, error: 'No Manpower CSV found. Checked monthly_data folder (ID: ' + MONTHLY_DATA_FOLDER_ID + ') and Drive search for "manpower" CSV files.' };
  }

  // 가장 최근 수정된 파일 사용
  allFiles.sort(function(a, b) {
    return b.getLastUpdated().getTime() - a.getLastUpdated().getTime();
  });
  var file = allFiles[0];

  var csvContent = file.getBlob().getDataAsString('UTF-8');
  var lines = parseCsvLines(csvContent);
  if (lines.length < 2) {
    return { success: false, error: 'Manpower CSV is empty or has no data rows' };
  }

  var headers = lines[0].map(function(h) { return h.trim(); });

  // 컬럼 인덱스 찾기 (유연한 매칭)
  var empNoIdx = findFlexHeader(headers, ['Employee No', 'EmployeeNo', 'EmpNo', 'Emp No', 'employee_no', 'EMPLOYEE NO']);
  var nameIdx = findFlexHeader(headers, ['Full Name', 'FullName', 'Name', 'Employee Name', 'full_name', 'FULL NAME']);
  var bossIdx = findFlexHeader(headers, ['direct boss name', 'DirectBossName', 'Boss Name', 'Supervisor', 'direct_boss_name', 'DIRECT BOSS NAME']);
  var buildingIdx = findFlexHeader(headers, ['BUILDING', 'Building', 'Bldg', 'building']);

  if (empNoIdx === -1 || nameIdx === -1 || bossIdx === -1) {
    return {
      success: false,
      error: 'Required columns not found. Need: Employee No, Full Name, direct boss name. Found headers: ' + headers.join(', '),
      file_name: file.getName(),
      headers: headers
    };
  }

  var rows = [];
  for (var i = 1; i < lines.length; i++) {
    var line = lines[i];
    var empNo = (line[empNoIdx] || '').trim();
    var fullName = (line[nameIdx] || '').trim();
    var bossName = (line[bossIdx] || '').trim();
    var building = buildingIdx >= 0 ? (line[buildingIdx] || '').trim() : '';

    if (!empNo || !fullName) continue;

    rows.push({
      employee_no: empNo,
      full_name: fullName,
      direct_boss_name: bossName,
      building: building
    });
  }

  return {
    success: true,
    data: rows,
    row_count: rows.length,
    file_name: file.getName(),
    headers: headers
  };
}

function findFlexHeader(headers, variations) {
  for (var v = 0; v < variations.length; v++) {
    var target = variations[v].toLowerCase().replace(/[^a-z0-9]/g, '');
    for (var i = 0; i < headers.length; i++) {
      var h = headers[i].toLowerCase().replace(/[^a-z0-9]/g, '');
      if (h === target) return i;
    }
  }
  // Partial match
  for (var v2 = 0; v2 < variations.length; v2++) {
    var target2 = variations[v2].toLowerCase().replace(/[^a-z0-9]/g, '');
    for (var j = 0; j < headers.length; j++) {
      var h2 = headers[j].toLowerCase().replace(/[^a-z0-9]/g, '');
      if (h2.indexOf(target2) >= 0 || target2.indexOf(h2) >= 0) return j;
    }
  }
  return -1;
}

// ===== 테스트 함수 =====

function test1_SearchFiles() {
  var files = searchAqlFiles();
  Logger.log('Found ' + files.length + ' AQL CSV files:');
  for (var i = 0; i < files.length; i++) {
    Logger.log('  ' + files[i].getName() + ' (' + files[i].getSize() + ' bytes)');
  }
}

function test2_GetMonths() {
  var result = getAvailableMonths();
  Logger.log(JSON.stringify(result, null, 2));
}

function test3_GetHeaders() {
  var result = getFileHeaders('2026-02');
  Logger.log(JSON.stringify(result, null, 2));
}

function test4_GetData() {
  var result = getMonthData('2026-02');
  Logger.log('Rows: ' + result.row_count);
  if (result.data && result.data.length > 0) {
    Logger.log('First: ' + JSON.stringify(result.data[0]));
  }
}

// ===== 디버그 테스트 =====

function test_debug() {
  // 방법1: 폴더 직접 접근
  try {
    var folder = DriveApp.getFolderById('18yWygciJczt7fnEKjzGCAC21VVPWmlVi');
    Logger.log('폴더 찾음: ' + folder.getName());
    var files = folder.getFiles();
    var count = 0;
    while (files.hasNext()) {
      Logger.log('  파일: ' + files.next().getName());
      count++;
    }
    Logger.log('폴더 내 파일 수: ' + count);
  } catch(e) {
    Logger.log('폴더 접근 실패: ' + e);
  }

  // 방법2: 이름만으로 검색
  Logger.log('--- 검색 테스트 ---');
  var files2 = DriveApp.searchFiles('title contains "AQL_REPORT"');
  var count2 = 0;
  while (files2.hasNext()) {
    Logger.log('검색 결과: ' + files2.next().getName());
    count2++;
  }
  Logger.log('검색 결과 수: ' + count2);
}

// ===== 계정 확인 =====

function test_whoami() {
  try {
    Logger.log('실행 계정: ' + Session.getEffectiveUser().getEmail());
  } catch(e) {
    Logger.log('이메일 조회 실패: ' + e);
  }
  try {
    var root = DriveApp.getRootFolder();
    Logger.log('내 드라이브 폴더 수: ' + root.getFolders().hasNext());
    var folders = root.getFolders();
    var count = 0;
    while (folders.hasNext() && count < 5) {
      Logger.log('  폴더: ' + folders.next().getName());
      count++;
    }
  } catch(e2) {
    Logger.log('드라이브 조회 실패: ' + e2);
  }
}

