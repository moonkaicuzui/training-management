// ============================================================
// Q-TRAIN API Service
// Mock API for development, switch to GAS for production
// ============================================================

import type {
  Employee,
  EmployeeFilters,
  TrainingProgram,
  ProgramFilters,
  TrainingSession,
  SessionFilters,
  TrainingResultRecord,
  ResultFilters,
  ResultInput,
  ResultUpdate,
  DashboardStats,
  MonthlyTrainingData,
  GradeDistribution,
  ProgressMatrixData,
  ProgressMatrixFilters,
  RetrainingTarget,
  ExpiringTraining,
  Grade,
} from '@/types';

import {
  mockEmployees,
  mockPrograms,
  mockSessions,
  mockResults,
} from '@/data/mockData';

// ========== Configuration ==========

const USE_MOCK_API = false; // Set to false when GAS is ready
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxS2020t2o--mUb-o-ag-OJM5WUGsjZEsQq6YcALTyTxJOsM9Diuqpk-sDswAuuWrf_/exec';

// Simulate API delay for realistic UX
const MOCK_DELAY = 300;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ========== Grade Calculation ==========

export function calculateGrade(
  score: number,
  gradeAA: number,
  gradeA: number,
  gradeB: number
): Grade {
  if (score >= gradeAA) return 'AA';
  if (score >= gradeA) return 'A';
  if (score >= gradeB) return 'B';
  return 'C';
}

export function calculateResult(
  score: number | null,
  passingScore: number
): 'PASS' | 'FAIL' {
  if (score === null) return 'FAIL';
  return score >= passingScore ? 'PASS' : 'FAIL';
}

// ========== Employee API ==========

export async function getEmployees(filters?: EmployeeFilters): Promise<Employee[]> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    let result = [...mockEmployees];

    if (filters?.department) {
      result = result.filter(e => e.department === filters.department);
    }
    if (filters?.position) {
      result = result.filter(e => e.position === filters.position);
    }
    if (filters?.building) {
      result = result.filter(e => e.building === filters.building);
    }
    if (filters?.line) {
      result = result.filter(e => e.line === filters.line);
    }
    if (filters?.status) {
      result = result.filter(e => e.status === filters.status);
    }
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        e =>
          e.employee_id.toLowerCase().includes(searchLower) ||
          e.employee_name.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }

  // GAS API call
  const params = new URLSearchParams({ action: 'getEmployees', ...filters });
  const response = await fetch(`${GAS_URL}?${params}`);
  const data = await response.json();
  return data.data;
}

export async function getEmployee(id: string): Promise<Employee | null> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    return mockEmployees.find(e => e.employee_id === id) || null;
  }

  const params = new URLSearchParams({ action: 'getEmployee', id });
  const response = await fetch(`${GAS_URL}?${params}`);
  const data = await response.json();
  return data.data;
}

export async function getEmployeeHistory(id: string): Promise<TrainingResultRecord[]> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    return mockResults.filter(r => r.employee_id === id);
  }

  const params = new URLSearchParams({ action: 'getEmployeeHistory', id });
  const response = await fetch(`${GAS_URL}?${params}`);
  const data = await response.json();
  return data.data;
}

export async function createEmployee(employee: Omit<Employee, 'updated_at'>): Promise<Employee> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    const newEmployee: Employee = {
      ...employee,
      updated_at: new Date().toISOString(),
    };
    mockEmployees.push(newEmployee);
    return newEmployee;
  }

  const response = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'createEmployee', data: employee }),
  });
  const data = await response.json();
  return data.data;
}

export async function updateEmployee(
  id: string,
  updates: Partial<Employee>
): Promise<Employee | null> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    const index = mockEmployees.findIndex(e => e.employee_id === id);
    if (index === -1) return null;

    mockEmployees[index] = {
      ...mockEmployees[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return mockEmployees[index];
  }

  const response = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'updateEmployee', id, data: updates }),
  });
  const data = await response.json();
  return data.data;
}

// ========== Training Program API ==========

