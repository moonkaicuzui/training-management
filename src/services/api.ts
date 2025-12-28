// ============================================================
// Q-TRAIN API Service
// Mock API for development, switch to GAS for production
// Enhanced with error handling, caching, and retry logic
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
} from '@/types';

import {
  mockEmployees,
  mockPrograms,
  mockSessions,
  mockResults,
  // New TQC Mock Data
  mockNewTQCTeams,
  mockNewTQCTrainees,
  mockNewTQCColorBlindTests,
  mockNewTQCTrainingStages,
  mockNewTQCMeetings,
  mockNewTQCResignations,
} from '@/data/mockData';

// ========== Configuration ==========

const USE_MOCK_API = true; // Demo mode - using mock data for demonstration
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxS2020t2o--mUb-o-ag-OJM5WUGsjZEsQq6YcALTyTxJOsM9Diuqpk-sDswAuuWrf_/exec';

// Simulate API delay for realistic UX
const MOCK_DELAY = 300;

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms
const RETRY_BACKOFF = 2; // exponential backoff multiplier

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

async function withRetry<T>(
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

      // Don't retry on validation or not found errors
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

// ========== Fetch Wrapper ==========

interface ApiFetchOptions {
  timeout?: number;
  useCache?: boolean;
  cacheKey?: string;
  cacheTTL?: number;
}

async function apiFetch<T>(
  url: string,
  options: RequestInit & ApiFetchOptions = {}
): Promise<T> {
  const { timeout = 30000, useCache = false, cacheKey, cacheTTL, ...fetchOptions } = options;

  // Check cache first
  if (useCache && cacheKey) {
    const cached = apiCache.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `HTTP Error: ${response.status}`,
        'HTTP_ERROR',
        response.status,
        errorData
      );
    }

    const data = await response.json();

    if (data.error) {
      throw new ApiError(data.error, 'API_ERROR', response.status, data);
    }

    const result = data.data ?? data;

    // Store in cache
    if (useCache && cacheKey) {
      apiCache.set(cacheKey, result, cacheTTL);
    }

    return result;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new TimeoutError();
      }
      if (error.message.includes('fetch')) {
        throw new NetworkError();
      }
    }

    throw new ApiError(
      '알 수 없는 오류가 발생했습니다',
      'UNKNOWN_ERROR',
      undefined,
      error
    );
  }
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

  // GAS API call with retry and caching
  const params = new URLSearchParams({ action: 'getEmployees', ...filters });
  const cacheKey = `employees:${params.toString()}`;

  return withRetry(() =>
    apiFetch<Employee[]>(`${GAS_URL}?${params}`, {
      useCache: true,
      cacheKey,
    })
  );
}

export async function getEmployee(id: string): Promise<Employee | null> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    return mockEmployees.find(e => e.employee_id === id) || null;
  }

  const params = new URLSearchParams({ action: 'getEmployee', id });
  const cacheKey = `employees:${id}`;

  return withRetry(() =>
    apiFetch<Employee | null>(`${GAS_URL}?${params}`, {
      useCache: true,
      cacheKey,
    })
  );
}

export async function getEmployeeHistory(id: string): Promise<TrainingResultRecord[]> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    return mockResults.filter(r => r.employee_id === id);
  }

  const params = new URLSearchParams({ action: 'getEmployeeHistory', id });
  const cacheKey = `employees:history:${id}`;

  return withRetry(() =>
    apiFetch<TrainingResultRecord[]>(`${GAS_URL}?${params}`, {
      useCache: true,
      cacheKey,
    })
  );
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

  const result = await withRetry(() =>
    apiFetch<Employee>(GAS_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'createEmployee', data: employee }),
    })
  );

  invalidateEmployeeCache();
  return result;
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

  const result = await withRetry(() =>
    apiFetch<Employee | null>(GAS_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'updateEmployee', id, data: updates }),
    })
  );

  invalidateEmployeeCache();
  return result;
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

