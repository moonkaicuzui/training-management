/**
 * Shared utilities for analytics modules.
 * Contains types, cache system, helpers, and Firestore doc parsers.
 */

import {
  db,
  collection,
  Timestamp,
} from '@/services/firebase';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { logger } from '@/utils/logger';
import { COMPETENCY_LEVEL_VALUES } from '@/types/curriculum';
import type { CompetencyLevel } from '@/types/curriculum';
import type { Employee, TrainingProgram, TrainingResultRecord } from '@/types';
import { query, where, orderBy } from '@/services/firebase';

// ============================================================
// Collection Names (snake_case per convention)
// ============================================================

export const DASHBOARD_METRICS = 'dashboard_metrics';
export const COMPETENCIES = 'competencies';
export const EMPLOYEE_COMPETENCIES = 'employee_competencies';
export const TRAINING_COSTS = 'training_costs';
export const TRAINING_RESULTS = 'training_results';
export const TRAINING_PROGRAMS = 'training_programs';
export const EMPLOYEES = 'employees';
export const TRAINING_SESSIONS = 'training_sessions';

// ============================================================
// Types
// ============================================================

export interface AnalyticsMetrics {
  totalEmployees: number;
  activePrograms: number;
  completionRate: number;
  passRate: number;
  expiringCertificates: number;
  upcomingSessions: number;
  avgScore: number;
  trainingHours: number;
  calculatedAt: string;
}

export interface CompetencyGapAnalysis {
  department: string;
  competency: string;
  currentLevel: number; // average
  targetLevel: number;
  gap: number;
  employeesBelow: number;
  totalEmployees: number;
}

export interface ROIAnalysis {
  period: string;
  totalCost: number;
  totalBenefit: number;
  roi: number; // percentage
  costPerEmployee: number;
  costPerTrainingHour: number;
  qualityImprovementRate: number;
}

export interface TrendData {
  period: string; // YYYY-MM
  value: number;
  label: string;
}

export interface DepartmentComparison {
  department: string;
  completionRate: number;
  passRate: number;
  avgScore: number;
}

// ============================================================
// Helper Functions
// ============================================================

export const convertTimestampToString = (
  timestamp: Timestamp | string | undefined | null
): string => {
  if (!timestamp) return '';
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

/**
 * Convert a CompetencyLevel string to its numeric value.
 * Returns 0 for unrecognized levels.
 */
export const levelToNumber = (level: CompetencyLevel | string): number => {
  return COMPETENCY_LEVEL_VALUES[level as CompetencyLevel] ?? 0;
};

/**
 * Generate an array of YYYY-MM period strings for the last N months.
 */
export const getMonthPeriods = (months: number): string[] => {
  const periods: string[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    periods.push(`${yyyy}-${mm}`);
  }

  return periods;
};

// ============================================================
// Cache System (5-minute TTL)
// ============================================================

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const analyticsCache = new Map<string, CacheEntry<unknown>>();

export const getCached = <T>(key: string): T | null => {
  const entry = analyticsCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    analyticsCache.delete(key);
    return null;
  }
  return entry.data as T;
};

export const setCache = <T>(key: string, data: T): void => {
  analyticsCache.set(key, { data, fetchedAt: Date.now() });
};

/**
 * Clear all analytics cache entries.
 * Useful when data has been modified and fresh reads are needed.
 */
export const clearAnalyticsCache = (): void => {
  analyticsCache.clear();
  logger.log('[analyticsService] Cache cleared');
};

// ============================================================
// Query Helpers & Doc Parsers
// ============================================================

/**
 * Get a date string N months ago in YYYY-MM-DD format.
 */
export const getDateMonthsAgo = (months: number): string => {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().substring(0, 10);
};

/**
 * Build a Firestore query for training_results filtered by training_date.
 * Uses string comparison on the YYYY-MM-DD format field.
 */
export const buildResultsQuery = (startDate?: string) => {
  const col = collection(db, TRAINING_RESULTS);
  if (startDate) {
    return query(
      col,
      where('training_date', '>=', startDate),
      orderBy('training_date', 'desc')
    );
  }
  return query(col, orderBy('training_date', 'desc'));
};

/**
 * Parse a Firestore doc snapshot into a TrainingResultRecord.
 */
export const parseResultDoc = (d: QueryDocumentSnapshot<DocumentData>): TrainingResultRecord => {
  const data = d.data();
  return {
    result_id: (data.result_id as string) || d.id,
    session_id: (data.session_id as string | null) ?? null,
    employee_id: (data.employee_id as string) || '',
    program_code: (data.program_code as string) || '',
    training_date: (data.training_date as string) || '',
    score: (data.score as number | null) ?? null,
    grade: data.grade ?? null,
    result: (data.result as string) || 'ABSENT',
    needs_retraining: (data.needs_retraining as boolean) || false,
    evaluated_by: (data.evaluated_by as string) || '',
    remarks: (data.remarks as string) || '',
    created_at: convertTimestampToString(data.created_at),
    updated_at: convertTimestampToString(data.updated_at) || null,
    updated_by: (data.updated_by as string | null) ?? null,
  } as TrainingResultRecord;
};

/**
 * Parse a Firestore doc snapshot into an Employee.
 */
export const parseEmployeeDoc = (d: QueryDocumentSnapshot<DocumentData>): Employee => {
  const data = d.data();
  return {
    employee_id: (data.employee_id as string) || d.id,
    employee_name: (data.employee_name as string) || '',
    department: data.department,
    position: data.position,
    building: data.building,
    line: (data.line as string) || '',
    hire_date: (data.hire_date as string) || '',
    status: (data.status as string) || 'ACTIVE',
    updated_at: convertTimestampToString(data.updated_at),
  } as Employee;
};

/**
 * Parse a Firestore doc snapshot into a TrainingProgram.
 */
export const parseProgramDoc = (d: QueryDocumentSnapshot<DocumentData>): TrainingProgram => {
  const data = d.data();
  return {
    program_code: (data.program_code as string) || d.id,
    program_name: (data.program_name as string) || '',
    program_name_vn: (data.program_name_vn as string) || '',
    program_name_kr: (data.program_name_kr as string) || '',
    category: data.category,
    tags: (data.tags as string[]) || [],
    target_positions: (data.target_positions as TrainingProgram['target_positions']) || [],
    evaluation_type: data.evaluation_type || 'SCORE',
    passing_score: (data.passing_score as number) || 0,
    grade_aa: (data.grade_aa as number) || 0,
    grade_a: (data.grade_a as number) || 0,
    grade_b: (data.grade_b as number) || 0,
    duration_hours: (data.duration_hours as number) || 0,
    validity_months: (data.validity_months as number | null) ?? null,
    is_active: data.is_active !== false,
    created_at: convertTimestampToString(data.created_at),
    updated_at: convertTimestampToString(data.updated_at),
  } as TrainingProgram;
};