export async function getPrograms(filters?: ProgramFilters): Promise<TrainingProgram[]> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    let result = [...mockPrograms];

    if (filters?.category) {
      result = result.filter(p => p.category === filters.category);
    }
    if (!filters?.showInactive) {
      result = result.filter(p => p.is_active);
    }
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        p =>
          p.program_code.toLowerCase().includes(searchLower) ||
          p.program_name.toLowerCase().includes(searchLower) ||
          p.program_name_vn.toLowerCase().includes(searchLower) ||
          p.program_name_kr.toLowerCase().includes(searchLower)
      );
    }
    if (filters?.tags && filters.tags.length > 0) {
      result = result.filter(p =>
        filters.tags!.some(tag => p.tags.includes(tag))
      );
    }

    return result;
  }

  const params = new URLSearchParams({ action: 'getPrograms' });
  if (filters?.category) params.append('category', filters.category);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.showInactive) params.append('showInactive', 'true');
  if (filters?.tags) params.append('tags', filters.tags.join(','));
  const response = await fetch(`${GAS_URL}?${params}`);
  const data = await response.json();
  return data.data;
}

export async function getProgram(code: string): Promise<TrainingProgram | null> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    return mockPrograms.find(p => p.program_code === code) || null;
  }

  const params = new URLSearchParams({ action: 'getProgram', code });
  const response = await fetch(`${GAS_URL}?${params}`);
  const data = await response.json();
  return data.data;
}

export async function createProgram(
  program: Omit<TrainingProgram, 'created_at' | 'updated_at'>
): Promise<TrainingProgram> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    const now = new Date().toISOString();
    const newProgram: TrainingProgram = {
      ...program,
      created_at: now,
      updated_at: now,
    };
    mockPrograms.push(newProgram);
    return newProgram;
  }

  const response = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'createProgram', data: program }),
  });
  const data = await response.json();
  return data.data;
}

export async function updateProgram(
  code: string,
  updates: Partial<TrainingProgram>
): Promise<TrainingProgram | null> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    const index = mockPrograms.findIndex(p => p.program_code === code);
    if (index === -1) return null;

    mockPrograms[index] = {
      ...mockPrograms[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return mockPrograms[index];
  }

  const response = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'updateProgram', code, data: updates }),
  });
  const data = await response.json();
  return data.data;
}

export async function deleteProgram(code: string): Promise<boolean> {
  // Soft delete - set is_active to false
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    const index = mockPrograms.findIndex(p => p.program_code === code);
    if (index === -1) return false;

    mockPrograms[index] = {
      ...mockPrograms[index],
      is_active: false,
      updated_at: new Date().toISOString(),
    };
    return true;
  }

  const response = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'deleteProgram', code }),
  });
  const data = await response.json();
  return data.success;
}

// ========== Training Session API ==========

export async function getSessions(filters?: SessionFilters): Promise<TrainingSession[]> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    let result = [...mockSessions];

    if (filters?.startDate) {
      result = result.filter(s => s.session_date >= filters.startDate!);
    }
    if (filters?.endDate) {
      result = result.filter(s => s.session_date <= filters.endDate!);
    }
    if (filters?.programCode) {
      result = result.filter(s => s.program_code === filters.programCode);
    }
    if (filters?.status) {
      result = result.filter(s => s.status === filters.status);
    }

    return result.sort((a, b) => b.session_date.localeCompare(a.session_date));
  }

  const params = new URLSearchParams({ action: 'getSessions', ...filters } as Record<string, string>);
  const response = await fetch(`${GAS_URL}?${params}`);
  const data = await response.json();
  return data.data;
}