// ============================================================
// New TQC (신입 TQC 교육) API
// ============================================================

// ========== New TQC Team API ==========

export async function getNewTQCTeams(includeInactive = false): Promise<NewTQCTeam[]> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    if (includeInactive) {
      return [...mockNewTQCTeams];
    }
    return mockNewTQCTeams.filter(t => t.is_active);
  }

  const params = new URLSearchParams({
    action: 'getNewTQCTeams',
    includeInactive: includeInactive.toString(),
  });
  const response = await fetch(`${GAS_URL}?${params}`);
  const data = await response.json();
  return data.data;
}

export async function getNewTQCTeamById(teamId: string): Promise<NewTQCTeam | null> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    return mockNewTQCTeams.find(t => t.team_id === teamId) || null;
  }

  const params = new URLSearchParams({ action: 'getNewTQCTeamById', teamId });
  const response = await fetch(`${GAS_URL}?${params}`);
  const data = await response.json();
  return data.data;
}

export async function createNewTQCTeam(input: NewTQCTeamInput): Promise<NewTQCTeam> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    const now = new Date().toISOString();
    const newTeam: NewTQCTeam = {
      team_id: input.team_name.toUpperCase().replace(/\s+/g, '_'),
      team_name: input.team_name,
      team_name_vn: input.team_name_vn,
      team_name_kr: input.team_name_kr,
      factory: input.factory,
      line: input.line,
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    mockNewTQCTeams.push(newTeam);
    return newTeam;
  }

  const response = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'createNewTQCTeam', data: input }),
  });
  const data = await response.json();
  return data.data;
}

export async function updateNewTQCTeam(input: NewTQCTeamUpdate): Promise<NewTQCTeam | null> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    const index = mockNewTQCTeams.findIndex(t => t.team_id === input.team_id);
    if (index === -1) return null;

    mockNewTQCTeams[index] = {
      ...mockNewTQCTeams[index],
      ...input,
      updated_at: new Date().toISOString(),
    };
    return mockNewTQCTeams[index];
  }

  const response = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'updateNewTQCTeam', data: input }),
  });
  const data = await response.json();
  return data.data;
}

export async function deleteNewTQCTeam(teamId: string): Promise<boolean> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    const index = mockNewTQCTeams.findIndex(t => t.team_id === teamId);
    if (index === -1) return false;

    // Soft delete - set is_active to false
    mockNewTQCTeams[index].is_active = false;
    mockNewTQCTeams[index].updated_at = new Date().toISOString();
    return true;
  }

  const response = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'deleteNewTQCTeam', teamId }),
  });
  const data = await response.json();
  return data.success;
}

// ========== New TQC Trainee API ==========

export async function getNewTQCTrainees(
  filters?: NewTQCTraineeFilters
): Promise<NewTQCTrainee[]> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    let result = [...mockNewTQCTrainees];

    if (filters) {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        result = result.filter(
          t =>
            t.name.toLowerCase().includes(searchLower) ||
            t.trainee_id.toLowerCase().includes(searchLower) ||
            t.employee_id?.toLowerCase().includes(searchLower)
        );
      }

      if (filters.status && filters.status !== 'all') {
        result = result.filter(t => t.status === filters.status);
      }

      if (filters.trainer && filters.trainer !== 'all') {
        result = result.filter(t => t.trainer_id === filters.trainer);
      }

      if (filters.team && filters.team !== 'all') {
        result = result.filter(t => t.team_id === filters.team);
      }

      if (filters.startWeek) {
        const week = parseInt(filters.startWeek, 10);
        result = result.filter(t => t.start_week === week);
      }

      if (filters.colorBlindStatus && filters.colorBlindStatus !== 'all') {
        if (filters.colorBlindStatus === 'pending') {
          result = result.filter(t => t.color_blind_status === null);
        } else {
          result = result.filter(t => t.color_blind_status === filters.colorBlindStatus);
        }
      }
    }

    return result.sort((a, b) => b.start_date.localeCompare(a.start_date));
  }

  const params = new URLSearchParams({ action: 'getNewTQCTrainees' });
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
  }
  const response = await fetch(`${GAS_URL}?${params}`);
  const data = await response.json();
  return data.data;
}

