/**
 * KPI Calculator Tests
 */

import { describe, it, expect } from 'vitest';
import type { Employee, TrainingProgram, TrainingResultRecord, Position } from '@/types';
import {
  isTrainingValid,
  getExpirationDate,
  isProgramRequiredForEmployee,
  getLatestValidResult,
  calculateOverallCompletionRate,
  calculateEmployeeCompletionStatus,
  calculateProgramCompletionStatus,
  calculateMonthlyCompletions,
  calculateRetrainingCount,
  calculateFirstTimePassRate,
  calculateDashboardKPIs,
  toDashboardStats,
} from './kpiCalculator';

// ========== Test Data Factories ==========

const createEmployee = (overrides: Partial<Employee> = {}): Employee => ({
  employee_id: 'EMP001',
  employee_name: 'Test Employee',
  department: 'STITCHING',
  position: 'PRO_WORKER' as Position,
  building: 'BUILDING_A1',
  line: '1',
  hire_date: '2023-01-01',
  status: 'ACTIVE',
  updated_at: '2023-01-01',
  ...overrides,
});

const createProgram = (overrides: Partial<TrainingProgram> = {}): TrainingProgram => ({
  program_code: 'PRG001',
  program_name: 'Test Program',
  program_name_vn: 'Chương trình thử nghiệm',
  program_name_kr: '테스트 프로그램',
  category: 'QIP',
  tags: [],
  target_positions: [],
  evaluation_type: 'SCORE',
  passing_score: 80,
  grade_aa: 95,
  grade_a: 90,
  grade_b: 80,
  duration_hours: 8,
  validity_months: 12,
  is_active: true,
  created_at: '2023-01-01',
  updated_at: '2023-01-01',
  ...overrides,
});

const createResult = (overrides: Partial<TrainingResultRecord> = {}): TrainingResultRecord => ({
  result_id: 'RES001',
  session_id: 'SES001',
  employee_id: 'EMP001',
  program_code: 'PRG001',
  score: 85,
  result: 'PASS',
  training_date: '2024-01-15',
  grade: 'B',
  needs_retraining: false,
  evaluated_by: 'TRAINER001',
  remarks: '',
  created_at: '2024-01-15',
  updated_at: '2024-01-15',
  updated_by: null,
  ...overrides,
});

// ========== Tests ==========

describe('isTrainingValid', () => {
  it('should return true for PASS result within validity period', () => {
    const result = createResult({ result: 'PASS', training_date: '2024-01-01' });
    const program = createProgram({ validity_months: 12 });
    const referenceDate = new Date('2024-06-01');

    expect(isTrainingValid(result, program, referenceDate)).toBe(true);
  });

  it('should return false for PASS result after validity period', () => {
    const result = createResult({ result: 'PASS', training_date: '2023-01-01' });
    const program = createProgram({ validity_months: 12 });
    const referenceDate = new Date('2024-06-01');

    expect(isTrainingValid(result, program, referenceDate)).toBe(false);
  });

  it('should return false for FAIL result', () => {
    const result = createResult({ result: 'FAIL', training_date: '2024-01-01' });
    const program = createProgram({ validity_months: 12 });
    const referenceDate = new Date('2024-06-01');

    expect(isTrainingValid(result, program, referenceDate)).toBe(false);
  });

  it('should return true for PASS result when program has no validity period', () => {
    const result = createResult({ result: 'PASS', training_date: '2020-01-01' });
    const program = createProgram({ validity_months: undefined });
    const referenceDate = new Date('2024-06-01');

    expect(isTrainingValid(result, program, referenceDate)).toBe(true);
  });
});

describe('getExpirationDate', () => {
  it('should return correct expiration date', () => {
    const result = createResult({ training_date: '2024-01-15' });
    const program = createProgram({ validity_months: 12 });

    const expirationDate = getExpirationDate(result, program);

    expect(expirationDate).toBeInstanceOf(Date);
    expect(expirationDate?.getFullYear()).toBe(2025);
    expect(expirationDate?.getMonth()).toBe(0); // January
    expect(expirationDate?.getDate()).toBe(15);
  });

  it('should return null when program has no validity period', () => {
    const result = createResult({ training_date: '2024-01-15' });
    const program = createProgram({ validity_months: undefined });

    const expirationDate = getExpirationDate(result, program);

    expect(expirationDate).toBeNull();
  });
});