export async function createSession(
  session: Omit<TrainingSession, 'session_id' | 'created_at'>
): Promise<TrainingSession> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    const newSession: TrainingSession = {
      ...session,
      session_id: `SES-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    mockSessions.push(newSession);
    return newSession;
  }

  const response = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'createSession', data: session }),
  });
  const data = await response.json();
  return data.data;
}

export async function updateSession(
  id: string,
  updates: Partial<TrainingSession>
): Promise<TrainingSession | null> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    const index = mockSessions.findIndex(s => s.session_id === id);
    if (index === -1) return null;

    mockSessions[index] = {
      ...mockSessions[index],
      ...updates,
    };
    return mockSessions[index];
  }

  const response = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'updateSession', id, data: updates }),
  });
  const data = await response.json();
  return data.data;
}

export async function cancelSession(id: string): Promise<boolean> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    const index = mockSessions.findIndex(s => s.session_id === id);
    if (index === -1) return false;

    mockSessions[index] = {
      ...mockSessions[index],
      status: 'CANCELLED',
    };
    return true;
  }

  const response = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'cancelSession', id }),
  });
  const data = await response.json();
  return data.success;
}

// ========== Training Result API ==========

export async function getResults(filters?: ResultFilters): Promise<TrainingResultRecord[]> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    let result = [...mockResults];

    if (filters?.employeeId) {
      result = result.filter(r => r.employee_id === filters.employeeId);
    }
    if (filters?.programCode) {
      result = result.filter(r => r.program_code === filters.programCode);
    }
    if (filters?.startDate) {
      result = result.filter(r => r.training_date >= filters.startDate!);
    }
    if (filters?.endDate) {
      result = result.filter(r => r.training_date <= filters.endDate!);
    }
    if (filters?.result) {
      result = result.filter(r => r.result === filters.result);
    }
    if (filters?.grade) {
      result = result.filter(r => r.grade === filters.grade);
    }

    return result.sort((a, b) => b.training_date.localeCompare(a.training_date));
  }

  const params = new URLSearchParams({ action: 'getResults', ...filters } as Record<string, string>);
  const response = await fetch(`${GAS_URL}?${params}`);
  const data = await response.json();
  return data.data;
}

export async function recordResults(results: ResultInput[]): Promise<TrainingResultRecord[]> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    const now = new Date().toISOString();
    const newResults: TrainingResultRecord[] = [];

    for (const input of results) {
      const program = mockPrograms.find(p => p.program_code === input.program_code);
      if (!program) continue;

      const grade =
        input.score !== null
          ? calculateGrade(input.score, program.grade_aa, program.grade_a, program.grade_b)
          : null;

      const needsRetraining = input.result === 'FAIL' || input.result === 'ABSENT';

      const newResult: TrainingResultRecord = {
        result_id: `RES-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        session_id: input.session_id || null,
        employee_id: input.employee_id,
        program_code: input.program_code,
        training_date: input.training_date,
        score: input.score,
        grade,
        result: input.result,
        needs_retraining: needsRetraining,
        evaluated_by: input.evaluated_by,
        remarks: input.remarks || '',
        created_at: now,
        updated_at: null,
        updated_by: null,
      };

      mockResults.push(newResult);
      newResults.push(newResult);
    }

    return newResults;
  }

  const response = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'recordResults', data: results }),
  });
  const data = await response.json();
  return data.data;
}

export async function updateResult(update: ResultUpdate): Promise<TrainingResultRecord | null> {
  // NOTE: This updates a result but also logs the change
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    const index = mockResults.findIndex(r => r.result_id === update.result_id);
    if (index === -1) return null;

    const program = mockPrograms.find(
      p => p.program_code === mockResults[index].program_code
    );

    let newGrade = mockResults[index].grade;
    let newNeedsRetraining = mockResults[index].needs_retraining;

    if (update.score !== undefined && program) {
      newGrade =
        update.score !== null
          ? calculateGrade(update.score, program.grade_aa, program.grade_a, program.grade_b)
          : null;
    }

    if (update.result !== undefined) {
      newNeedsRetraining = update.result === 'FAIL' || update.result === 'ABSENT';
    }

    mockResults[index] = {
      ...mockResults[index],
      score: update.score !== undefined ? update.score : mockResults[index].score,
      grade: newGrade,
      result: update.result || mockResults[index].result,
      remarks: update.remarks !== undefined ? update.remarks : mockResults[index].remarks,
      needs_retraining: newNeedsRetraining,
      updated_at: new Date().toISOString(),
      updated_by: 'current_user', // Would come from auth
    };

    return mockResults[index];
  }

  const response = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'updateResult', data: update }),
  });
  const data = await response.json();
  return data.data;
}

// ========== Dashboard API ==========

