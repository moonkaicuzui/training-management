// ============================================================
// Q-TRAIN Google Apps Script Backend
// Training Management System for HWK Vietnam QIP Team
// ============================================================

// 스프레드시트 ID (본인 시트 URL에서 복사)
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

// 시트 이름
const SHEETS = {
  EMPLOYEES: 'Employees',
  PROGRAMS: 'Training_Programs',
  SESSIONS: 'Training_Sessions',
  RESULTS: 'Training_Results',
  PROGRAM_LOG: 'Program_Change_Log',
  RESULT_LOG: 'Result_Edit_Log'
};

// ========== 메인 핸들러 ==========

function doGet(e) {
  const action = e.parameter.action;
  let result;

  try {
    switch (action) {
      case 'getEmployees':
        result = getEmployees(e.parameter);
        break;
      case 'getEmployee':
        result = getEmployee(e.parameter.id);
        break;
      case 'getEmployeeHistory':
        result = getEmployeeHistory(e.parameter.id);
        break;
      case 'getPrograms':
        result = getPrograms(e.parameter);
        break;
      case 'getProgram':
        result = getProgram(e.parameter.code);
        break;
      case 'getSessions':
        result = getSessions(e.parameter);
        break;
      case 'getResults':
        result = getResults(e.parameter);
        break;
      case 'getDashboardStats':
        result = getDashboardStats();
        break;
      case 'getMonthlyTrainingData':
        result = getMonthlyTrainingData();
        break;
      case 'getGradeDistribution':
        result = getGradeDistribution();
        break;
      case 'getProgressMatrix':
        result = getProgressMatrix(e.parameter);
        break;
      case 'getRetrainingTargets':
        result = getRetrainingTargets();
        break;
      case 'getExpiringTrainings':
        result = getExpiringTrainings(parseInt(e.parameter.days) || 30);
        break;
      case 'globalSearch':
        result = globalSearch(e.parameter.query);
        break;
      default:
        result = { error: 'Unknown action: ' + action };
    }
  } catch (error) {
    result = { error: error.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify({ success: true, data: result }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const payload = JSON.parse(e.postData.contents);
  const action = payload.action;
  let result;

  try {
    switch (action) {
      case 'createEmployee':
        result = createEmployee(payload.data);
        break;
      case 'updateEmployee':
        result = updateEmployee(payload.id, payload.data);
        break;
      case 'createProgram':
        result = createProgram(payload.data);
        break;
      case 'updateProgram':
        result = updateProgram(payload.code, payload.data);
        break;
      case 'deleteProgram':
        result = deleteProgram(payload.code);
        break;
      case 'createSession':
        result = createSession(payload.data);
        break;
      case 'updateSession':
        result = updateSession(payload.id, payload.data);
        break;
      case 'cancelSession':
        result = cancelSession(payload.id);
        break;
      case 'recordResults':
        result = recordResults(payload.data);
        break;
      case 'updateResult':
        result = updateResult(payload.data);
        break;
      default:
        result = { error: 'Unknown action: ' + action };
    }
  } catch (error) {
    result = { error: error.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify({ success: true, data: result }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========== 헬퍼 함수 ==========

function getSheet(name) {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const headers = data[0];
  const objects = [];

  for (let i = 1; i < data.length; i++) {
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      let value = data[i][j];
      // 날짜 변환
      if (value instanceof Date) {
        value = Utilities.formatDate(value, 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd');
      }
      // 배열 변환 (쉼표로 구분된 문자열)
      if (headers[j] === 'tags' || headers[j] === 'target_positions' || headers[j] === 'attendees') {
        value = value ? value.toString().split(',').map(s => s.trim()).filter(s => s) : [];
      }
      // 불리언 변환
      if (headers[j] === 'is_active' || headers[j] === 'needs_retraining') {
        value = value === true || value === 'TRUE' || value === 'true' || value === 1;
      }
      // 숫자 변환
      if (['passing_score', 'grade_aa', 'grade_a', 'grade_b', 'duration_hours', 'validity_months', 'max_attendees', 'score'].includes(headers[j])) {
        value = value === '' || value === null ? null : Number(value);
      }
      obj[headers[j]] = value;
    }
    objects.push(obj);
  }

  return objects;
}

function findRowByKey(sheet, keyColumn, keyValue) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const keyIndex = headers.indexOf(keyColumn);

  for (let i = 1; i < data.length; i++) {
    if (data[i][keyIndex] == keyValue) {
      return i + 1; // 1-based row number
    }
  }
  return -1;
}

function generateId(prefix) {
  return prefix + '-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
}

function now() {
  return new Date().toISOString();
}

// ========== 직원 API ==========

function getEmployees(filters) {
  const sheet = getSheet(SHEETS.EMPLOYEES);
  let employees = sheetToObjects(sheet);

  if (filters.department) {
    employees = employees.filter(e => e.department === filters.department);
  }
  if (filters.position) {
    employees = employees.filter(e => e.position === filters.position);
  }
  if (filters.building) {
    employees = employees.filter(e => e.building === filters.building);
  }
  if (filters.line) {
    employees = employees.filter(e => e.line === filters.line);
  }
  if (filters.status) {
    employees = employees.filter(e => e.status === filters.status);
  }
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    employees = employees.filter(e =>
      e.employee_id.toLowerCase().includes(searchLower) ||
      e.employee_name.toLowerCase().includes(searchLower)
    );
  }

  return employees;
}

function getEmployee(id) {
  const sheet = getSheet(SHEETS.EMPLOYEES);
  const employees = sheetToObjects(sheet);
  return employees.find(e => e.employee_id === id) || null;
}

function getEmployeeHistory(id) {
  const sheet = getSheet(SHEETS.RESULTS);
  const results = sheetToObjects(sheet);
  return results.filter(r => r.employee_id === id);
}

function createEmployee(data) {
  const sheet = getSheet(SHEETS.EMPLOYEES);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  data.updated_at = now();

  const row = headers.map(h => {
    if (Array.isArray(data[h])) return data[h].join(',');
    return data[h] || '';
  });

  sheet.appendRow(row);
  return data;
}

function updateEmployee(id, updates) {
  const sheet = getSheet(SHEETS.EMPLOYEES);
  const rowNum = findRowByKey(sheet, 'employee_id', id);

  if (rowNum === -1) return null;

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const currentRow = sheet.getRange(rowNum, 1, 1, headers.length).getValues()[0];

  updates.updated_at = now();

  const newRow = headers.map((h, i) => {
    if (updates[h] !== undefined) {
      if (Array.isArray(updates[h])) return updates[h].join(',');
      return updates[h];
    }
    return currentRow[i];
  });

  sheet.getRange(rowNum, 1, 1, headers.length).setValues([newRow]);

  return getEmployee(id);
}

// ========== 교육 프로그램 API ==========

function getPrograms(filters) {
  const sheet = getSheet(SHEETS.PROGRAMS);
  let programs = sheetToObjects(sheet);

  if (filters.category) {
    programs = programs.filter(p => p.category === filters.category);
  }
  if (filters.showInactive !== 'true') {
    programs = programs.filter(p => p.is_active);
  }
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    programs = programs.filter(p =>
      p.program_code.toLowerCase().includes(searchLower) ||
      p.program_name.toLowerCase().includes(searchLower) ||
      p.program_name_vn.toLowerCase().includes(searchLower) ||
      p.program_name_kr.toLowerCase().includes(searchLower)
    );
  }

  return programs;
}

function getProgram(code) {
  const sheet = getSheet(SHEETS.PROGRAMS);
  const programs = sheetToObjects(sheet);
  return programs.find(p => p.program_code === code) || null;
}

function createProgram(data) {
  const sheet = getSheet(SHEETS.PROGRAMS);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  data.is_active = true;
  data.created_at = now();
  data.updated_at = now();

  const row = headers.map(h => {
    if (Array.isArray(data[h])) return data[h].join(',');
    return data[h] !== undefined ? data[h] : '';
  });

  sheet.appendRow(row);

  // 로그 기록
  logProgramChange(data.program_code, 'CREATE', null, data);

  return data;
}

function updateProgram(code, updates) {
  const sheet = getSheet(SHEETS.PROGRAMS);
  const rowNum = findRowByKey(sheet, 'program_code', code);

  if (rowNum === -1) return null;

  const beforeData = getProgram(code);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const currentRow = sheet.getRange(rowNum, 1, 1, headers.length).getValues()[0];

  updates.updated_at = now();

  const newRow = headers.map((h, i) => {
    if (updates[h] !== undefined) {
      if (Array.isArray(updates[h])) return updates[h].join(',');
      return updates[h];
    }
    return currentRow[i];
  });

  sheet.getRange(rowNum, 1, 1, headers.length).setValues([newRow]);

  const afterData = getProgram(code);
  logProgramChange(code, 'UPDATE', beforeData, afterData);

  return afterData;
}

function deleteProgram(code) {
  // Soft delete - is_active = false
  const beforeData = getProgram(code);
  const result = updateProgram(code, { is_active: false });

  if (result) {
    logProgramChange(code, 'DELETE', beforeData, result);
    return true;
  }
  return false;
}

function logProgramChange(programCode, action, beforeData, afterData) {
  const sheet = getSheet(SHEETS.PROGRAM_LOG);
  const logId = generateId('PLOG');

  sheet.appendRow([
    logId,
    programCode,
    action,
    'system', // changed_by - 실제로는 인증된 사용자
    beforeData ? JSON.stringify(beforeData) : '',
    afterData ? JSON.stringify(afterData) : '',
    now()
  ]);
}

// ========== 교육 세션 API ==========

function getSessions(filters) {
  const sheet = getSheet(SHEETS.SESSIONS);
  let sessions = sheetToObjects(sheet);

  if (filters.startDate) {
    sessions = sessions.filter(s => s.session_date >= filters.startDate);
  }
  if (filters.endDate) {
    sessions = sessions.filter(s => s.session_date <= filters.endDate);
  }
  if (filters.programCode) {
    sessions = sessions.filter(s => s.program_code === filters.programCode);
  }
  if (filters.status) {
    sessions = sessions.filter(s => s.status === filters.status);
  }

  return sessions.sort((a, b) => b.session_date.localeCompare(a.session_date));
}

function createSession(data) {
  const sheet = getSheet(SHEETS.SESSIONS);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  data.session_id = generateId('SES');
  data.created_at = now();

  const row = headers.map(h => {
    if (Array.isArray(data[h])) return data[h].join(',');
    return data[h] !== undefined ? data[h] : '';
  });

  sheet.appendRow(row);
  return data;
}

function updateSession(id, updates) {
  const sheet = getSheet(SHEETS.SESSIONS);
  const rowNum = findRowByKey(sheet, 'session_id', id);

  if (rowNum === -1) return null;

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const currentRow = sheet.getRange(rowNum, 1, 1, headers.length).getValues()[0];

  const newRow = headers.map((h, i) => {
    if (updates[h] !== undefined) {
      if (Array.isArray(updates[h])) return updates[h].join(',');
      return updates[h];
    }
    return currentRow[i];
  });

  sheet.getRange(rowNum, 1, 1, headers.length).setValues([newRow]);

  const sessions = sheetToObjects(sheet);
  return sessions.find(s => s.session_id === id);
}

function cancelSession(id) {
  return updateSession(id, { status: 'CANCELLED' }) !== null;
}

// ========== 교육 결과 API ==========

function getResults(filters) {
  const sheet = getSheet(SHEETS.RESULTS);
  let results = sheetToObjects(sheet);

  if (filters.employeeId) {
    results = results.filter(r => r.employee_id === filters.employeeId);
  }
  if (filters.programCode) {
    results = results.filter(r => r.program_code === filters.programCode);
  }
  if (filters.startDate) {
    results = results.filter(r => r.training_date >= filters.startDate);
  }
  if (filters.endDate) {
    results = results.filter(r => r.training_date <= filters.endDate);
  }
  if (filters.result) {
    results = results.filter(r => r.result === filters.result);
  }
  if (filters.grade) {
    results = results.filter(r => r.grade === filters.grade);
  }

  return results.sort((a, b) => b.training_date.localeCompare(a.training_date));
}

function calculateGrade(score, gradeAA, gradeA, gradeB) {
  if (score === null) return null;
  if (score >= gradeAA) return 'AA';
  if (score >= gradeA) return 'A';
  if (score >= gradeB) return 'B';
  return 'C';
}

function recordResults(resultsData) {
  const sheet = getSheet(SHEETS.RESULTS);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const programsSheet = getSheet(SHEETS.PROGRAMS);
  const programs = sheetToObjects(programsSheet);

  const newResults = [];

  for (const input of resultsData) {
    const program = programs.find(p => p.program_code === input.program_code);
    if (!program) continue;

    const grade = input.score !== null
      ? calculateGrade(input.score, program.grade_aa, program.grade_a, program.grade_b)
      : null;

    const needsRetraining = input.result === 'FAIL' || input.result === 'ABSENT';

    const result = {
      result_id: generateId('RES'),
      session_id: input.session_id || '',
      employee_id: input.employee_id,
      program_code: input.program_code,
      training_date: input.training_date,
      score: input.score,
      grade: grade,
      result: input.result,
      needs_retraining: needsRetraining,
      evaluated_by: input.evaluated_by,
      remarks: input.remarks || '',
      created_at: now(),
      updated_at: '',
      updated_by: ''
    };

    const row = headers.map(h => {
      if (h === 'needs_retraining') return result[h] ? 'TRUE' : 'FALSE';
      return result[h] !== undefined ? result[h] : '';
    });

    sheet.appendRow(row);
    newResults.push(result);
  }

  return newResults;
}

function updateResult(updateData) {
  const sheet = getSheet(SHEETS.RESULTS);
  const rowNum = findRowByKey(sheet, 'result_id', updateData.result_id);

  if (rowNum === -1) return null;

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const currentRow = sheet.getRange(rowNum, 1, 1, headers.length).getValues()[0];

  // 변경 전 데이터 저장
  const beforeData = {};
  headers.forEach((h, i) => beforeData[h] = currentRow[i]);

  // 프로그램 정보 가져오기 (등급 재계산용)
  const programCode = currentRow[headers.indexOf('program_code')];
  const program = getProgram(programCode);

  // 등급 재계산
  let newGrade = currentRow[headers.indexOf('grade')];
  let newNeedsRetraining = currentRow[headers.indexOf('needs_retraining')];

  if (updateData.score !== undefined && program) {
    newGrade = updateData.score !== null
      ? calculateGrade(updateData.score, program.grade_aa, program.grade_a, program.grade_b)
      : null;
  }

  if (updateData.result !== undefined) {
    newNeedsRetraining = updateData.result === 'FAIL' || updateData.result === 'ABSENT';
  }

  const newRow = headers.map((h, i) => {
    if (h === 'score' && updateData.score !== undefined) return updateData.score;
    if (h === 'result' && updateData.result !== undefined) return updateData.result;
    if (h === 'remarks' && updateData.remarks !== undefined) return updateData.remarks;
    if (h === 'grade') return newGrade;
    if (h === 'needs_retraining') return newNeedsRetraining ? 'TRUE' : 'FALSE';
    if (h === 'updated_at') return now();
    if (h === 'updated_by') return 'system';
    return currentRow[i];
  });

  sheet.getRange(rowNum, 1, 1, headers.length).setValues([newRow]);

  // 변경 로그 기록
  logResultEdit(updateData.result_id, beforeData, newRow, updateData.edit_reason, headers);

  const results = sheetToObjects(sheet);
  return results.find(r => r.result_id === updateData.result_id);
}

function logResultEdit(resultId, beforeData, afterRow, editReason, headers) {
  const sheet = getSheet(SHEETS.RESULT_LOG);
  const logId = generateId('RLOG');

  const afterData = {};
  headers.forEach((h, i) => afterData[h] = afterRow[i]);

  sheet.appendRow([
    logId,
    resultId,
    JSON.stringify(beforeData),
    JSON.stringify(afterData),
    editReason || '',
    'system',
    now()
  ]);
}

// ========== 대시보드 API ==========

function getDashboardStats() {
  const employees = sheetToObjects(getSheet(SHEETS.EMPLOYEES));
  const results = sheetToObjects(getSheet(SHEETS.RESULTS));
  const programs = sheetToObjects(getSheet(SHEETS.PROGRAMS));

  const activeEmployees = employees.filter(e => e.status === 'ACTIVE').length;

  // 이번 달 완료 건수
  const now = new Date();
  const currentMonth = Utilities.formatDate(now, 'Asia/Ho_Chi_Minh', 'yyyy-MM');
  const monthlyCompletions = results.filter(
    r => r.training_date && r.training_date.startsWith(currentMonth) && r.result === 'PASS'
  ).length;

  // 전체 완료율
  const totalExpected = activeEmployees * programs.filter(p => p.is_active).length;
  const totalPassed = results.filter(r => r.result === 'PASS').length;
  const overallCompletionRate = totalExpected > 0
    ? Math.min(Math.round((totalPassed / totalExpected) * 100), 100)
    : 0;

  // 재교육 필요 인원
  const retrainingCount = results.filter(r => r.needs_retraining).length;

  return {
    totalEmployees: activeEmployees,
    monthlyCompletions: monthlyCompletions,
    overallCompletionRate: overallCompletionRate,
    retrainingCount: retrainingCount
  };
}

function getMonthlyTrainingData() {
  const sessions = sheetToObjects(getSheet(SHEETS.SESSIONS));
  const monthlyData = {};

  // 최근 6개월
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = Utilities.formatDate(date, 'Asia/Ho_Chi_Minh', 'yyyy-MM');
    monthlyData[monthKey] = { planned: 0, completed: 0 };
  }

  for (const session of sessions) {
    if (!session.session_date) continue;
    const monthKey = session.session_date.substring(0, 7);
    if (monthlyData[monthKey]) {
      const attendeeCount = session.attendees ? session.attendees.length : 0;
      monthlyData[monthKey].planned += attendeeCount;
      if (session.status === 'COMPLETED') {
        monthlyData[monthKey].completed += attendeeCount;
      }
    }
  }

  return Object.entries(monthlyData).map(([month, data]) => ({
    month: month,
    planned: data.planned,
    completed: data.completed
  }));
}

function getGradeDistribution() {
  const results = sheetToObjects(getSheet(SHEETS.RESULTS));
  const counts = { AA: 0, A: 0, B: 0, C: 0 };
  let total = 0;

  for (const result of results) {
    if (result.grade && counts[result.grade] !== undefined) {
      counts[result.grade]++;
      total++;
    }
  }

  return ['AA', 'A', 'B', 'C'].map(grade => ({
    grade: grade,
    count: counts[grade],
    percentage: total > 0 ? Math.round((counts[grade] / total) * 100) : 0
  }));
}

// ========== 진도 현황 API ==========

function getProgressMatrix(filters) {
  let employees = sheetToObjects(getSheet(SHEETS.EMPLOYEES)).filter(e => e.status === 'ACTIVE');
  let programs = sheetToObjects(getSheet(SHEETS.PROGRAMS)).filter(p => p.is_active);
  const results = sheetToObjects(getSheet(SHEETS.RESULTS));

  if (filters.building) {
    employees = employees.filter(e => e.building === filters.building);
  }
  if (filters.line) {
    employees = employees.filter(e => e.line === filters.line);
  }
  if (filters.position) {
    employees = employees.filter(e => e.position === filters.position);
  }
  if (filters.category) {
    programs = programs.filter(p => p.category === filters.category);
  }

  const cells = [];
  const now = new Date();

  for (const employee of employees) {
    for (const program of programs) {
      const employeeResults = results
        .filter(r => r.employee_id === employee.employee_id && r.program_code === program.program_code)
        .sort((a, b) => b.training_date.localeCompare(a.training_date));

      const lastResult = employeeResults[0] || null;
      let status = 'NOT_TAKEN';
      let expirationDate = null;

      if (lastResult) {
        if (lastResult.result === 'PASS') {
          if (program.validity_months) {
            const resultDate = new Date(lastResult.training_date);
            const expDate = new Date(resultDate);
            expDate.setMonth(expDate.getMonth() + program.validity_months);
            expirationDate = Utilities.formatDate(expDate, 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd');

            const daysUntilExpiry = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));

            if (daysUntilExpiry < 0) {
              status = 'EXPIRED';
            } else if (daysUntilExpiry <= 30) {
              status = 'EXPIRING';
            } else {
              status = 'PASS';
            }
          } else {
            status = 'PASS';
          }
        } else {
          status = 'FAIL';
        }
      }

      cells.push({
        employeeId: employee.employee_id,
        programCode: program.program_code,
        status: status,
        lastResult: lastResult,
        expirationDate: expirationDate
      });
    }
  }

  return {
    employees: employees,
    programs: programs,
    cells: cells
  };
}

// ========== 재교육 API ==========

function getRetrainingTargets() {
  const employees = sheetToObjects(getSheet(SHEETS.EMPLOYEES));
  const programs = sheetToObjects(getSheet(SHEETS.PROGRAMS));
  const results = sheetToObjects(getSheet(SHEETS.RESULTS));

  const targets = [];
  const retrainingResults = results.filter(r => r.needs_retraining);

  for (const result of retrainingResults) {
    const employee = employees.find(e => e.employee_id === result.employee_id);
    const program = programs.find(p => p.program_code === result.program_code);

    if (employee && program && employee.status === 'ACTIVE') {
      targets.push({
        employee: employee,
        program: program,
        lastResult: result,
        reason: 'FAILED'
      });
    }
  }

  return targets;
}

function getExpiringTrainings(days) {
  const employees = sheetToObjects(getSheet(SHEETS.EMPLOYEES));
  const programs = sheetToObjects(getSheet(SHEETS.PROGRAMS));
  const results = sheetToObjects(getSheet(SHEETS.RESULTS));

  const expiring = [];
  const now = new Date();

  // 직원-프로그램별 최신 PASS 결과 찾기
  const latestPasses = {};

  for (const result of results) {
    if (result.result !== 'PASS') continue;

    const key = result.employee_id + '-' + result.program_code;
    if (!latestPasses[key] || result.training_date > latestPasses[key].training_date) {
      latestPasses[key] = result;
    }
  }

  for (const key in latestPasses) {
    const result = latestPasses[key];
    const program = programs.find(p => p.program_code === result.program_code);
    if (!program || !program.validity_months) continue;

    const employee = employees.find(e => e.employee_id === result.employee_id);
    if (!employee || employee.status !== 'ACTIVE') continue;

    const resultDate = new Date(result.training_date);
    const expDate = new Date(resultDate);
    expDate.setMonth(expDate.getMonth() + program.validity_months);

    const daysUntilExpiry = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry > 0 && daysUntilExpiry <= days) {
      expiring.push({
        employee: employee,
        program: program,
        lastPassDate: result.training_date,
        expirationDate: Utilities.formatDate(expDate, 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd'),
        daysUntilExpiry: daysUntilExpiry
      });
    }
  }

  return expiring.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
}

// ========== 검색 API ==========

function globalSearch(query) {
  if (!query || query.length < 2) {
    return { employees: [], programs: [] };
  }

  const queryLower = query.toLowerCase();

  const employees = sheetToObjects(getSheet(SHEETS.EMPLOYEES));
  const programs = sheetToObjects(getSheet(SHEETS.PROGRAMS));

  const matchedEmployees = employees.filter(e =>
    e.employee_id.toLowerCase().includes(queryLower) ||
    e.employee_name.toLowerCase().includes(queryLower)
  ).slice(0, 5);

  const matchedPrograms = programs.filter(p =>
    p.program_code.toLowerCase().includes(queryLower) ||
    p.program_name.toLowerCase().includes(queryLower) ||
    (p.program_name_vn && p.program_name_vn.toLowerCase().includes(queryLower)) ||
    (p.program_name_kr && p.program_name_kr.toLowerCase().includes(queryLower))
  ).slice(0, 5);

  return {
    employees: matchedEmployees,
    programs: matchedPrograms
  };
}

// ========== 테스트 함수 ==========

function testGetEmployees() {
  const result = getEmployees({});
  Logger.log(JSON.stringify(result, null, 2));
}

function testGetDashboardStats() {
  const result = getDashboardStats();
  Logger.log(JSON.stringify(result, null, 2));
}
