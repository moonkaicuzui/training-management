// ============================================================
// Q-TRAIN Google Sheets ↔ Firestore Sync - Data Converters
// ============================================================

/**
 * 시트 행 배열 → JS 객체 변환
 * @param {Array} row - 시트 행 데이터 배열
 * @param {Object} config - COLLECTIONS 설정
 * @returns {Object} JS 객체
 */
function sheetRowToObject(row, config) {
  const obj = {};
  const headers = config.headers;

  for (var i = 0; i < headers.length; i++) {
    var key = headers[i];
    var value = i < row.length ? row[i] : '';

    // 날짜 객체 → ISO 문자열
    if (value instanceof Date) {
      value = Utilities.formatDate(value, 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'');
    }

    // 배열 필드: 쉼표 구분 문자열 → 배열
    if (config.arrayFields.indexOf(key) >= 0) {
      if (Array.isArray(value)) {
        // 이미 배열이면 그대로
      } else {
        value = value ? String(value).split(',').map(function(s) { return s.trim(); }).filter(function(s) { return s; }) : [];
      }
    }
    // 불리언 필드
    else if (config.booleanFields.indexOf(key) >= 0) {
      value = value === true || value === 'TRUE' || value === 'true' || value === 1;
    }
    // 숫자 필드
    else if (config.numberFields.indexOf(key) >= 0) {
      if (value === '' || value === null || value === undefined) {
        value = null;
      } else {
        value = Number(value);
        if (isNaN(value)) value = null;
      }
    }
    // 나머지는 문자열
    else {
      value = value !== null && value !== undefined ? String(value) : '';
    }

    obj[key] = value;
  }

  return obj;
}

/**
 * JS 객체 → 시트 행 배열 변환
 * @param {Object} obj - JS 객체
 * @param {Object} config - COLLECTIONS 설정
 * @returns {Array} 시트 행 데이터 배열
 */
function objectToSheetRow(obj, config) {
  return config.headers.map(function(key) {
    var value = obj[key];

    if (value === null || value === undefined) return '';

    // 배열 → 쉼표 구분 문자열
    if (Array.isArray(value)) {
      return value.join(',');
    }

    // 불리언 → TRUE/FALSE 문자열
    if (config.booleanFields.indexOf(key) >= 0) {
      return value ? 'TRUE' : 'FALSE';
    }

    // 객체 → JSON 문자열
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return value;
  });
}

/**
 * 다양한 타임스탬프 형식 정규화
 * @param {*} value - 타임스탬프 값
 * @returns {string|null} ISO 8601 문자열 또는 null
 */
function normalizeTimestamp(value) {
  if (!value) return null;

  // 이미 ISO 형식
  if (typeof value === 'string') {
    // Firestore timestamp 형식: 2024-01-15T10:30:00.000Z
    if (value.match(/^\d{4}-\d{2}-\d{2}T/)) {
      return value;
    }
    // 날짜만: 2024-01-15
    if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return value + 'T00:00:00.000Z';
    }
    // Google Sheets 날짜 형식: 01/15/2024
    if (value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      var parts = value.split('/');
      return parts[2] + '-' + parts[0] + '-' + parts[1] + 'T00:00:00.000Z';
    }
  }

  // Date 객체
  if (value instanceof Date) {
    return value.toISOString();
  }

  // Firestore Timestamp 객체 ({seconds, nanoseconds})
  if (typeof value === 'object' && value.seconds) {
    return new Date(value.seconds * 1000).toISOString();
  }

  return String(value);
}

/**
 * updated_at 타임스탬프 비교 (last-write-wins)
 * @param {*} ts1 - 첫 번째 타임스탬프
 * @param {*} ts2 - 두 번째 타임스탬프
 * @returns {number} 양수면 ts1이 최신, 음수면 ts2가 최신, 0이면 동일
 */
function compareTimestamps(ts1, ts2) {
  var n1 = normalizeTimestamp(ts1);
  var n2 = normalizeTimestamp(ts2);

  if (!n1 && !n2) return 0;
  if (!n1) return -1;
  if (!n2) return 1;

  return n1.localeCompare(n2);
}