export async function getDashboardStats(): Promise<DashboardStats> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);

    const activeEmployees = mockEmployees.filter(e => e.status === 'ACTIVE').length;

    // Get current month's completed trainings
    const now = new Date();
    const currentMonth = now.toISOString().substring(0, 7); // YYYY-MM
    const monthlyCompletions = mockResults.filter(
      r => r.training_date.startsWith(currentMonth) && r.result === 'PASS'
    ).length;

    // Calculate overall completion rate
    const totalExpectedTrainings = activeEmployees * mockPrograms.filter(p => p.is_active).length;
    const totalPassedTrainings = mockResults.filter(r => r.result === 'PASS').length;
    const overallCompletionRate = totalExpectedTrainings > 0
      ? Math.round((totalPassedTrainings / totalExpectedTrainings) * 100)
      : 0;

    // Count employees needing retraining
    const retrainingCount = mockResults.filter(r => r.needs_retraining).length;

    return {
      totalEmployees: activeEmployees,
      monthlyCompletions,
      overallCompletionRate: Math.min(overallCompletionRate, 100),
      retrainingCount,
    };
  }

  const params = new URLSearchParams({ action: 'getDashboardStats' });
  const response = await fetch(`${GAS_URL}?${params}`);
  const data = await response.json();
  return data.data;
}

export async function getMonthlyTrainingData(): Promise<MonthlyTrainingData[]> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);

    const monthlyData: Record<string, { planned: number; completed: number }> = {};

    // Get last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().substring(0, 7);
      monthlyData[monthKey] = { planned: 0, completed: 0 };
    }

    // Count sessions
    for (const session of mockSessions) {
      const monthKey = session.session_date.substring(0, 7);
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].planned += session.attendees?.length || 0;
        if (session.status === 'COMPLETED') {
          monthlyData[monthKey].completed += session.attendees?.length || 0;
        }
      }
    }

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data,
    }));
  }

  const params = new URLSearchParams({ action: 'getMonthlyTrainingData' });
  const response = await fetch(`${GAS_URL}?${params}`);
  const data = await response.json();
  return data.data;
}

export async function getGradeDistribution(): Promise<GradeDistribution[]> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);

    const counts: Record<Grade, number> = { AA: 0, A: 0, B: 0, C: 0 };
    let total = 0;

    for (const result of mockResults) {
      if (result.grade) {
        counts[result.grade]++;
        total++;
      }
    }

    const grades: Grade[] = ['AA', 'A', 'B', 'C'];
    return grades.map(grade => ({
      grade,
      count: counts[grade],
      percentage: total > 0 ? Math.round((counts[grade] / total) * 100) : 0,
    }));
  }

  const params = new URLSearchParams({ action: 'getGradeDistribution' });
  const response = await fetch(`${GAS_URL}?${params}`);
  const data = await response.json();
  return data.data;
}

// ========== Progress Matrix API ==========

export async function getProgressMatrix(
  filters?: ProgressMatrixFilters
): Promise<ProgressMatrixData> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);

    let employees = mockEmployees.filter(e => e.status === 'ACTIVE');
    const programs = mockPrograms.filter(p => p.is_active);

    if (filters?.building) {
      employees = employees.filter(e => e.building === filters.building);
    }
    if (filters?.line) {
      employees = employees.filter(e => e.line === filters.line);
    }
    if (filters?.position) {
      employees = employees.filter(e => e.position === filters.position);
    }

    let filteredPrograms = programs;
    if (filters?.category) {
      filteredPrograms = programs.filter(p => p.category === filters.category);
    }

    const cells: ProgressMatrixData['cells'] = [];
    const now = new Date();

    for (const employee of employees) {
      for (const program of filteredPrograms) {
        // Find the latest result for this employee and program
        const employeeResults = mockResults
          .filter(
            r => r.employee_id === employee.employee_id && r.program_code === program.program_code
          )
          .sort((a, b) => b.training_date.localeCompare(a.training_date));

        const lastResult = employeeResults[0];

        let status: 'PASS' | 'FAIL' | 'EXPIRING' | 'EXPIRED' | 'NOT_TAKEN' = 'NOT_TAKEN';
        let expirationDate: string | undefined;

        if (lastResult) {
          if (lastResult.result === 'PASS') {
            // Check expiration
            if (program.validity_months) {
              const resultDate = new Date(lastResult.training_date);
              const expDate = new Date(resultDate);
              expDate.setMonth(expDate.getMonth() + program.validity_months);
              expirationDate = expDate.toISOString().substring(0, 10);

              const daysUntilExpiry = Math.ceil(
                (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              );

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
          status,
          lastResult,
          expirationDate,
        });
      }
    }

    return {
      employees,
      programs: filteredPrograms,
      cells,
    };
  }

  const params = new URLSearchParams({ action: 'getProgressMatrix', ...filters } as Record<string, string>);
  const response = await fetch(`${GAS_URL}?${params}`);
  const data = await response.json();
  return data.data;
}

