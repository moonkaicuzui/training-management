// ============================================================
// Q-TRAIN API Common Utilities
// Error classes, cache, retry logic, grade calculation
// ============================================================

import type { Grade } from '@/types';

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

export const apiCache = new ApiCache();

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

export function invalidateCertificateCache(): void {
  apiCache.invalidate('certificates');
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
