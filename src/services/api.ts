// ============================================================
// Q-TRAIN API Service
// Firebase Firestore-based API layer
// All data is stored in and retrieved from Firebase Firestore
// ============================================================

import {
  calculateDashboardKPIs,
  toDashboardStats,
} from '@/utils/kpiCalculator';
import { logger } from '@/utils/logger';

import * as employeeService from './employeeService';
import * as programService from './programService';
import * as sessionService from './sessionService';
import * as resultService from './resultService';
import * as logService from './logService';
import * as tqcService from './tqcService';
import * as attendanceService from './attendanceService';
import * as materialService from './materialService';
import * as evaluationService from './evaluationService';
import * as notificationService from './notificationService';
import * as auditLogService from './auditLogService';
import * as trainerService from './trainerService';
import * as trainingPlanService from './trainingPlanService';
import * as auditComplianceService from './auditComplianceService';
import * as capaService from './capaService';
import * as mdInspectionService from './mdInspectionService';
import * as techModelService from './techModelService';
import * as aqlService from './aqlService';
import { updateResultWithLog } from '@/services/firebase';

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
  ProgramChangeLog,
  ResultEditLog,
  // New TQC Types
  NewTQCTeam,
  NewTQCTrainee,
  NewTQCTraineeFilters,
  NewTQCColorBlindTest,
  NewTQCColorBlindTestInput,
  NewTQCTrainingStage,
  NewTQCStageUpdate,
  NewTQCMeeting,
  NewTQCMeetingFilters,
  NewTQCMeetingInput,
  NewTQCMeetingUpdate,
  NewTQCResignation,
  NewTQCResignationFilters,
  NewTQCResignationInput,
  NewTQCTraineeInput,
  NewTQCTraineeUpdate,
  NewTQCTeamInput,
  NewTQCTeamUpdate,
  NewTQCDashboardStats,
  NewTQCResignationAnalysis,
  NewTQCTraineeWithDetails,
  // Attendance Types
  BulkAttendanceInput,
  Attendance,
  // AuditLog Types
  AuditLogEntry,
  AuditLogFilters,
} from '@/types';
import type { TrainingMaterial, MaterialFolder, MaterialFilters } from '@/types/material';
import type {
  TrainingEvaluation,
  EvaluationFilters,
} from './evaluationService';
import type {
  NotificationSettingsData,
  NotificationQueryFilters,
} from './notificationService';
import type { Notification } from '@/types/notification';

// ========== Error Classes ==========

export class ApiError extends Error {
  code: string;
  status?: number;
  details?: unknown;

