/**
 * KPI Calculator
 * 교육 관리 시스템 KPI 계산 유틸리티
 */

import type {
  Employee,
  TrainingProgram,
  TrainingResultRecord,
  Position,
  DashboardStats,
} from '@/types';

// ========== Types ==========

export interface KPICalculationResult {
  totalEmployees: number;
  monthlyCompletions: number;
  overallCompletionRate: number;
  retrainingCount: number;
  // Extended metrics
  passRate: number;
  firstTimePassRate: number;
  averageScore: number;
  expiringCount: number;
}

export interface EmployeeCompletionStatus {
  employee_id: string;
  required_programs: number;
  completed_programs: number;
  completion_rate: number;
  expired_count: number;
  expiring_count: number;
}

export interface ProgramCompletionStatus {
  program_code: string;
  target_employee_count: number;
  completed_count: number;
  completion_rate: number;
  pass_rate: number;
  average_score: number;
}

// ========== Helper Functions ==========

/**
 * Check if a training result is still valid (not expired)
 */
export function isTrainingValid(
  result: TrainingResultRecord,
  program: TrainingProgram,
  referenceDate: Date = new Date()
): boolean {
  if (result.result !== 'PASS') return false;
  if (!program.validity_months) return true; // No expiration

  const trainingDate = new Date(result.training_date);
  const expirationDate = new Date(trainingDate);
  expirationDate.setMonth(expirationDate.getMonth() + program.validity_months);

  return expirationDate > referenceDate;
}

/**
 * Get the expiration date for a training result
 */
export function getExpirationDate(
  result: TrainingResultRecord,
  program: TrainingProgram
): Date | null {
  if (!program.validity_months) return null;

  const trainingDate = new Date(result.training_date);
  const expirationDate = new Date(trainingDate);
  expirationDate.setMonth(expirationDate.getMonth() + program.validity_months);

  return expirationDate;
}

/**
 * Check if a program is required for an employee's position
 */
export function isProgramRequiredForEmployee(
  employee: Employee,
  program: TrainingProgram
): boolean {
  if (!program.is_active) return false;
  if (employee.status !== 'ACTIVE') return false;

  // If target_positions is empty, the program applies to all positions
  if (program.target_positions.length === 0) return true;

  return program.target_positions.includes(employee.position as Position);
}

/**
 * Get the latest valid result for an employee-program combination
 */
export function getLatestValidResult(
  employeeId: string,
  programCode: string,
  results: TrainingResultRecord[],
  program: TrainingProgram,
  referenceDate: Date = new Date()
): TrainingResultRecord | null {
  const employeeResults = results
    .filter(r =>
      r.employee_id === employeeId &&
      r.program_code === programCode &&
      r.result === 'PASS'
    )
    .sort((a, b) =>
      new Date(b.training_date).getTime() - new Date(a.training_date).getTime()
    );

  for (const result of employeeResults) {
    if (isTrainingValid(result, program, referenceDate)) {
      return result;
    }
  }

  return null;
}

// ========== Main KPI Calculation Functions ==========

/**
 * Calculate the overall completion rate for all employees
 * Uses accurate logic: considers target_positions and validity periods
 */
export function calculateOverallCompletionRate(
  employees: Employee[],
  programs: TrainingProgram[],
  results: TrainingResultRecord[],
  referenceDate: Date = new Date()
): number {
  const activeEmployees = employees.filter(e => e.status === 'ACTIVE');
  const activePrograms = programs.filter(p => p.is_active);

  if (activeEmployees.length === 0 || activePrograms.length === 0) {
    return 0;
  }

  let totalRequired = 0;
  let totalCompleted = 0;

  for (const employee of activeEmployees) {
    for (const program of activePrograms) {
      if (isProgramRequiredForEmployee(employee, program)) {
        totalRequired++;

        const latestValidResult = getLatestValidResult(
          employee.employee_id,
          program.program_code,
          results,
          program,
          referenceDate
        );

        if (latestValidResult) {
          totalCompleted++;
        }
      }
    }
  }

  if (totalRequired === 0) return 100;

  return Math.round((totalCompleted / totalRequired) * 100);
}

/**
 * Calculate completion status for a single employee
 */