export async function getNewTQCTraineeById(traineeId: string): Promise<NewTQCTrainee | null> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    return mockNewTQCTrainees.find(t => t.trainee_id === traineeId) || null;
  }

  const params = new URLSearchParams({ action: 'getNewTQCTraineeById', traineeId });
  const response = await fetch(`${GAS_URL}?${params}`);
  const data = await response.json();
  return data.data;
}

export async function getNewTQCTraineeWithDetails(
  traineeId: string
): Promise<NewTQCTraineeWithDetails | null> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    const trainee = mockNewTQCTrainees.find(t => t.trainee_id === traineeId);
    if (!trainee) return null;

    const team = mockNewTQCTeams.find(t => t.team_id === trainee.team_id);
    const stages = mockNewTQCTrainingStages.filter(s => s.trainee_id === traineeId);
    const colorBlindTests = mockNewTQCColorBlindTests.filter(c => c.trainee_id === traineeId);
    const meetings = mockNewTQCMeetings.filter(m => m.trainee_id === traineeId);
    const resignation = mockNewTQCResignations.find(r => r.trainee_id === traineeId);

    return {
      ...trainee,
      team,
      stages: stages.sort((a, b) => a.stage_order - b.stage_order),
      colorBlindTests: colorBlindTests.sort((a, b) => b.test_date.localeCompare(a.test_date)),
      meetings: meetings.sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date)),
      resignation,
    };
  }

  const params = new URLSearchParams({ action: 'getNewTQCTraineeWithDetails', traineeId });
  const response = await fetch(`${GAS_URL}?${params}`);
  const data = await response.json();
  return data.data;
}

export async function createNewTQCTrainee(input: NewTQCTraineeInput): Promise<NewTQCTrainee> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    const now = new Date().toISOString();
    const startDate = new Date(input.start_date);
    const startOfYear = new Date(startDate.getFullYear(), 0, 1);
    const weekNum = Math.ceil(
      ((startDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24) + 1) / 7
    );

    const traineeCount = mockNewTQCTrainees.length + 1;
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
      status: 'IN_TRAINING',
      color_blind_status: null,
      progress_percentage: 0,
      notes: input.notes,
      created_at: now,
      updated_at: now,
      created_by: 'admin',
    };

    mockNewTQCTrainees.push(newTrainee);

    // Create default training stages
    const defaultStages = ['Orientation', 'Basic Training', 'Line Assignment', 'Field Evaluation'];
    defaultStages.forEach((stageName, index) => {
      const stageId = `STG-${traineeId.split('-')[2]}-${index + 1}`;
      mockNewTQCTrainingStages.push({
        stage_id: stageId,
        trainee_id: traineeId,
        stage_name: stageName,
        stage_order: index + 1,
        status: 'PENDING',
        updated_at: now,
      });
    });

    return newTrainee;
  }

  const response = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'createNewTQCTrainee', data: input }),
  });
  const data = await response.json();
  return data.data;
}

export async function updateNewTQCTrainee(
  input: NewTQCTraineeUpdate
): Promise<NewTQCTrainee | null> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    const index = mockNewTQCTrainees.findIndex(t => t.trainee_id === input.trainee_id);
    if (index === -1) return null;

    mockNewTQCTrainees[index] = {
      ...mockNewTQCTrainees[index],
      ...input,
      updated_at: new Date().toISOString(),
    };
    return mockNewTQCTrainees[index];
  }

  const response = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'updateNewTQCTrainee', data: input }),
  });
  const data = await response.json();
  return data.data;
}