// ========== Retraining API ==========

export async function getRetrainingTargets(): Promise<RetrainingTarget[]> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);

    const targets: RetrainingTarget[] = [];

    // Find employees with needs_retraining = true
    const retrainingResults = mockResults.filter(r => r.needs_retraining);

    for (const result of retrainingResults) {
      const employee = mockEmployees.find(e => e.employee_id === result.employee_id);
      const program = mockPrograms.find(p => p.program_code === result.program_code);

      if (employee && program && employee.status === 'ACTIVE') {
        // Find recommended retraining programs
        const retrainingPrograms = mockPrograms.filter(
          p =>
            p.category === 'RETRAINING' &&
            p.is_active &&
            p.target_positions.includes(employee.position)
        );

        targets.push({
          employee,
          program,
          lastResult: result,
          reason: result.result === 'ABSENT' ? 'FAILED' : 'FAILED',
          recommendedPrograms: retrainingPrograms.slice(0, 3),
        });
      }
    }

    return targets;
  }

  const params = new URLSearchParams({ action: 'getRetrainingTargets' });
  const response = await fetch(`${GAS_URL}?${params}`);
  const data = await response.json();
  return data.data;
}

export async function getExpiringTrainings(days: number = 30): Promise<ExpiringTraining[]> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);

    const expiring: ExpiringTraining[] = [];
    const now = new Date();

    // Group results by employee and program, get latest PASS
    const latestPasses: Record<string, TrainingResultRecord> = {};

    for (const result of mockResults) {
      if (result.result !== 'PASS') continue;

      const key = `${result.employee_id}-${result.program_code}`;
      if (!latestPasses[key] || result.training_date > latestPasses[key].training_date) {
        latestPasses[key] = result;
      }
    }

    for (const result of Object.values(latestPasses)) {
      const program = mockPrograms.find(p => p.program_code === result.program_code);
      if (!program || !program.validity_months) continue;

      const employee = mockEmployees.find(e => e.employee_id === result.employee_id);
      if (!employee || employee.status !== 'ACTIVE') continue;

      const resultDate = new Date(result.training_date);
      const expDate = new Date(resultDate);
      expDate.setMonth(expDate.getMonth() + program.validity_months);

      const daysUntilExpiry = Math.ceil(
        (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry > 0 && daysUntilExpiry <= days) {
        expiring.push({
          employee,
          program,
          lastPassDate: result.training_date,
          expirationDate: expDate.toISOString().substring(0, 10),
          daysUntilExpiry,
        });
      }
    }

    return expiring.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  }

  const params = new URLSearchParams({ action: 'getExpiringTrainings', days: days.toString() });
  const response = await fetch(`${GAS_URL}?${params}`);
  const data = await response.json();
  return data.data;
}

// ========== Search API ==========

export async function globalSearch(query: string): Promise<{
  employees: Employee[];
  programs: TrainingProgram[];
}> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);

    const queryLower = query.toLowerCase();

    const employees = mockEmployees.filter(
      e =>
        e.employee_id.toLowerCase().includes(queryLower) ||
        e.employee_name.toLowerCase().includes(queryLower)
    );

    const programs = mockPrograms.filter(
      p =>
        p.program_code.toLowerCase().includes(queryLower) ||
        p.program_name.toLowerCase().includes(queryLower) ||
        p.program_name_vn.toLowerCase().includes(queryLower) ||
        p.program_name_kr.toLowerCase().includes(queryLower)
    );

    return {
      employees: employees.slice(0, 5),
      programs: programs.slice(0, 5),
    };
  }

  const params = new URLSearchParams({ action: 'globalSearch', query });
  const response = await fetch(`${GAS_URL}?${params}`);
  const data = await response.json();
  return data.data;
}