export function calculateEmployeeCompletionStatus(
  employee: Employee,
  programs: TrainingProgram[],
  results: TrainingResultRecord[],
  referenceDate: Date = new Date(),
  expiringThresholdDays: number = 30
): EmployeeCompletionStatus {
  const activePrograms = programs.filter(p => p.is_active);
  const requiredPrograms = activePrograms.filter(p =>
    isProgramRequiredForEmployee(employee, p)
  );

  let completedCount = 0;
  let expiredCount = 0;
  let expiringCount = 0;

  const expiringThreshold = new Date(referenceDate);
  expiringThreshold.setDate(expiringThreshold.getDate() + expiringThresholdDays);

  for (const program of requiredPrograms) {
    const latestValidResult = getLatestValidResult(
      employee.employee_id,
      program.program_code,
      results,
      program,
      referenceDate
    );

    if (latestValidResult) {
      completedCount++;

      // Check if expiring soon
      const expirationDate = getExpirationDate(latestValidResult, program);
      if (expirationDate && expirationDate <= expiringThreshold) {
        expiringCount++;
      }
    } else {
      // Check if there was a previous valid result that expired
      const previousResults = results.filter(r =>
        r.employee_id === employee.employee_id &&
        r.program_code === program.program_code &&
        r.result === 'PASS'
      );

      if (previousResults.length > 0) {
        expiredCount++;
      }
    }
  }

  return {
    employee_id: employee.employee_id,
    required_programs: requiredPrograms.length,
    completed_programs: completedCount,
    completion_rate: requiredPrograms.length > 0
      ? Math.round((completedCount / requiredPrograms.length) * 100)
      : 100,
    expired_count: expiredCount,
    expiring_count: expiringCount,
  };
}

/**
 * Calculate completion status for a single program
 */
export function calculateProgramCompletionStatus(
  program: TrainingProgram,
  employees: Employee[],
  results: TrainingResultRecord[],
  referenceDate: Date = new Date()
): ProgramCompletionStatus {
  const activeEmployees = employees.filter(e => e.status === 'ACTIVE');
  const targetEmployees = activeEmployees.filter(e =>
    isProgramRequiredForEmployee(e, program)
  );

  let completedCount = 0;
  let totalScore = 0;
  let scoreCount = 0;

  // Get all results for this program
  const programResults = results.filter(r => r.program_code === program.program_code);
  const passCount = programResults.filter(r => r.result === 'PASS').length;
  const totalAttempts = programResults.filter(r => r.result !== 'ABSENT').length;

  for (const employee of targetEmployees) {
    const latestValidResult = getLatestValidResult(
      employee.employee_id,
      program.program_code,
      results,
      program,
      referenceDate
    );

    if (latestValidResult) {
      completedCount++;
      if (latestValidResult.score !== null) {
        totalScore += latestValidResult.score;
        scoreCount++;
      }
    }
  }

  return {
    program_code: program.program_code,
    target_employee_count: targetEmployees.length,
    completed_count: completedCount,
    completion_rate: targetEmployees.length > 0
      ? Math.round((completedCount / targetEmployees.length) * 100)
      : 100,
    pass_rate: totalAttempts > 0
      ? Math.round((passCount / totalAttempts) * 100)
      : 0,
    average_score: scoreCount > 0
      ? Math.round(totalScore / scoreCount)
      : 0,
  };
}

/**
 * Calculate monthly completions (passed trainings in the current month)
 */
export function calculateMonthlyCompletions(
  results: TrainingResultRecord[],
  referenceDate: Date = new Date()
): number {
  const currentMonth = referenceDate.toISOString().substring(0, 7); // YYYY-MM

  return results.filter(r =>
    r.training_date.startsWith(currentMonth) && r.result === 'PASS'
  ).length;
}

/**
 * Count employees needing retraining (failed or expired)
 */
export function calculateRetrainingCount(
  employees: Employee[],
  programs: TrainingProgram[],
  results: TrainingResultRecord[],
  referenceDate: Date = new Date()
): number {
  const employeesNeedingRetraining = new Set<string>();

  const activeEmployees = employees.filter(e => e.status === 'ACTIVE');
  const activePrograms = programs.filter(p => p.is_active);

  for (const employee of activeEmployees) {
    for (const program of activePrograms) {
      if (!isProgramRequiredForEmployee(employee, program)) continue;

      // Get all results for this employee-program combination
      const employeeResults = results.filter(r =>
        r.employee_id === employee.employee_id &&
        r.program_code === program.program_code
      );

      if (employeeResults.length === 0) continue;

      // Get the latest result
      const latestResult = employeeResults.sort((a, b) =>
        new Date(b.training_date).getTime() - new Date(a.training_date).getTime()
      )[0];

      // Check if retraining is needed
      if (latestResult.result === 'FAIL') {
        employeesNeedingRetraining.add(employee.employee_id);
      } else if (latestResult.result === 'PASS') {
        // Check if expired
        if (!isTrainingValid(latestResult, program, referenceDate)) {
          employeesNeedingRetraining.add(employee.employee_id);
        }
      }
    }
  }

  return employeesNeedingRetraining.size;
}