// ========== New TQC Color Blind Test API ==========

export async function getNewTQCColorBlindTests(traineeId?: string): Promise<NewTQCColorBlindTest[]> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    if (traineeId) {
      return mockNewTQCColorBlindTests.filter(t => t.trainee_id === traineeId);
    }
    return [...mockNewTQCColorBlindTests];
  }

  const params = new URLSearchParams({ action: 'getNewTQCColorBlindTests' });
  if (traineeId) params.append('traineeId', traineeId);
  const response = await fetch(`${GAS_URL}?${params}`);
  const data = await response.json();
  return data.data;
}

export async function createNewTQCColorBlindTest(
  input: NewTQCColorBlindTestInput
): Promise<NewTQCColorBlindTest> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    const now = new Date().toISOString();
    const testCount = mockNewTQCColorBlindTests.length + 1;

    const newTest: NewTQCColorBlindTest = {
      test_id: `CBT-${new Date().getFullYear()}-${String(testCount).padStart(3, '0')}`,
      trainee_id: input.trainee_id,
      test_date: input.test_date,
      result: input.result,
      notes: input.notes,
      tested_by: 'admin',
      created_at: now,
    };

    mockNewTQCColorBlindTests.push(newTest);

    // Update trainee's color_blind_status
    const traineeIndex = mockNewTQCTrainees.findIndex(t => t.trainee_id === input.trainee_id);
    if (traineeIndex !== -1) {
      mockNewTQCTrainees[traineeIndex].color_blind_status = input.result;
      mockNewTQCTrainees[traineeIndex].updated_at = now;
    }

    return newTest;
  }

  const response = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'createNewTQCColorBlindTest', data: input }),
  });
  const data = await response.json();
  return data.data;
}

// ========== New TQC Training Stage API ==========

export async function getNewTQCTrainingStages(traineeId: string): Promise<NewTQCTrainingStage[]> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    return mockNewTQCTrainingStages
      .filter(s => s.trainee_id === traineeId)
      .sort((a, b) => a.stage_order - b.stage_order);
  }

  const params = new URLSearchParams({ action: 'getNewTQCTrainingStages', traineeId });
  const response = await fetch(`${GAS_URL}?${params}`);
  const data = await response.json();
  return data.data;
}

export async function updateNewTQCTrainingStage(
  input: NewTQCStageUpdate
): Promise<NewTQCTrainingStage | null> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    const index = mockNewTQCTrainingStages.findIndex(s => s.stage_id === input.stage_id);
    if (index === -1) return null;

    const now = new Date().toISOString();
    mockNewTQCTrainingStages[index] = {
      ...mockNewTQCTrainingStages[index],
      ...input,
      updated_at: now,
      updated_by: 'admin',
    };

    // Update trainee progress
    const traineeId = mockNewTQCTrainingStages[index].trainee_id;
    const traineeStages = mockNewTQCTrainingStages.filter(s => s.trainee_id === traineeId);
    const completedCount = traineeStages.filter(s => s.status === 'COMPLETED').length;
    const progress = Math.round((completedCount / traineeStages.length) * 100);

    const traineeIndex = mockNewTQCTrainees.findIndex(t => t.trainee_id === traineeId);
    if (traineeIndex !== -1) {
      mockNewTQCTrainees[traineeIndex].progress_percentage = progress;
      mockNewTQCTrainees[traineeIndex].updated_at = now;

      // Check if all stages are completed
      if (progress === 100) {
        mockNewTQCTrainees[traineeIndex].status = 'COMPLETED';
      }
    }

    return mockNewTQCTrainingStages[index];
  }

  const response = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'updateNewTQCTrainingStage', data: input }),
  });
  const data = await response.json();
  return data.data;
}

// ========== New TQC Meeting API ==========