describe('isProgramRequiredForEmployee', () => {
  it('should return true when program has no target positions (applies to all)', () => {
    const employee = createEmployee({ position: 'PRO_WORKER' as Position, status: 'ACTIVE' });
    const program = createProgram({ target_positions: [], is_active: true });

    expect(isProgramRequiredForEmployee(employee, program)).toBe(true);
  });

  it('should return true when employee position matches target positions', () => {
    const employee = createEmployee({ position: 'PRO_WORKER' as Position, status: 'ACTIVE' });
    const program = createProgram({ target_positions: ['PRO_WORKER' as Position], is_active: true });

    expect(isProgramRequiredForEmployee(employee, program)).toBe(true);
  });

  it('should return false when employee position does not match', () => {
    const employee = createEmployee({ position: 'TL' as Position, status: 'ACTIVE' });
    const program = createProgram({ target_positions: ['PRO_WORKER' as Position], is_active: true });

    expect(isProgramRequiredForEmployee(employee, program)).toBe(false);
  });

  it('should return false for inactive program', () => {
    const employee = createEmployee({ position: 'PRO_WORKER' as Position, status: 'ACTIVE' });
    const program = createProgram({ target_positions: [], is_active: false });

    expect(isProgramRequiredForEmployee(employee, program)).toBe(false);
  });

  it('should return false for inactive employee', () => {
    const employee = createEmployee({ position: 'PRO_WORKER' as Position, status: 'INACTIVE' });
    const program = createProgram({ target_positions: [], is_active: true });

    expect(isProgramRequiredForEmployee(employee, program)).toBe(false);
  });
});

describe('getLatestValidResult', () => {
  it('should return the most recent valid result', () => {
    const program = createProgram({ validity_months: 12 });
    const results = [
      createResult({ result_id: 'RES001', training_date: '2024-01-01', result: 'PASS' }),
      createResult({ result_id: 'RES002', training_date: '2024-03-01', result: 'PASS' }),
      createResult({ result_id: 'RES003', training_date: '2024-02-01', result: 'PASS' }),
    ];
    const referenceDate = new Date('2024-06-01');

    const latestResult = getLatestValidResult('EMP001', 'PRG001', results, program, referenceDate);

    expect(latestResult?.result_id).toBe('RES002');
  });

  it('should return null when no valid results exist', () => {
    const program = createProgram({ validity_months: 12 });
    const results = [
      createResult({ training_date: '2022-01-01', result: 'PASS' }),
    ];
    const referenceDate = new Date('2024-06-01');

    const latestResult = getLatestValidResult('EMP001', 'PRG001', results, program, referenceDate);

    expect(latestResult).toBeNull();
  });

  it('should skip failed results', () => {
    const program = createProgram({ validity_months: 12 });
    const results = [
      createResult({ result_id: 'RES001', training_date: '2024-01-01', result: 'PASS' }),
      createResult({ result_id: 'RES002', training_date: '2024-03-01', result: 'FAIL' }),
    ];
    const referenceDate = new Date('2024-06-01');

    const latestResult = getLatestValidResult('EMP001', 'PRG001', results, program, referenceDate);

    expect(latestResult?.result_id).toBe('RES001');
  });
});

describe('calculateOverallCompletionRate', () => {
  it('should return 100% when all required trainings are completed', () => {
    const employees = [createEmployee({ employee_id: 'EMP001' })];
    const programs = [createProgram({ program_code: 'PRG001', validity_months: 12 })];
    const results = [
      createResult({
        employee_id: 'EMP001',
        program_code: 'PRG001',
        result: 'PASS',
        training_date: '2024-01-01',
      }),
    ];
    const referenceDate = new Date('2024-06-01');

    const rate = calculateOverallCompletionRate(employees, programs, results, referenceDate);

    expect(rate).toBe(100);
  });

  it('should return 0% when no trainings are completed', () => {
    const employees = [createEmployee({ employee_id: 'EMP001' })];
    const programs = [createProgram({ program_code: 'PRG001' })];
    const results: TrainingResultRecord[] = [];
    const referenceDate = new Date('2024-06-01');

    const rate = calculateOverallCompletionRate(employees, programs, results, referenceDate);

    expect(rate).toBe(0);
  });

  it('should return 50% when half of trainings are completed', () => {
    const employees = [
      createEmployee({ employee_id: 'EMP001' }),
      createEmployee({ employee_id: 'EMP002' }),
    ];
    const programs = [createProgram({ program_code: 'PRG001', validity_months: 12 })];
    const results = [
      createResult({
        employee_id: 'EMP001',
        program_code: 'PRG001',
        result: 'PASS',
        training_date: '2024-01-01',
      }),
    ];
    const referenceDate = new Date('2024-06-01');

    const rate = calculateOverallCompletionRate(employees, programs, results, referenceDate);

    expect(rate).toBe(50);
  });

  it('should return 0 when there are no employees', () => {
    const employees: Employee[] = [];
    const programs = [createProgram()];
    const results: TrainingResultRecord[] = [];

    const rate = calculateOverallCompletionRate(employees, programs, results);

    expect(rate).toBe(0);
  });

  it('should return 0 when there are no programs', () => {
    const employees = [createEmployee()];
    const programs: TrainingProgram[] = [];
    const results: TrainingResultRecord[] = [];

    const rate = calculateOverallCompletionRate(employees, programs, results);

    expect(rate).toBe(0);
  });
});