/**
 * Calculate first-time pass rate
 */
export function calculateFirstTimePassRate(
  results: TrainingResultRecord[]
): number {
  // Group results by employee + program
  const employeeProgramResults = new Map<string, TrainingResultRecord[]>();

  for (const result of results) {
    const key = `${result.employee_id}:${result.program_code}`;
    if (!employeeProgramResults.has(key)) {
      employeeProgramResults.set(key, []);
    }
    employeeProgramResults.get(key)!.push(result);
  }

  let firstTimePass = 0;
  let totalFirstAttempts = 0;

  for (const resultGroup of employeeProgramResults.values()) {
    // Sort by date to get first attempt
    const sorted = resultGroup.sort((a, b) =>
      new Date(a.training_date).getTime() - new Date(b.training_date).getTime()
    );

    const firstAttempt = sorted.find(r => r.result !== 'ABSENT');
    if (firstAttempt) {
      totalFirstAttempts++;
      if (firstAttempt.result === 'PASS') {
        firstTimePass++;
      }
    }
  }

  if (totalFirstAttempts === 0) return 0;

  return Math.round((firstTimePass / totalFirstAttempts) * 100);
}

/**
 * Calculate all dashboard KPIs
 */
export function calculateDashboardKPIs(
  employees: Employee[],
  programs: TrainingProgram[],
  results: TrainingResultRecord[],
  referenceDate: Date = new Date()
): KPICalculationResult {
  const activeEmployees = employees.filter(e => e.status === 'ACTIVE');

  // Basic stats
  const totalEmployees = activeEmployees.length;
  const monthlyCompletions = calculateMonthlyCompletions(results, referenceDate);
  const overallCompletionRate = calculateOverallCompletionRate(
    employees, programs, results, referenceDate
  );
  const retrainingCount = calculateRetrainingCount(
    employees, programs, results, referenceDate
  );

  // Extended metrics
  const passedResults = results.filter(r => r.result === 'PASS');
  const totalAttempts = results.filter(r => r.result !== 'ABSENT').length;
  const passRate = totalAttempts > 0
    ? Math.round((passedResults.length / totalAttempts) * 100)
    : 0;

  const firstTimePassRate = calculateFirstTimePassRate(results);

  // Average score
  const scoresWithValue = results.filter(r => r.score !== null);
  const averageScore = scoresWithValue.length > 0
    ? Math.round(
        scoresWithValue.reduce((sum, r) => sum + (r.score || 0), 0) / scoresWithValue.length
      )
    : 0;

  // Expiring trainings count
  let expiringCount = 0;
  const expiringThreshold = new Date(referenceDate);
  expiringThreshold.setDate(expiringThreshold.getDate() + 30);

  for (const employee of activeEmployees) {
    for (const program of programs.filter(p => p.is_active)) {
      if (!isProgramRequiredForEmployee(employee, program)) continue;
      if (!program.validity_months) continue;

      const latestResult = getLatestValidResult(
        employee.employee_id,
        program.program_code,
        results,
        program,
        referenceDate
      );

      if (latestResult) {
        const expirationDate = getExpirationDate(latestResult, program);
        if (expirationDate && expirationDate <= expiringThreshold) {
          expiringCount++;
        }
      }
    }
  }

  return {
    totalEmployees,
    monthlyCompletions,
    overallCompletionRate,
    retrainingCount,
    passRate,
    firstTimePassRate,
    averageScore,
    expiringCount,
  };
}

/**
 * Convert KPICalculationResult to DashboardStats format
 */
export function toDashboardStats(kpi: KPICalculationResult): DashboardStats {
  return {
    totalEmployees: kpi.totalEmployees,
    monthlyCompletions: kpi.monthlyCompletions,
    overallCompletionRate: kpi.overallCompletionRate,
    retrainingCount: kpi.retrainingCount,
  };
}