export async function getNewTQCMeetings(filters?: NewTQCMeetingFilters): Promise<NewTQCMeeting[]> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    let result = [...mockNewTQCMeetings];

    if (filters) {
      if (filters.traineeId) {
        result = result.filter(m => m.trainee_id === filters.traineeId);
      }

      if (filters.meetingType && filters.meetingType !== 'all') {
        result = result.filter(m => m.meeting_type === filters.meetingType);
      }

      if (filters.status && filters.status !== 'all') {
        result = result.filter(m => m.status === filters.status);
      }

      if (filters.dateFrom) {
        result = result.filter(m => m.scheduled_date >= filters.dateFrom!);
      }

      if (filters.dateTo) {
        result = result.filter(m => m.scheduled_date <= filters.dateTo!);
      }
    }

    return result.sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
  }

  const params = new URLSearchParams({ action: 'getNewTQCMeetings' });
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
  }
  const response = await fetch(`${GAS_URL}?${params}`);
  const data = await response.json();
  return data.data;
}

export async function createNewTQCMeeting(input: NewTQCMeetingInput): Promise<NewTQCMeeting> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    const now = new Date().toISOString();
    const meetingCount = mockNewTQCMeetings.length + 1;

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

    mockNewTQCMeetings.push(newMeeting);
    return newMeeting;
  }

  const response = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'createNewTQCMeeting', data: input }),
  });
  const data = await response.json();
  return data.data;
}

export async function updateNewTQCMeeting(
  input: NewTQCMeetingUpdate
): Promise<NewTQCMeeting | null> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    const index = mockNewTQCMeetings.findIndex(m => m.meeting_id === input.meeting_id);
    if (index === -1) return null;

    const now = new Date().toISOString();
    mockNewTQCMeetings[index] = {
      ...mockNewTQCMeetings[index],
      ...input,
      updated_at: now,
    };

    // Update trainee's meeting date if completed
    if (input.status === 'COMPLETED' && input.completed_date) {
      const meeting = mockNewTQCMeetings[index];
      const traineeIndex = mockNewTQCTrainees.findIndex(t => t.trainee_id === meeting.trainee_id);
      if (traineeIndex !== -1) {
        const trainee = mockNewTQCTrainees[traineeIndex];
        if (meeting.meeting_type === '1WEEK') {
          trainee.meeting_1week_date = input.completed_date;
        } else if (meeting.meeting_type === '1MONTH') {
          trainee.meeting_1month_date = input.completed_date;
        } else if (meeting.meeting_type === '3MONTH') {
          trainee.meeting_3month_date = input.completed_date;
        }
        trainee.updated_at = now;
      }
    }

    return mockNewTQCMeetings[index];
  }

  const response = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'updateNewTQCMeeting', data: input }),
  });
  const data = await response.json();
  return data.data;
}

// ========== New TQC Resignation API ==========

export async function getNewTQCResignations(
  filters?: NewTQCResignationFilters
): Promise<NewTQCResignation[]> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    let result = [...mockNewTQCResignations];

    if (filters) {
      if (filters.reasonCategory && filters.reasonCategory !== 'all') {
        result = result.filter(r => r.reason_category === filters.reasonCategory);
      }

      if (filters.trainer && filters.trainer !== 'all') {
        const traineeIds = mockNewTQCTrainees
          .filter(t => t.trainer_id === filters.trainer)
          .map(t => t.trainee_id);
        result = result.filter(r => traineeIds.includes(r.trainee_id));
      }

      if (filters.team && filters.team !== 'all') {
        const traineeIds = mockNewTQCTrainees
          .filter(t => t.team_id === filters.team)
          .map(t => t.trainee_id);
        result = result.filter(r => traineeIds.includes(r.trainee_id));
      }

      if (filters.dateFrom) {
        result = result.filter(r => r.resign_date >= filters.dateFrom!);
      }

      if (filters.dateTo) {
        result = result.filter(r => r.resign_date <= filters.dateTo!);
      }
    }

    return result.sort((a, b) => b.resign_date.localeCompare(a.resign_date));
  }

  const params = new URLSearchParams({ action: 'getNewTQCResignations' });
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
  }
  const response = await fetch(`${GAS_URL}?${params}`);
  const data = await response.json();
  return data.data;
}