  constructor(
    message: string,
    code: string,
    status?: number,
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class NetworkError extends ApiError {
  constructor(message: string = '네트워크 연결을 확인해주세요') {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends ApiError {
  constructor(message: string = '요청 시간이 초과되었습니다') {
    super(message, 'TIMEOUT_ERROR');
    this.name = 'TimeoutError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = '요청한 리소스를 찾을 수 없습니다') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

// ========== Cache Implementation ==========

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, data: T, ttl: number = CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

const apiCache = new ApiCache();

// ========== Retry Logic ==========

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const RETRY_BACKOFF = 2;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delayMs: number = RETRY_DELAY
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }

      if (attempt < retries) {
        const waitTime = delayMs * Math.pow(RETRY_BACKOFF, attempt);
        await delay(waitTime);
      }
    }
  }

  throw lastError!;
}

// ========== Cache Invalidation Helpers ==========

export function invalidateEmployeeCache(): void {
  apiCache.invalidate('employees');
}

export function invalidateProgramCache(): void {
  apiCache.invalidate('programs');
}

export function invalidateSessionCache(): void {
  apiCache.invalidate('sessions');
}

export function invalidateResultCache(): void {
  apiCache.invalidate('results');
}

export function invalidateDashboardCache(): void {
  apiCache.invalidate('dashboard');
}

export function invalidateMaterialCache(): void {
  apiCache.invalidate('materials');
}

export function invalidateEvaluationCache(): void {
  apiCache.invalidate('evaluations');
}

export function invalidateNotificationCache(): void {
  apiCache.invalidate('notifications');
}

export function invalidateAllCache(): void {
  apiCache.invalidate();
}

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
  return employeeService.getEmployees(filters);
}

export async function getEmployee(id: string): Promise<Employee | null> {
  return employeeService.getEmployee(id);
}

export async function getEmployeeHistory(id: string): Promise<TrainingResultRecord[]> {
  return resultService.getResultsByEmployee(id);
}

export async function createEmployee(employee: Omit<Employee, 'updated_at'>): Promise<Employee> {
  const result = await employeeService.createEmployee(employee);
  invalidateEmployeeCache();
  return result;
}

export async function updateEmployee(
  id: string,
  updates: Partial<Employee>
): Promise<Employee | null> {
  await employeeService.updateEmployee(id, updates);
  invalidateEmployeeCache();
  return employeeService.getEmployee(id);
}

export async function batchUpsertEmployees(
  employees: Omit<Employee, 'updated_at'>[]
): Promise<number> {
  const result = await employeeService.batchUpsertEmployees(employees);
  invalidateEmployeeCache();
  return result;
}

// ========== Training Program API ==========

export async function getPrograms(filters?: ProgramFilters): Promise<TrainingProgram[]> {
  return programService.getPrograms(filters);
}

export async function getProgram(code: string): Promise<TrainingProgram | null> {
  return programService.getProgram(code);
}

export async function createProgram(
  program: Omit<TrainingProgram, 'created_at' | 'updated_at'>
): Promise<TrainingProgram> {
  const newProgram = await programService.createProgram(program);

  // Log the creation (non-blocking: log failure should not block program creation)
  try {
    await logService.logProgramChange(program.program_code, 'CREATE', null, newProgram);
  } catch (logError) {
    logger.error('[api] Failed to log program creation:', logError);
  }

  invalidateProgramCache();
  return newProgram;
}

export async function updateProgram(
  code: string,
  updates: Partial<TrainingProgram>
): Promise<TrainingProgram | null> {
  // Capture before state
  const beforeData = await programService.getProgram(code);
  if (!beforeData) return null;

  await programService.updateProgram(code, updates);

  // Re-fetch updated document
  const afterData = await programService.getProgram(code);

  // Log the update (non-blocking: log failure should not block program update)
  try {
    await logService.logProgramChange(code, 'UPDATE', beforeData, afterData);
  } catch (logError) {
    logger.error('[api] Failed to log program update:', logError);
  }

  invalidateProgramCache();
  return afterData;
}

export async function deleteProgram(code: string): Promise<boolean> {
  // Soft delete - set is_active to false (NO DELETE POLICY)
  const beforeData = await programService.getProgram(code);
  if (!beforeData) return false;

  await programService.deleteProgram(code);

  // Re-fetch for after state
  const afterData = await programService.getProgram(code);

  // Log the soft delete (non-blocking: log failure should not block program deletion)
  try {
    await logService.logProgramChange(code, 'DELETE', beforeData, afterData);
  } catch (logError) {
    logger.error('[api] Failed to log program deletion:', logError);
  }

  invalidateProgramCache();
  return true;
}

// ========== Training Session API ==========

export async function getSessions(filters?: SessionFilters): Promise<TrainingSession[]> {
  return sessionService.getSessions(filters);
}

export async function createSession(
  session: Omit<TrainingSession, 'session_id' | 'created_at'>
): Promise<TrainingSession> {
  const result = await sessionService.createSession(session);
  invalidateSessionCache();
  return result;
}

export async function updateSession(
  id: string,
  updates: Partial<TrainingSession>
): Promise<TrainingSession | null> {
  await sessionService.updateSession(id, updates);
  invalidateSessionCache();
  return sessionService.getSession(id);
}

export async function cancelSession(id: string): Promise<boolean> {
  const session = await sessionService.getSession(id);
  if (!session) return false;

  await sessionService.cancelSession(id);
  invalidateSessionCache();
  return true;
}

// ========== Training Result API ==========

export async function getResults(filters?: ResultFilters): Promise<TrainingResultRecord[]> {
  return resultService.getResults(filters);
}

export async function recordResults(results: ResultInput[]): Promise<TrainingResultRecord[]> {
  const programs = await programService.getPrograms();
  const newResults: TrainingResultRecord[] = [];

  for (const input of results) {
    const program = programs.find(p => p.program_code === input.program_code);
    if (!program) continue;

    const grade =
      input.score !== null
        ? calculateGrade(input.score, program.grade_aa, program.grade_a, program.grade_b)
        : null;

    const needsRetraining = input.result === 'FAIL' || input.result === 'ABSENT';

    const resultData = {
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
    };

    const created = await resultService.createResult(resultData);
    newResults.push(created);
  }

  invalidateResultCache();
  invalidateDashboardCache();
  return newResults;
}

export async function updateResult(update: ResultUpdate): Promise<TrainingResultRecord | null> {
  // NOTE: This updates a result and logs the change (NO DELETE POLICY)
  const existing = await resultService.getResult(update.result_id);
  if (!existing) return null;

  const programs = await programService.getPrograms();
  const program = programs.find(p => p.program_code === existing.program_code);

  let newGrade = existing.grade;
  let newNeedsRetraining = existing.needs_retraining;

  if (update.score !== undefined && program) {
    newGrade =
      update.score !== null
        ? calculateGrade(update.score, program.grade_aa, program.grade_a, program.grade_b)
        : null;
  }

  if (update.result !== undefined) {
    newNeedsRetraining = update.result === 'FAIL' || update.result === 'ABSENT';
  }

  const updates: Partial<TrainingResultRecord> = {
    score: update.score !== undefined ? update.score : existing.score,
    grade: newGrade,
    result: update.result || existing.result,
    remarks: update.remarks !== undefined ? update.remarks : existing.remarks,
    needs_retraining: newNeedsRetraining,
    updated_by: 'current_user',
  };

  // Atomic transaction: update result + create edit log together
  await updateResultWithLog(update.result_id, updates, {
    edited_by: 'current_user',
    edit_reason: update.edit_reason || '결과 수정',
    after_data: JSON.stringify(updates),
  });

  // Re-fetch updated result for return
  const afterData = await resultService.getResult(update.result_id);

  invalidateResultCache();
  invalidateDashboardCache();
  return afterData;
}

// ========== Change Log Functions ==========

export async function getProgramChangeLogs(
  programCode?: string
): Promise<ProgramChangeLog[]> {
  return logService.getProgramChangeLogs(programCode);
}

export async function getResultEditLogs(
  resultId?: string
): Promise<ResultEditLog[]> {
  return logService.getResultEditLogs(resultId);
}

// ========== Dashboard API ==========

export async function getDashboardStats(): Promise<DashboardStats> {
  const cached = apiCache.get<DashboardStats>('dashboard:stats');
  if (cached) return cached;

  const [employees, programs, results] = await Promise.all([
    employeeService.getEmployees(),
    programService.getPrograms(),
    resultService.getResults(),
  ]);

  const kpiResult = calculateDashboardKPIs(employees, programs, results);
  const stats = toDashboardStats(kpiResult);

  // Override totalEmployees with live Google Drive CSV data
  try {
    const manpower = await aqlService.fetchAqlManpower();
    const activeCount = manpower.data.filter(row => !row.stop_working_date).length;
    if (activeCount > 0) {
      stats.totalEmployees = activeCount;
    }
  } catch (error) {
    logger.warn('[api] Failed to fetch manpower from Drive, using Firestore employee count:', error);
  }

  apiCache.set('dashboard:stats', stats);
  return stats;
}

export async function getMonthlyTrainingData(): Promise<MonthlyTrainingData[]> {
  const cached = apiCache.get<MonthlyTrainingData[]>('dashboard:monthly');
  if (cached) return cached;

  const sessions = await sessionService.getSessions();

  const monthlyData: Record<string, { planned: number; completed: number }> = {};

  // Get last 6 months
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = date.toISOString().substring(0, 7);
    monthlyData[monthKey] = { planned: 0, completed: 0 };
  }

  // Count sessions
  for (const session of sessions) {
    const monthKey = session.session_date.substring(0, 7);
    if (monthlyData[monthKey]) {
      monthlyData[monthKey].planned += session.attendees?.length || 0;
      if (session.status === 'COMPLETED') {
        monthlyData[monthKey].completed += session.attendees?.length || 0;
      }
    }
  }

  const result = Object.entries(monthlyData).map(([month, data]) => ({
    month,
    ...data,
  }));

  apiCache.set('dashboard:monthly', result);
  return result;
}

export async function getGradeDistribution(): Promise<GradeDistribution[]> {
  const cached = apiCache.get<GradeDistribution[]>('dashboard:grades');
  if (cached) return cached;

  const results = await resultService.getResults();

  const counts: Record<Grade, number> = { AA: 0, A: 0, B: 0, C: 0 };
  let total = 0;

  for (const result of results) {
    if (result.grade) {
      counts[result.grade]++;
      total++;
    }
  }

  const grades: Grade[] = ['AA', 'A', 'B', 'C'];
  const distribution = grades.map(grade => ({
    grade,
    count: counts[grade],
    percentage: total > 0 ? Math.round((counts[grade] / total) * 100) : 0,
  }));

  apiCache.set('dashboard:grades', distribution);
  return distribution;
}

// ========== Progress Matrix API ==========