describe('calculateEmployeeCompletionStatus', () => {
  it('should calculate correct completion status', () => {
    const employee = createEmployee({ employee_id: 'EMP001' });
    const programs = [
      createProgram({ program_code: 'PRG001', validity_months: 12 }),
      createProgram({ program_code: 'PRG002', validity_months: 12 }),
    ];
    const results = [
      createResult({
        employee_id: 'EMP001',
        program_code: 'PRG001',
        result: 'PASS',
        training_date: '2024-01-01',
      }),
    ];
    const referenceDate = new Date('2024-06-01');

    const status = calculateEmployeeCompletionStatus(employee, programs, results, referenceDate);

    expect(status.employee_id).toBe('EMP001');
    expect(status.required_programs).toBe(2);
    expect(status.completed_programs).toBe(1);
    expect(status.completion_rate).toBe(50);
  });

  it('should detect expiring trainings', () => {
    const employee = createEmployee({ employee_id: 'EMP001' });
    const programs = [createProgram({ program_code: 'PRG001', validity_months: 6 })];
    const results = [
      createResult({
        employee_id: 'EMP001',
        program_code: 'PRG001',
        result: 'PASS',
        training_date: '2024-01-01',
      }),
    ];
    // Reference date close to expiration
    const referenceDate = new Date('2024-06-15');

    const status = calculateEmployeeCompletionStatus(employee, programs, results, referenceDate);

    expect(status.expiring_count).toBe(1);
  });
});

describe('calculateProgramCompletionStatus', () => {
  it('should calculate correct program completion status', () => {
    const program = createProgram({ program_code: 'PRG001', validity_months: 12 });
    const employees = [
      createEmployee({ employee_id: 'EMP001' }),
      createEmployee({ employee_id: 'EMP002' }),
    ];
    const results = [
      createResult({
        employee_id: 'EMP001',
        program_code: 'PRG001',
        result: 'PASS',
        training_date: '2024-01-01',
        score: 90,
      }),
    ];
    const referenceDate = new Date('2024-06-01');

    const status = calculateProgramCompletionStatus(program, employees, results, referenceDate);

    expect(status.program_code).toBe('PRG001');
    expect(status.target_employee_count).toBe(2);
    expect(status.completed_count).toBe(1);
    expect(status.completion_rate).toBe(50);
    expect(status.average_score).toBe(90);
  });

  it('should calculate pass rate correctly', () => {
    const program = createProgram({ program_code: 'PRG001', validity_months: 12 });
    const employees = [createEmployee({ employee_id: 'EMP001' })];
    const results = [
      createResult({
        result_id: 'RES001',
        employee_id: 'EMP001',
        program_code: 'PRG001',
        result: 'PASS',
        training_date: '2024-01-01',
      }),
      createResult({
        result_id: 'RES002',
        employee_id: 'EMP001',
        program_code: 'PRG001',
        result: 'FAIL',
        training_date: '2023-12-01',
      }),
    ];
    const referenceDate = new Date('2024-06-01');

    const status = calculateProgramCompletionStatus(program, employees, results, referenceDate);

    expect(status.pass_rate).toBe(50);
  });
});

describe('calculateMonthlyCompletions', () => {
  it('should count completions in the current month', () => {
    const results = [
      createResult({ training_date: '2024-06-05', result: 'PASS' }),
      createResult({ training_date: '2024-06-15', result: 'PASS', result_id: 'RES002' }),
      createResult({ training_date: '2024-05-15', result: 'PASS', result_id: 'RES003' }),
      createResult({ training_date: '2024-06-20', result: 'FAIL', result_id: 'RES004' }),
    ];
    const referenceDate = new Date('2024-06-25');

    const count = calculateMonthlyCompletions(results, referenceDate);

    expect(count).toBe(2);
  });

  it('should return 0 when no completions in current month', () => {
    const results = [
      createResult({ training_date: '2024-05-05', result: 'PASS' }),
    ];
    const referenceDate = new Date('2024-06-25');

    const count = calculateMonthlyCompletions(results, referenceDate);

    expect(count).toBe(0);
  });
});