export async function createNewTQCResignation(
  input: NewTQCResignationInput
): Promise<NewTQCResignation> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);
    const now = new Date().toISOString();
    const trainee = mockNewTQCTrainees.find(t => t.trainee_id === input.trainee_id);
    if (!trainee) throw new NotFoundError('Trainee not found');

    const startDate = new Date(trainee.start_date);
    const resignDate = new Date(input.resign_date);
    const trainingDays = Math.ceil(
      (resignDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const stages = mockNewTQCTrainingStages.filter(s => s.trainee_id === input.trainee_id);
    const completedStages = stages.filter(s => s.status === 'COMPLETED');
    const lastCompletedStage =
      completedStages.length > 0
        ? completedStages.sort((a, b) => b.stage_order - a.stage_order)[0].stage_name
        : undefined;

    const resignationCount = mockNewTQCResignations.length + 1;
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

    mockNewTQCResignations.push(newResignation);

    // Update trainee status
    const traineeIndex = mockNewTQCTrainees.findIndex(t => t.trainee_id === input.trainee_id);
    if (traineeIndex !== -1) {
      mockNewTQCTrainees[traineeIndex].status = 'RESIGNED';
      mockNewTQCTrainees[traineeIndex].updated_at = now;
    }

    return newResignation;
  }

  const response = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'createNewTQCResignation', data: input }),
  });
  const data = await response.json();
  return data.data;
}

// ========== New TQC Dashboard Stats API ==========

export async function getNewTQCDashboardStats(): Promise<NewTQCDashboardStats> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);

    const trainees = mockNewTQCTrainees;
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

    const meetingsThisWeek = mockNewTQCMeetings.filter(m => {
      const meetingDate = new Date(m.scheduled_date);
      return meetingDate >= weekStart && meetingDate <= weekEnd;
    });

    const meetingsPending = mockNewTQCMeetings.filter(
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

  const params = new URLSearchParams({ action: 'getNewTQCDashboardStats' });
  const response = await fetch(`${GAS_URL}?${params}`);
  const data = await response.json();
  return data.data;
}

// ========== New TQC Resignation Analysis API ==========

export async function getNewTQCResignationAnalysis(): Promise<NewTQCResignationAnalysis> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);

    const resignations = mockNewTQCResignations;
    const trainees = mockNewTQCTrainees;

    // By Reason
    const reasonCounts: Record<string, number> = {};
    resignations.forEach(r => {
      reasonCounts[r.reason_category] = (reasonCounts[r.reason_category] || 0) + 1;
    });
    const byReason = Object.entries(reasonCounts).map(([reason, count]) => ({
      reason: reason as NewTQCResignation['reason_category'],
      count,
      percentage: Math.round((count / resignations.length) * 100),
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

  const params = new URLSearchParams({ action: 'getNewTQCResignationAnalysis' });
  const response = await fetch(`${GAS_URL}?${params}`);
  const data = await response.json();
  return data.data;
}

// ========== New TQC Upcoming Meetings API ==========

export async function getNewTQCUpcomingMeetings(days: number = 7): Promise<NewTQCMeeting[]> {
  if (USE_MOCK_API) {
    await delay(MOCK_DELAY);

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + days);

    return mockNewTQCMeetings
      .filter(m => {
        const meetingDate = new Date(m.scheduled_date);
        return m.status === 'SCHEDULED' && meetingDate >= now && meetingDate <= endDate;
      })
      .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));
  }

  const params = new URLSearchParams({
    action: 'getNewTQCUpcomingMeetings',
    days: days.toString(),
  });
  const response = await fetch(`${GAS_URL}?${params}`);
  const data = await response.json();
  return data.data;
}