export async function getProgressMatrix(
  filters?: ProgressMatrixFilters
): Promise<ProgressMatrixData> {
  const [allEmployees, allPrograms, allResults] = await Promise.all([
    employeeService.getEmployees(),
    programService.getPrograms(),
    resultService.getResults(),
  ]);

  let employees = allEmployees.filter(e => e.status === 'ACTIVE');
  const programs = allPrograms.filter(p => p.is_active);

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
      const employeeResults = allResults
        .filter(
          r => r.employee_id === employee.employee_id && r.program_code === program.program_code
        )
        .sort((a, b) => b.training_date.localeCompare(a.training_date));

      const lastResult = employeeResults[0];

      let status: 'PASS' | 'FAIL' | 'EXPIRING' | 'EXPIRED' | 'NOT_TAKEN' = 'NOT_TAKEN';
      let expirationDate: string | undefined;

      if (lastResult) {
        if (lastResult.result === 'PASS') {
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

// ========== Retraining API ==========

export async function getRetrainingTargets(): Promise<RetrainingTarget[]> {
  const [allResults, allEmployees, allPrograms] = await Promise.all([
    resultService.getResults(),
    employeeService.getEmployees(),
    programService.getPrograms(),
  ]);

  const targets: RetrainingTarget[] = [];
  const now = new Date();
  const EXPIRING_THRESHOLD_DAYS = 30;

  const determineReason = (
    result: TrainingResultRecord,
    program: TrainingProgram
  ): 'FAILED' | 'EXPIRED' | 'EXPIRING_SOON' => {
    if (result.result === 'FAIL' || result.result === 'ABSENT') {
      return 'FAILED';
    }

    if (result.result === 'PASS' && program.validity_months) {
      const resultDate = new Date(result.training_date);
      const expDate = new Date(resultDate);
      expDate.setMonth(expDate.getMonth() + program.validity_months);

      const daysUntilExpiry = Math.ceil(
        (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry <= 0) {
        return 'EXPIRED';
      }
      if (daysUntilExpiry <= EXPIRING_THRESHOLD_DAYS) {
        return 'EXPIRING_SOON';
      }
    }

    return 'FAILED';
  };

  const retrainingResults = allResults.filter(r => r.needs_retraining);

  for (const result of retrainingResults) {
    const employee = allEmployees.find(e => e.employee_id === result.employee_id);
    const program = allPrograms.find(p => p.program_code === result.program_code);

    if (employee && program && employee.status === 'ACTIVE') {
      const retrainingPrograms = allPrograms.filter(
        p =>
          p.category === 'RETRAINING' &&
          p.is_active &&
          p.target_positions.includes(employee.position)
      );

      targets.push({
        employee,
        program,
        lastResult: result,
        reason: determineReason(result, program),
        recommendedPrograms: retrainingPrograms.slice(0, 3),
      });
    }
  }

  return targets;
}

export async function getExpiringTrainings(days: number = 30): Promise<ExpiringTraining[]> {
  const [allResults, allEmployees, allPrograms] = await Promise.all([
    resultService.getResults(),
    employeeService.getEmployees(),
    programService.getPrograms(),
  ]);

  const expiring: ExpiringTraining[] = [];
  const now = new Date();

  // Group results by employee and program, get latest PASS
  const latestPasses: Record<string, TrainingResultRecord> = {};

  for (const result of allResults) {
    if (result.result !== 'PASS') continue;

    const key = `${result.employee_id}-${result.program_code}`;
    if (!latestPasses[key] || result.training_date > latestPasses[key].training_date) {
      latestPasses[key] = result;
    }
  }

  for (const result of Object.values(latestPasses)) {
    const program = allPrograms.find(p => p.program_code === result.program_code);
    if (!program || !program.validity_months) continue;

    const employee = allEmployees.find(e => e.employee_id === result.employee_id);
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

// ========== Search API ==========

export async function globalSearch(query: string): Promise<{
  employees: Employee[];
  programs: TrainingProgram[];
}> {
  const [allEmployees, allPrograms] = await Promise.all([
    employeeService.getEmployees(),
    programService.getPrograms(),
  ]);

  const queryLower = query.toLowerCase();

  const employees = allEmployees.filter(
    e =>
      e.employee_id.toLowerCase().includes(queryLower) ||
      e.employee_name.toLowerCase().includes(queryLower)
  );

  const programs = allPrograms.filter(
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

// ============================================================
// New TQC (신입 TQC 교육) API
// ============================================================

// ========== New TQC Team API ==========

export async function getNewTQCTeams(includeInactive = false): Promise<NewTQCTeam[]> {
  return tqcService.getTeams(includeInactive);
}

export async function getNewTQCTeamById(teamId: string): Promise<NewTQCTeam | null> {
  return tqcService.getTeamById(teamId);
}

export async function createNewTQCTeam(input: NewTQCTeamInput): Promise<NewTQCTeam> {
  return tqcService.createTeam(input);
}

export async function updateNewTQCTeam(input: NewTQCTeamUpdate): Promise<NewTQCTeam | null> {
  return tqcService.updateTeam(input);
}

export async function deleteNewTQCTeam(teamId: string): Promise<boolean> {
  return tqcService.deleteTeam(teamId);
}

// ========== New TQC Trainee API ==========

export async function getNewTQCTrainees(
  filters?: NewTQCTraineeFilters
): Promise<NewTQCTrainee[]> {
  return tqcService.getTrainees(filters);
}

export async function getNewTQCTraineeById(traineeId: string): Promise<NewTQCTrainee | null> {
  return tqcService.getTraineeById(traineeId);
}

export async function getNewTQCTraineeWithDetails(
  traineeId: string
): Promise<NewTQCTraineeWithDetails | null> {
  const trainee = await tqcService.getTraineeById(traineeId);
  if (!trainee) return null;

  const [team, stages, colorBlindTests, meetings, resignations] = await Promise.all([
    tqcService.getTeamById(trainee.team_id),
    tqcService.getStagesByTrainee(traineeId),
    tqcService.getColorBlindTests(traineeId),
    tqcService.getMeetings({ traineeId }),
    tqcService.getResignations(),
  ]);

  const resignation = resignations.find(r => r.trainee_id === traineeId);

  return {
    ...trainee,
    team: team || undefined,
    stages: stages.sort((a, b) => a.stage_order - b.stage_order),
    colorBlindTests: colorBlindTests.sort((a, b) => b.test_date.localeCompare(a.test_date)),
    meetings: meetings.sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date)),
    resignation,
  };
}

export async function createNewTQCTrainee(input: NewTQCTraineeInput): Promise<NewTQCTrainee> {
  const now = new Date().toISOString();
  const startDate = new Date(input.start_date);
  const startOfYear = new Date(startDate.getFullYear(), 0, 1);
  const weekNum = Math.ceil(
    ((startDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24) + 1) / 7
  );

  // Generate trainee ID
  const existingTrainees = await tqcService.getTrainees();
  const traineeCount = existingTrainees.length + 1;
  const traineeId = `TRN-${new Date().getFullYear()}-${String(traineeCount).padStart(3, '0')}`;

  const expectedEndDate = new Date(startDate);
  expectedEndDate.setMonth(expectedEndDate.getMonth() + 3);

  const newTrainee: NewTQCTrainee = {
    trainee_id: traineeId,
    employee_id: input.employee_id,
    name: input.name,
    team_id: input.team_id,
    trainer_id: input.trainer_id,
    start_week: weekNum,
    start_date: input.start_date,
    expected_end_date: expectedEndDate.toISOString().split('T')[0],
    introducer: input.introducer,
    building: input.building,
    working_area: input.working_area,
    status: 'IN_TRAINING',
    color_blind_status: null,
    progress_percentage: 0,
    notes: input.notes,
    created_at: now,
    updated_at: now,
    created_by: 'admin',
  };

  // Create default training stages
  const defaultStages = ['Orientation', 'Basic Training', 'Line Assignment', 'Field Evaluation'];
  const stages: NewTQCTrainingStage[] = defaultStages.map((stageName, index) => ({
    stage_id: `STG-${traineeId.split('-').slice(1).join('-')}-${index + 1}`,
    trainee_id: traineeId,
    stage_name: stageName,
    stage_order: index + 1,
    status: 'PENDING' as const,
    updated_at: now,
  }));

  // Auto-create scheduled meetings (1WEEK, 1MONTH, 3MONTH)
  const meetingTypes: Array<'1WEEK' | '1MONTH' | '3MONTH'> = ['1WEEK', '1MONTH', '3MONTH'];
  const meetings: NewTQCMeeting[] = meetingTypes.map((type) => {
    const meetingDate = new Date(startDate);
    if (type === '1WEEK') {
      meetingDate.setDate(meetingDate.getDate() + 7);
    } else if (type === '1MONTH') {
      meetingDate.setMonth(meetingDate.getMonth() + 1);
    } else {
      meetingDate.setMonth(meetingDate.getMonth() + 3);
    }

    return {
      meeting_id: `MTG-${traineeId.split('-').slice(1).join('-')}-${type}`,
      trainee_id: traineeId,
      meeting_type: type,
      scheduled_date: meetingDate.toISOString().split('T')[0],
      status: 'SCHEDULED' as const,
      attendees: [input.trainer_id],
      notes: undefined,
      created_at: now,
      updated_at: now,
    };
  });

  // Write all to Firestore atomically
  await tqcService.createTrainee(newTrainee);
  await tqcService.batchCreateStagesAndMeetings(stages, meetings);

  return newTrainee;
}

export async function updateNewTQCTrainee(
  input: NewTQCTraineeUpdate
): Promise<NewTQCTrainee | null> {
  const existing = await tqcService.getTraineeById(input.trainee_id);
  if (!existing) return null;

  await tqcService.updateTrainee(input.trainee_id, {
    ...input,
    updated_at: new Date().toISOString(),
  });

  return tqcService.getTraineeById(input.trainee_id);
}

// ========== New TQC Color Blind Test API ==========

export async function getNewTQCColorBlindTests(traineeId?: string): Promise<NewTQCColorBlindTest[]> {
  return tqcService.getColorBlindTests(traineeId);
}

export async function createNewTQCColorBlindTest(
  input: NewTQCColorBlindTestInput
): Promise<NewTQCColorBlindTest> {
  const now = new Date().toISOString();
  const existingTests = await tqcService.getColorBlindTests();
  const testCount = existingTests.length + 1;

  const newTest: NewTQCColorBlindTest = {
    test_id: `CBT-${new Date().getFullYear()}-${String(testCount).padStart(3, '0')}`,
    trainee_id: input.trainee_id,
    test_date: input.test_date,
    result: input.result,
    notes: input.notes,
    tested_by: 'admin',
    created_at: now,
  };

  await tqcService.createColorBlindTest(newTest);

  // Update trainee's color_blind_status
  await tqcService.updateTrainee(input.trainee_id, {
    color_blind_status: input.result,
    updated_at: now,
  });

  return newTest;
}

// ========== New TQC Training Stage API ==========

export async function getNewTQCTrainingStages(traineeId: string): Promise<NewTQCTrainingStage[]> {
  return tqcService.getStagesByTrainee(traineeId);
}

export async function updateNewTQCTrainingStage(
  input: NewTQCStageUpdate
): Promise<NewTQCTrainingStage | null> {
  const stages = await tqcService.getStagesByTrainee('');
  const existingStage = stages.find(s => s.stage_id === input.stage_id);
  if (!existingStage) {
    // Fallback: try fetching all stages to find this one
    // We need the trainee_id to update progress
  }

  const now = new Date().toISOString();
  await tqcService.updateStage(input.stage_id, {
    ...input,
    updated_at: now,
    updated_by: 'admin',
  });

  // Find the trainee_id by querying stages that match this stage_id
  // Re-fetch the stage to get trainee_id
  // Since we can't query by stage_id in the stages collection easily,
  // we need to get all stages or pass trainee_id
  // For now, we'll search through stages to find the trainee_id
  const allTrainees = await tqcService.getTrainees();
  for (const trainee of allTrainees) {
    const traineeStages = await tqcService.getStagesByTrainee(trainee.trainee_id);
    const matchingStage = traineeStages.find(s => s.stage_id === input.stage_id);
    if (matchingStage) {
      // Update trainee progress
      const completedCount = traineeStages.filter(s =>
        s.stage_id === input.stage_id
          ? (input.status || s.status) === 'COMPLETED'
          : s.status === 'COMPLETED'
      ).length;
      const progress = Math.round((completedCount / traineeStages.length) * 100);

      const traineeUpdates: Partial<NewTQCTrainee> = {
        progress_percentage: progress,
        updated_at: now,
      };

      if (progress === 100) {
        traineeUpdates.status = 'COMPLETED';
      }

      await tqcService.updateTrainee(trainee.trainee_id, traineeUpdates);

      // Return updated stage
      const updatedStages = await tqcService.getStagesByTrainee(trainee.trainee_id);
      return updatedStages.find(s => s.stage_id === input.stage_id) || null;
    }
  }

  return null;
}

// ========== New TQC Meeting API ==========

export async function getNewTQCMeetings(filters?: NewTQCMeetingFilters): Promise<NewTQCMeeting[]> {
  return tqcService.getMeetings(filters);
}

export async function createNewTQCMeeting(input: NewTQCMeetingInput): Promise<NewTQCMeeting> {
  const now = new Date().toISOString();
  const existingMeetings = await tqcService.getMeetings();
  const meetingCount = existingMeetings.length + 1;

  const newMeeting: NewTQCMeeting = {
    meeting_id: `MTG-${String(meetingCount).padStart(3, '0')}-${input.meeting_type}`,
    trainee_id: input.trainee_id,
    meeting_type: input.meeting_type,
    scheduled_date: input.scheduled_date,
    status: 'SCHEDULED',
    attendees: input.attendees || [],
    notes: input.notes,
    created_at: now,
    updated_at: now,
  };

  await tqcService.createMeeting(newMeeting);
  return newMeeting;
}

export async function updateNewTQCMeeting(
  input: NewTQCMeetingUpdate
): Promise<NewTQCMeeting | null> {
  const now = new Date().toISOString();
  await tqcService.updateMeeting(input.meeting_id, {
    ...input,
    updated_at: now,
  });

  // Update trainee's meeting date if completed
  if (input.status === 'COMPLETED' && input.completed_date) {
    const meetings = await tqcService.getMeetings();
    const meeting = meetings.find(m => m.meeting_id === input.meeting_id);
    if (meeting) {
      const traineeUpdates: Partial<NewTQCTrainee> = { updated_at: now };
      if (meeting.meeting_type === '1WEEK') {
        traineeUpdates.meeting_1week_date = input.completed_date;
      } else if (meeting.meeting_type === '1MONTH') {
        traineeUpdates.meeting_1month_date = input.completed_date;
      } else if (meeting.meeting_type === '3MONTH') {
        traineeUpdates.meeting_3month_date = input.completed_date;
      }
      await tqcService.updateTrainee(meeting.trainee_id, traineeUpdates);
    }
  }

  // Return updated meeting
  const updatedMeetings = await tqcService.getMeetings();
  return updatedMeetings.find(m => m.meeting_id === input.meeting_id) || null;
}

// ========== New TQC Resignation API ==========

export async function getNewTQCResignations(
  filters?: NewTQCResignationFilters
): Promise<NewTQCResignation[]> {
  let result = await tqcService.getResignations(filters);

  // Additional filters that require trainee data
  if (filters?.trainer && filters.trainer !== 'all') {
    const trainees = await tqcService.getTrainees();
    const traineeIds = trainees
      .filter(t => t.trainer_id === filters.trainer)
      .map(t => t.trainee_id);
    result = result.filter(r => traineeIds.includes(r.trainee_id));
  }

  if (filters?.team && filters.team !== 'all') {
    const trainees = await tqcService.getTrainees();
    const traineeIds = trainees
      .filter(t => t.team_id === filters.team)
      .map(t => t.trainee_id);
    result = result.filter(r => traineeIds.includes(r.trainee_id));
  }

  return result;
}

export async function createNewTQCResignation(
  input: NewTQCResignationInput
): Promise<NewTQCResignation> {
  const now = new Date().toISOString();
  const trainee = await tqcService.getTraineeById(input.trainee_id);
  if (!trainee) throw new NotFoundError('Trainee not found');

  const startDate = new Date(trainee.start_date);
  const resignDate = new Date(input.resign_date);
  const trainingDays = Math.ceil(
    (resignDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const stages = await tqcService.getStagesByTrainee(input.trainee_id);
  const completedStages = stages.filter(s => s.status === 'COMPLETED');
  const lastCompletedStage =
    completedStages.length > 0
      ? completedStages.sort((a, b) => b.stage_order - a.stage_order)[0].stage_name
      : undefined;

  const existingResignations = await tqcService.getResignations();
  const resignationCount = existingResignations.length + 1;

  const newResignation: NewTQCResignation = {
    resignation_id: `RSG-${new Date().getFullYear()}-${String(resignationCount).padStart(3, '0')}`,
    trainee_id: input.trainee_id,
    resign_date: input.resign_date,
    reason_category: input.reason_category,
    reason_detail: input.reason_detail,
    training_duration_days: trainingDays,
    last_completed_stage: lastCompletedStage,
    created_at: now,
    created_by: 'admin',
  };

  await tqcService.createResignation(newResignation);

  // Update trainee status
  await tqcService.updateTrainee(input.trainee_id, {
    status: 'RESIGNED',
    updated_at: now,
  });

  return newResignation;
}

// ========== New TQC Dashboard Stats API ==========

export async function getNewTQCDashboardStats(): Promise<NewTQCDashboardStats> {
  const [trainees, meetings] = await Promise.all([
    tqcService.getTrainees(),
    tqcService.getMeetings(),
  ]);

  const inTraining = trainees.filter(t => t.status === 'IN_TRAINING');
  const completed = trainees.filter(t => t.status === 'COMPLETED');
  const resigned = trainees.filter(t => t.status === 'RESIGNED');

  const colorBlindPending = trainees.filter(
    t => t.status === 'IN_TRAINING' && t.color_blind_status === null
  );
  const colorBlindFailed = trainees.filter(t => t.color_blind_status === 'FAIL');

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const meetingsThisWeek = meetings.filter(m => {
    const meetingDate = new Date(m.scheduled_date);
    return meetingDate >= weekStart && meetingDate <= weekEnd;
  });

  const meetingsPending = meetings.filter(
    m => m.status === 'SCHEDULED' && new Date(m.scheduled_date) <= now
  );

  const avgProgress =
    inTraining.length > 0
      ? Math.round(
          inTraining.reduce((sum, t) => sum + t.progress_percentage, 0) / inTraining.length
        )
      : 0;

  const resignationRate =
    trainees.length > 0 ? Math.round((resigned.length / trainees.length) * 100) : 0;

  return {
    totalTrainees: trainees.length,
    inTraining: inTraining.length,
    completed: completed.length,
    resigned: resigned.length,
    colorBlindPending: colorBlindPending.length,
    colorBlindFailed: colorBlindFailed.length,
    meetingsThisWeek: meetingsThisWeek.length,
    meetingsPending: meetingsPending.length,
    averageProgress: avgProgress,
    resignationRate,
  };
}

// ========== New TQC Resignation Analysis API ==========

export async function getNewTQCResignationAnalysis(): Promise<NewTQCResignationAnalysis> {
  const [resignations, trainees] = await Promise.all([
    tqcService.getResignations(),
    tqcService.getTrainees(),
  ]);

  // By Reason
  const reasonCounts: Record<string, number> = {};
  resignations.forEach(r => {
    reasonCounts[r.reason_category] = (reasonCounts[r.reason_category] || 0) + 1;
  });
  const byReason = Object.entries(reasonCounts).map(([reason, count]) => ({
    reason: reason as NewTQCResignation['reason_category'],
    count,
    percentage: resignations.length > 0 ? Math.round((count / resignations.length) * 100) : 0,
  }));

  // By Month
  const monthCounts: Record<string, number> = {};
  resignations.forEach(r => {
    const month = r.resign_date.substring(0, 7);
    monthCounts[month] = (monthCounts[month] || 0) + 1;
  });
  const byMonth = Object.entries(monthCounts)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // By Trainer
  const trainerStats: Record<string, { count: number; total: number }> = {};
  trainees.forEach(t => {
    if (!trainerStats[t.trainer_id]) {
      trainerStats[t.trainer_id] = { count: 0, total: 0 };
    }
    trainerStats[t.trainer_id].total++;
    if (t.status === 'RESIGNED') {
      trainerStats[t.trainer_id].count++;
    }
  });
  const byTrainer = Object.entries(trainerStats).map(([trainer, stats]) => ({
    trainer,
    count: stats.count,
    total: stats.total,
    rate: stats.total > 0 ? Math.round((stats.count / stats.total) * 100) : 0,
  }));

  // By Team
  const teamStats: Record<string, { count: number; total: number }> = {};
  trainees.forEach(t => {
    if (!teamStats[t.team_id]) {
      teamStats[t.team_id] = { count: 0, total: 0 };
    }
    teamStats[t.team_id].total++;
    if (t.status === 'RESIGNED') {
      teamStats[t.team_id].count++;
    }
  });
  const byTeam = Object.entries(teamStats).map(([team, stats]) => ({
    team,
    count: stats.count,
    total: stats.total,
    rate: stats.total > 0 ? Math.round((stats.count / stats.total) * 100) : 0,
  }));

  // By Week
  const weekCounts: Record<number, number> = {};
  trainees
    .filter(t => t.status === 'RESIGNED')
    .forEach(t => {
      weekCounts[t.start_week] = (weekCounts[t.start_week] || 0) + 1;
    });
  const byWeek = Object.entries(weekCounts)
    .map(([week, count]) => ({ week: parseInt(week, 10), count }))
    .sort((a, b) => a.week - b.week);

  // Average Training Days
  const avgTrainingDays =
    resignations.length > 0
      ? Math.round(
          resignations.reduce((sum, r) => sum + r.training_duration_days, 0) / resignations.length
        )
      : 0;

  return {
    byReason,
    byMonth,
    byTrainer,
    byTeam,
    byWeek,
    averageTrainingDays: avgTrainingDays,
  };
}

// ========== New TQC Upcoming Meetings API ==========

export async function getNewTQCUpcomingMeetings(days: number = 7): Promise<NewTQCMeeting[]> {
  const meetings = await tqcService.getMeetings();

  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(now.getDate() + days);

  return meetings
    .filter(m => {
      const meetingDate = new Date(m.scheduled_date);
      return m.status === 'SCHEDULED' && meetingDate >= now && meetingDate <= endDate;
    })
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
}

// ========== Attendance API ==========

export async function saveBulkAttendance(input: BulkAttendanceInput): Promise<Attendance[]> {
  const savedRecords = await attendanceService.saveBulkAttendance(input);
  logger.log('Attendance saved:', savedRecords.length, 'records');
  return savedRecords;
}

// ========== Materials API ==========

export async function getMaterials(filters?: MaterialFilters): Promise<TrainingMaterial[]> {
  return materialService.getMaterials(filters);
}

export async function getMaterial(id: string): Promise<TrainingMaterial | null> {
  return materialService.getMaterial(id);
}

export async function createMaterial(data: Omit<TrainingMaterial, 'updatedAt'>): Promise<TrainingMaterial> {
  const result = await materialService.createMaterial(data);
  invalidateMaterialCache();
  return result;
}

export async function updateMaterial(id: string, updates: Partial<TrainingMaterial>): Promise<void> {
  await materialService.updateMaterial(id, updates);
  invalidateMaterialCache();
}

export async function deleteMaterial(id: string): Promise<void> {
  await materialService.deleteMaterial(id);
  invalidateMaterialCache();
}

export async function getFolders(parentId?: string | null): Promise<MaterialFolder[]> {
  return materialService.getFolders(parentId);
}

export async function createFolder(data: Omit<MaterialFolder, 'createdAt' | 'updatedAt'>): Promise<MaterialFolder> {
  const result = await materialService.createFolder(data);
  invalidateMaterialCache();
  return result;
}

export async function updateFolder(id: string, updates: Partial<MaterialFolder>): Promise<void> {
  await materialService.updateFolder(id, updates);
  invalidateMaterialCache();
}

export async function deleteFolder(id: string): Promise<void> {
  await materialService.deleteFolder(id);
  invalidateMaterialCache();
}

// ========== Evaluations API ==========

export async function getEvaluations(filters?: EvaluationFilters): Promise<TrainingEvaluation[]> {
  return evaluationService.getEvaluations(filters);
}

export async function getEvaluation(id: string): Promise<TrainingEvaluation | null> {
  return evaluationService.getEvaluation(id);
}

export async function getEvaluationsByProgram(programId: string): Promise<TrainingEvaluation[]> {
  return evaluationService.getEvaluationsByProgram(programId);
}

export async function createEvaluation(data: Omit<TrainingEvaluation, 'submittedAt'>): Promise<TrainingEvaluation> {
  const result = await evaluationService.createEvaluation(data);
  invalidateEvaluationCache();
  return result;
}

export async function updateEvaluation(id: string, updates: Partial<TrainingEvaluation>): Promise<void> {
  await evaluationService.updateEvaluation(id, updates);
  invalidateEvaluationCache();
}

// ========== Notifications API ==========

export async function getNotifications(userId?: string, filters?: NotificationQueryFilters): Promise<Notification[]> {
  return notificationService.getNotifications(userId, filters);
}

export async function createNotification(data: Omit<Notification, 'created_at'>): Promise<Notification> {
  const result = await notificationService.createNotification(data);
  invalidateNotificationCache();
  return result;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await notificationService.markAsRead(id);
  invalidateNotificationCache();
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await notificationService.markAllAsRead(userId);
  invalidateNotificationCache();
}

export async function deleteNotification(id: string): Promise<void> {
  await notificationService.deleteNotification(id);
  invalidateNotificationCache();
}

export async function batchDeleteNotifications(ids: string[]): Promise<void> {
  await notificationService.batchDeleteNotifications(ids);
  invalidateNotificationCache();
}

export async function getNotificationSettings(userId: string): Promise<NotificationSettingsData | null> {
  return notificationService.getSettings(userId);
}

export async function updateNotificationSettings(userId: string, data: Partial<NotificationSettingsData>): Promise<void> {
  return notificationService.updateSettings(userId, data);
}

// ========== Audit Logs API ==========

export async function getAuditLogs(filters?: AuditLogFilters): Promise<AuditLogEntry[]> {
  return auditLogService.getAuditLogs(filters);
}

export async function createAuditLog(data: Omit<AuditLogEntry, 'changed_at'>): Promise<AuditLogEntry> {
  return auditLogService.createAuditLog(data);
}

// ========== Trainer API ==========

export async function getTrainers(status?: string) {
  return trainerService.getTrainers(status);
}

export async function getTrainer(id: string) {
  return trainerService.getTrainer(id);
}

export async function createTrainer(data: Parameters<typeof trainerService.createTrainer>[0]) {
  const result = await trainerService.createTrainer(data);
  return result;
}

export async function updateTrainer(id: string, updates: Parameters<typeof trainerService.updateTrainer>[1]) {
  await trainerService.updateTrainer(id, updates);
}

export async function deleteTrainer(id: string) {
  await trainerService.deleteTrainer(id);
}

// ========== Training Plan API ==========

export async function getTrainingPlans() {
  return trainingPlanService.getTrainingPlans();
}

export async function getTrainingPlan(id: string) {
  return trainingPlanService.getTrainingPlan(id);
}

export async function createTrainingPlan(data: Parameters<typeof trainingPlanService.createTrainingPlan>[0]) {
  return trainingPlanService.createTrainingPlan(data);
}

export async function updateTrainingPlan(id: string, updates: Parameters<typeof trainingPlanService.updateTrainingPlan>[1]) {
  await trainingPlanService.updateTrainingPlan(id, updates);
}

export async function deleteTrainingPlan(id: string) {
  await trainingPlanService.deleteTrainingPlan(id);
}

// ========== Audit Compliance API ==========

export async function getAuditMetrics() {
  return auditComplianceService.getAuditMetrics();
}

export async function updateAuditMetric(id: string, updates: Parameters<typeof auditComplianceService.updateAuditMetric>[1]) {
  await auditComplianceService.updateAuditMetric(id, updates);
}

export async function createAuditMetric(data: Parameters<typeof auditComplianceService.createAuditMetric>[0]) {
  return auditComplianceService.createAuditMetric(data);
}

export async function getAuditFindings() {
  return auditComplianceService.getAuditFindings();
}

export async function createAuditFinding(data: Parameters<typeof auditComplianceService.createAuditFinding>[0]) {
  return auditComplianceService.createAuditFinding(data);
}

export async function getCorrectiveActions() {
  return auditComplianceService.getCorrectiveActions();
}

export async function createCorrectiveAction(data: Parameters<typeof auditComplianceService.createCorrectiveAction>[0]) {
  return auditComplianceService.createCorrectiveAction(data);
}

export async function updateCorrectiveAction(id: string, updates: Parameters<typeof auditComplianceService.updateCorrectiveAction>[1]) {
  await auditComplianceService.updateCorrectiveAction(id, updates);
}

// ========== CAPA API ==========

export const getCAPAs = capaService.getCAPAs;
export const getCAPA = capaService.getCAPA;
export const createCAPA = capaService.createCAPA;
export const updateCAPA = capaService.updateCAPA;
export const updateCAPAStage = capaService.updateCAPAStage;
export const getAllCAPAs = capaService.getAllCAPAs;

// ========== Project Settings API ==========

import * as inspectionService from './inspectionService';
import type {
  InspectionResultDetail,
  InspectionResultInput,
  InspectionEnrollment,
  InspectionEnrollmentInput,
  InspectionEnrollmentFilters,
  InspectionStrikeInfo,
} from '@/types/inspection';

import * as projectService from './projectService';
import type { ProjectSettings } from '@/types/project';

export async function getProjectSettings(projectId: string): Promise<ProjectSettings> {
  return projectService.getProjectSettings(projectId);
}

export async function updateProjectSettings(
  projectId: string,
  data: Partial<Pick<ProjectSettings, 'projectName' | 'projectDescription' | 'defaultView' | 'notifications'>>
): Promise<void> {
  return projectService.updateProjectSettings(projectId, data);
}

// ========== ROI / Training Costs API ==========

import * as roiService from './roiService';

export async function getTrainingCosts(year?: number) {
  return roiService.getTrainingCosts(year);
}

export async function saveTrainingCost(data: Parameters<typeof roiService.saveTrainingCost>[0]) {
  return roiService.saveTrainingCost(data);
}

// ========== Certificate API ==========

import * as certificateService from './certificateService';
import type {
  Certificate,
  CertificateTemplate,
  CertificateFilters,
} from './certificateService';

export type { Certificate, CertificateTemplate, CertificateFilters };

export function invalidateCertificateCache(): void {
  apiCache.invalidate('certificates');
}

export async function getCertificates(filters?: CertificateFilters): Promise<Certificate[]> {
  return certificateService.getCertificates(filters);
}

export async function getCertificate(id: string): Promise<Certificate | null> {
  return certificateService.getCertificate(id);
}

export async function createCertificate(
  data: Omit<Certificate, 'created_at'>
): Promise<Certificate> {
  const result = await certificateService.createCertificate(data);
  invalidateCertificateCache();
  return result;
}

export async function createCertificatesBatch(
  certificates: Omit<Certificate, 'created_at'>[]
): Promise<Certificate[]> {
  const results = await certificateService.createCertificatesBatch(certificates);
  invalidateCertificateCache();
  return results;
}

export async function revokeCertificate(
  certificateId: string,
  revokedBy: string,
  reason: string
): Promise<void> {
  await certificateService.revokeCertificate(certificateId, revokedBy, reason);
  invalidateCertificateCache();
}

export async function getCertificateTemplates(activeOnly = true): Promise<CertificateTemplate[]> {
  return certificateService.getCertificateTemplates(activeOnly);
}

export async function getCertificateTemplate(id: string): Promise<CertificateTemplate | null> {
  return certificateService.getCertificateTemplate(id);
}

export async function createCertificateTemplate(
  data: Omit<CertificateTemplate, 'template_id' | 'created_at' | 'updated_at'>
): Promise<CertificateTemplate> {
  const result = await certificateService.createCertificateTemplate(data);
  invalidateCertificateCache();
  return result;
}

export async function updateCertificateTemplate(
  templateId: string,
  updates: Partial<CertificateTemplate>
): Promise<void> {
  await certificateService.updateCertificateTemplate(templateId, updates);
  invalidateCertificateCache();
}

export async function deleteCertificateTemplate(templateId: string): Promise<void> {
  await certificateService.deleteCertificateTemplate(templateId);
  invalidateCertificateCache();
}

// ========== Competency & Skill Gap API ==========

import * as competencyService from './competencyService';
import type {
  Competency,
  CompetencyCategory,
  EmployeeCompetency,
  LearningPath,
  EmployeeLearningPath,
  IndividualDevelopmentPlan,
} from '@/types/curriculum';

export async function getCompetencies(
  category?: CompetencyCategory
): Promise<Competency[]> {
  return competencyService.getCompetencies(category);
}

export async function createCompetency(
  data: Omit<Competency, 'competency_id' | 'created_at' | 'updated_at'>
): Promise<Competency> {
  return competencyService.createCompetency(data);
}

export async function updateCompetency(
  id: string,
  updates: Partial<Competency>
): Promise<void> {
  return competencyService.updateCompetency(id, updates);
}

export async function deleteCompetency(id: string): Promise<void> {
  return competencyService.deleteCompetency(id);
}

export async function getEmployeeCompetencies(
  employeeId?: string
): Promise<EmployeeCompetency[]> {
  return competencyService.getEmployeeCompetencies(employeeId);
}

export async function updateEmployeeCompetency(
  data: EmployeeCompetency
): Promise<void> {
  return competencyService.updateEmployeeCompetency(data);
}

export async function getLearningPaths(): Promise<LearningPath[]> {
  return competencyService.getLearningPaths();
}

export async function createLearningPath(
  data: Omit<LearningPath, 'path_id' | 'created_at' | 'updated_at'>
): Promise<LearningPath> {
  return competencyService.createLearningPath(data);
}

export async function updateLearningPath(
  id: string,
  updates: Partial<LearningPath>
): Promise<void> {
  return competencyService.updateLearningPath(id, updates);
}

export async function getEmployeeLearningPaths(
  employeeId?: string
): Promise<EmployeeLearningPath[]> {
  return competencyService.getEmployeeLearningPaths(employeeId);
}

export async function updateEmployeeLearningPath(
  data: EmployeeLearningPath
): Promise<void> {
  return competencyService.updateEmployeeLearningPath(data);
}

export async function getDevelopmentPlans(
  employeeId?: string
): Promise<IndividualDevelopmentPlan[]> {
  return competencyService.getDevelopmentPlans(employeeId);
}

export async function createDevelopmentPlan(
  data: Omit<IndividualDevelopmentPlan, 'plan_id' | 'created_at' | 'updated_at'>
): Promise<IndividualDevelopmentPlan> {
  return competencyService.createDevelopmentPlan(data);
}

export async function updateDevelopmentPlan(
  id: string,
  updates: Partial<IndividualDevelopmentPlan>
): Promise<void> {
  return competencyService.updateDevelopmentPlan(id, updates);
}

// ========== Inspection Training API ==========

export async function getInspectionResults(): Promise<InspectionResultDetail[]> {
  return inspectionService.getAllResults();
}

export async function getInspectionResultsByEmployee(
  employeeId: string
): Promise<InspectionResultDetail[]> {
  return inspectionService.getResultsByEmployee(employeeId);
}

export async function getInspectionDetail(
  resultId: string
): Promise<InspectionResultDetail | null> {
  return inspectionService.getInspectionDetail(resultId);
}

export async function createInspectionResult(
  input: InspectionResultInput,
  createdBy: string
): Promise<{ resultId: string; inspectionId: string; matchRate: number }> {
  const result = await inspectionService.createInspectionResult(input, createdBy);
  invalidateResultCache();
  invalidateDashboardCache();
  return result;
}

export async function getInspectionEnrollments(
  filters?: InspectionEnrollmentFilters
): Promise<InspectionEnrollment[]> {
  return inspectionService.getEnrollments(filters);
}

export async function createInspectionEnrollment(
  input: InspectionEnrollmentInput
): Promise<InspectionEnrollment> {
  return inspectionService.createEnrollment(input);
}

export async function updateInspectionEnrollmentStatus(
  enrollmentId: string,
  status: InspectionEnrollment['status']
): Promise<void> {
  return inspectionService.updateEnrollmentStatus(enrollmentId, status);
}

export async function getInspectionConsecutiveFailures(
  employeeId: string
): Promise<InspectionStrikeInfo> {
  return inspectionService.getConsecutiveFailures(employeeId);
}

export async function autoEnrollInspectionFromLogs(
  source: 'FIVE_PRS_RECOMMENDATION' | 'AQL_RECOMMENDATION',
  enrolledBy: string
) {
  return inspectionService.autoEnrollFromLogs(source, enrolledBy);
}

// ========== Metal Detector Inspection ==========

import type {
  MDInspection,
  MDFailure,
  MDFilters,
  MDDashboardKPI,
  MDWeeklyTrend,
} from '@/types/metalDetector';

export const mdInspection = {
  getInspections: (filters?: MDFilters) => mdInspectionService.getInspections(filters),
  getInspectionById: (id: string) => mdInspectionService.getInspectionById(id),
  createInspection: (data: Omit<MDInspection, 'id' | 'weekNumber' | 'year' | 'createdAt' | 'updatedAt'>) =>
    mdInspectionService.createInspection(data),
  updateInspection: (id: string, data: Partial<Omit<MDInspection, 'id' | 'createdAt'>>) =>
    mdInspectionService.updateInspection(id, data),
  getFailures: (inspectionId?: string) => mdInspectionService.getFailures(inspectionId),
  createFailure: (data: Omit<MDFailure, 'id' | 'createdAt' | 'updatedAt'>) =>
    mdInspectionService.createFailure(data),
  updateFailure: (id: string, data: Partial<Omit<MDFailure, 'id' | 'createdAt'>>) =>
    mdInspectionService.updateFailure(id, data),
  getDashboardKPIs: (year: number, weekNumber?: number): Promise<MDDashboardKPI> =>
    mdInspectionService.getDashboardKPIs(year, weekNumber),
  getWeeklyTrend: (year: number, weekCount?: number): Promise<MDWeeklyTrend[]> =>
    mdInspectionService.getWeeklyTrend(year, weekCount),
};

// ========== TECH / NEW MODEL ==========

import type {
  TechModel,
  TechReviewGuideline,
  TechModelFilters,
} from '@/types/techModel';

// ========== INSPECTOR STICKER ==========

import * as inspectorStickerService from './inspectorStickerService';
import type {
  InspectorSticker,
  InspectorStickerInput,
  InspectorStickerUpdate,
} from '@/types/inspectorSticker';

export const inspectorSticker = {
  getStickers: (status?: string): Promise<InspectorSticker[]> =>
    inspectorStickerService.getStickers(status),
  getSticker: (id: string): Promise<InspectorSticker | null> =>
    inspectorStickerService.getSticker(id),
  getStickerByStickerID: (stickerId: string): Promise<InspectorSticker | null> =>
    inspectorStickerService.getStickerByStickerID(stickerId),
  createSticker: (data: InspectorStickerInput): Promise<InspectorSticker> =>
    inspectorStickerService.createSticker(data),
  updateSticker: (id: string, updates: InspectorStickerUpdate): Promise<void> =>
    inspectorStickerService.updateSticker(id, updates),
  deleteSticker: (id: string): Promise<void> =>
    inspectorStickerService.deleteSticker(id),
};

export const techModel = {
  getModels: (filters?: TechModelFilters) => techModelService.getModels(filters),
  createModel: (data: Omit<TechModel, 'id' | 'createdAt' | 'updatedAt'>) =>
    techModelService.createModel(data),
  updateModel: (id: string, data: Partial<Omit<TechModel, 'id' | 'createdAt' | 'createdBy'>>) =>
    techModelService.updateModel(id, data),
  deleteModel: (id: string) => techModelService.deleteModel(id),
  getGuidelines: (modelId?: string) => techModelService.getGuidelines(modelId),
  createGuideline: (data: Omit<TechReviewGuideline, 'id' | 'createdAt' | 'updatedAt'>) =>
    techModelService.createGuideline(data),
  updateGuideline: (id: string, data: Partial<Omit<TechReviewGuideline, 'id' | 'createdAt' | 'createdBy'>>) =>
    techModelService.updateGuideline(id, data),
  deleteGuideline: (id: string) => techModelService.deleteGuideline(id),
};