describe('calculateRetrainingCount', () => {
  it('should count employees who failed', () => {
    const employees = [createEmployee({ employee_id: 'EMP001' })];
    const programs = [createProgram({ program_code: 'PRG001' })];
    const results = [
      createResult({
        employee_id: 'EMP001',
        program_code: 'PRG001',
        result: 'FAIL',
        training_date: '2024-01-01',
      }),
    ];

    const count = calculateRetrainingCount(employees, programs, results);

    expect(count).toBe(1);
  });

  it('should count employees with expired trainings', () => {
    const employees = [createEmployee({ employee_id: 'EMP001' })];
    const programs = [createProgram({ program_code: 'PRG001', validity_months: 6 })];
    const results = [
      createResult({
        employee_id: 'EMP001',
        program_code: 'PRG001',
        result: 'PASS',
        training_date: '2023-01-01',
      }),
    ];
    const referenceDate = new Date('2024-06-01');

    const count = calculateRetrainingCount(employees, programs, results, referenceDate);

    expect(count).toBe(1);
  });

  it('should not count employees with valid trainings', () => {
    const employees = [createEmployee({ employee_id: 'EMP001' })];
    const programs = [createProgram({ program_code: 'PRG001', validity_months: 12 })];
    const results = [
      createResult({
        employee_id: 'EMP001',
        program_code: 'PRG001',
        result: 'PASS',
        training_date: '2024-01-01',
      }),
    ];
    const referenceDate = new Date('2024-06-01');

    const count = calculateRetrainingCount(employees, programs, results, referenceDate);

    expect(count).toBe(0);
  });
});

describe('calculateFirstTimePassRate', () => {
  it('should calculate first-time pass rate correctly', () => {
    const results = [
      // Employee 1 - passed first time
      createResult({
        result_id: 'RES001',
        employee_id: 'EMP001',
        program_code: 'PRG001',
        result: 'PASS',
        training_date: '2024-01-01',
      }),
      // Employee 2 - failed first, passed second
      createResult({
        result_id: 'RES002',
        employee_id: 'EMP002',
        program_code: 'PRG001',
        result: 'FAIL',
        training_date: '2024-01-01',
      }),
      createResult({
        result_id: 'RES003',
        employee_id: 'EMP002',
        program_code: 'PRG001',
        result: 'PASS',
        training_date: '2024-02-01',
      }),
    ];

    const rate = calculateFirstTimePassRate(results);

    expect(rate).toBe(50); // 1 out of 2 first attempts passed
  });

  it('should return 0 when no results exist', () => {
    const results: TrainingResultRecord[] = [];

    const rate = calculateFirstTimePassRate(results);

    expect(rate).toBe(0);
  });

  it('should ignore ABSENT results', () => {
    const results = [
      createResult({
        result_id: 'RES001',
        employee_id: 'EMP001',
        program_code: 'PRG001',
        result: 'ABSENT',
        training_date: '2024-01-01',
      }),
      createResult({
        result_id: 'RES002',
        employee_id: 'EMP001',
        program_code: 'PRG001',
        result: 'PASS',
        training_date: '2024-02-01',
      }),
    ];

    const rate = calculateFirstTimePassRate(results);

    expect(rate).toBe(100); // ABSENT is ignored, PASS is counted
  });
});

describe('calculateDashboardKPIs', () => {
  it('should calculate all KPIs correctly', () => {
    const employees = [
      createEmployee({ employee_id: 'EMP001' }),
      createEmployee({ employee_id: 'EMP002' }),
    ];
    const programs = [createProgram({ program_code: 'PRG001', validity_months: 12 })];
    const results = [
      createResult({
        employee_id: 'EMP001',
        program_code: 'PRG001',
        result: 'PASS',
        training_date: '2024-06-01',
        score: 90,
      }),
    ];
    const referenceDate = new Date('2024-06-15');

    const kpis = calculateDashboardKPIs(employees, programs, results, referenceDate);

    expect(kpis.totalEmployees).toBe(2);
    expect(kpis.monthlyCompletions).toBe(1);
    expect(kpis.overallCompletionRate).toBe(50);
    expect(kpis.passRate).toBe(100);
    expect(kpis.averageScore).toBe(90);
  });
});

describe('toDashboardStats', () => {
  it('should convert KPI result to dashboard stats format', () => {
    const kpi = {
      totalEmployees: 100,
      monthlyCompletions: 25,
      overallCompletionRate: 75,
      retrainingCount: 10,
      passRate: 90,
      firstTimePassRate: 85,
      averageScore: 82,
      expiringCount: 5,
    };

    const stats = toDashboardStats(kpi);

    expect(stats.totalEmployees).toBe(100);
    expect(stats.monthlyCompletions).toBe(25);
    expect(stats.overallCompletionRate).toBe(75);
    expect(stats.retrainingCount).toBe(10);
  });
});
