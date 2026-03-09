/**
 * Analytics Pipeline Service
 *
 * Server-side ready analytics that reads from pre-aggregated
 * `dashboard_metrics` collection (populated by Cloud Functions)
 * with client-side fallback when pre-aggregated data is unavailable.
 *
 * Optimizations applied:
 * - Date-filtered Firestore queries (no full collection reads)
 * - 5-minute in-memory cache for repeated calls
 * - Shared doc parsers to reduce duplication
 *
 * Collections used:
 * - dashboard_metrics (pre-aggregated, read-only)
 * - competencies, employee_competencies (competency gap analysis)
 * - training_costs (ROI analysis)
 * - training_results, training_programs, employees, training_sessions
 */

import {
  db,
  doc,
  collection,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from '@/services/firebase';
import { logger } from '@/utils/logger';
import {
  calculateDashboardKPIs,
  getLatestValidResult,
  isProgramRequiredForEmployee,
} from '@/utils/kpiCalculator';
import { COMPETENCY_LEVEL_VALUES } from '@/types/curriculum';
import type { CompetencyLevel } from '@/types/curriculum';
import type { Employee, TrainingProgram, TrainingResultRecord } from '@/types';

// ============================================================
// Collection Names (snake_case per convention)
// ============================================================

const DASHBOARD_METRICS = 'dashboard_metrics';
const COMPETENCIES = 'competencies';
const EMPLOYEE_COMPETENCIES = 'employee_competencies';
const TRAINING_COSTS = 'training_costs';
const TRAINING_RESULTS = 'training_results';
const TRAINING_PROGRAMS = 'training_programs';
const EMPLOYEES = 'employees';
const TRAINING_SESSIONS = 'training_sessions';

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

const convertTimestampToString = (
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
const levelToNumber = (level: CompetencyLevel | string): number => {
  return COMPETENCY_LEVEL_VALUES[level as CompetencyLevel] ?? 0;
};

/**
 * Generate an array of YYYY-MM period strings for the last N months.
 */
const getMonthPeriods = (months: number): string[] => {
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

const getCached = <T>(key: string): T | null => {
  const entry = analyticsCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    analyticsCache.delete(key);
    return null;
  }
  return entry.data as T;
};

const setCache = <T>(key: string, data: T): void => {
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
const getDateMonthsAgo = (months: number): string => {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().substring(0, 10);
};

/**
 * Build a Firestore query for training_results filtered by training_date.
 * Uses string comparison on the YYYY-MM-DD format field.
 */
const buildResultsQuery = (startDate?: string) => {
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseResultDoc = (d: any): TrainingResultRecord => {
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseEmployeeDoc = (d: any): Employee => {
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseProgramDoc = (d: any): TrainingProgram => {
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

// ============================================================
// 1. getLatestMetrics()
// ============================================================

/**
 * Get latest analytics metrics.
 * First tries reading from `dashboard_metrics/latest` (pre-aggregated by Cloud Function).
 * Falls back to client-side calculation if the pre-aggregated document is unavailable.
 */
export const getLatestMetrics = async (): Promise<AnalyticsMetrics> => {
  const cacheKey = 'latest_metrics';
  const cached = getCached<AnalyticsMetrics>(cacheKey);
  if (cached) {
    logger.log('[analyticsService] Using cached latest metrics');
    return cached;
  }

  try {
    // Try pre-aggregated data first
    const latestRef = doc(db, DASHBOARD_METRICS, 'latest');
    const latestSnap = await getDoc(latestRef);

    if (latestSnap.exists()) {
      const data = latestSnap.data();
      logger.log('[analyticsService] Using pre-aggregated metrics');
      const metrics: AnalyticsMetrics = {
        totalEmployees: (data.totalEmployees as number) || 0,
        activePrograms: (data.activePrograms as number) || 0,
        completionRate: (data.completionRate as number) || 0,
        passRate: (data.passRate as number) || 0,
        expiringCertificates: (data.expiringCertificates as number) || 0,
        upcomingSessions: (data.upcomingSessions as number) || 0,
        avgScore: (data.avgScore as number) || 0,
        trainingHours: (data.trainingHours as number) || 0,
        calculatedAt: convertTimestampToString(
          data.calculatedAt as Timestamp | string | undefined
        ) || new Date().toISOString(),
      };
      setCache(cacheKey, metrics);
      return metrics;
    }

    // Fallback: client-side calculation
    logger.log('[analyticsService] Pre-aggregated data not available, calculating client-side');
    return await calculateMetricsClientSide();
  } catch (error) {
    logger.error('[analyticsService] getLatestMetrics error:', error);
    // On any error (e.g., permission denied for dashboard_metrics), fall back
    try {
      return await calculateMetricsClientSide();
    } catch (fallbackError) {
      logger.error('[analyticsService] Client-side fallback also failed:', fallbackError);
      throw fallbackError;
    }
  }
};

/**
 * Client-side calculation of analytics metrics.
 * Used as fallback when pre-aggregated data is unavailable.
 *
 * Optimized: Only fetches training results from the last 12 months
 * and upcoming PLANNED sessions instead of reading entire collections.
 */
const calculateMetricsClientSide = async (): Promise<AnalyticsMetrics> => {
  const cacheKey = 'metrics_client_side';
  const cached = getCached<AnalyticsMetrics>(cacheKey);
  if (cached) {
    logger.log('[analyticsService] Using cached client-side metrics');
    return cached;
  }

  const now = new Date();
  const todayStr = now.toISOString().substring(0, 10);
  const startDate12m = getDateMonthsAgo(12);

  // Fetch data with filters: results limited to 12 months, sessions only PLANNED future
  const [employeesSnap, programsSnap, resultsSnap, sessionsSnap] = await Promise.all([
    getDocs(query(collection(db, EMPLOYEES), where('status', '==', 'ACTIVE'))),
    getDocs(query(collection(db, TRAINING_PROGRAMS), where('is_active', '==', true))),
    getDocs(buildResultsQuery(startDate12m)),
    getDocs(query(
      collection(db, TRAINING_SESSIONS),
      where('status', '==', 'PLANNED'),
      where('session_date', '>=', todayStr),
      orderBy('session_date', 'asc')
    )),
  ]);

  const employees: Employee[] = employeesSnap.docs.map(parseEmployeeDoc);
  const programs: TrainingProgram[] = programsSnap.docs.map(parseProgramDoc);
  const results: TrainingResultRecord[] = resultsSnap.docs.map(parseResultDoc);

  // Calculate KPIs using existing calculator
  const kpis = calculateDashboardKPIs(employees, programs, results, now);

  // Upcoming sessions count (already filtered server-side)
  const upcomingSessions = sessionsSnap.size;

  // Calculate total training hours from passed results
  const passedResults = results.filter((r) => r.result === 'PASS');
  const programDurationMap = new Map<string, number>();
  for (const p of programs) {
    programDurationMap.set(p.program_code, p.duration_hours || 0);
  }
  const trainingHours = passedResults.reduce((sum, r) => {
    return sum + (programDurationMap.get(r.program_code) || 0);
  }, 0);

  const metrics: AnalyticsMetrics = {
    totalEmployees: kpis.totalEmployees,
    activePrograms: programs.length,
    completionRate: kpis.overallCompletionRate,
    passRate: kpis.passRate,
    expiringCertificates: kpis.expiringCount,
    upcomingSessions,
    avgScore: kpis.averageScore,
    trainingHours,
    calculatedAt: now.toISOString(),
  };

  setCache(cacheKey, metrics);
  return metrics;
};

// ============================================================
// 2. getHistoricalMetrics()
// ============================================================

/**
 * Read historical metrics from `dashboard_metrics` collection for a date range.
 * Documents are expected to have a `date` field (YYYY-MM-DD string) or a `calculatedAt` timestamp.
 *
 * @param startDate - ISO date string (YYYY-MM-DD)
 * @param endDate - ISO date string (YYYY-MM-DD)
 */
export const getHistoricalMetrics = async (
  startDate: string,
  endDate: string
): Promise<AnalyticsMetrics[]> => {
  const cacheKey = `historical_${startDate}_${endDate}`;
  const cached = getCached<AnalyticsMetrics[]>(cacheKey);
  if (cached) {
    logger.log('[analyticsService] Using cached historical metrics');
    return cached;
  }

  try {
    const q = query(
      collection(db, DASHBOARD_METRICS),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc')
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      logger.log('[analyticsService] No historical metrics found for range:', startDate, '-', endDate);
      return [];
    }

    const result = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        totalEmployees: (data.totalEmployees as number) || 0,
        activePrograms: (data.activePrograms as number) || 0,
        completionRate: (data.completionRate as number) || 0,
        passRate: (data.passRate as number) || 0,
        expiringCertificates: (data.expiringCertificates as number) || 0,
        upcomingSessions: (data.upcomingSessions as number) || 0,
        avgScore: (data.avgScore as number) || 0,
        trainingHours: (data.trainingHours as number) || 0,
        calculatedAt: convertTimestampToString(
          data.calculatedAt as Timestamp | string | undefined
        ) || (data.date as string) || '',
      };
    });

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    logger.error('[analyticsService] getHistoricalMetrics error:', error);
    return [];
  }
};

// ============================================================
// 3. calculateCompetencyGaps()
// ============================================================

/**
 * Calculate competency gap analysis by department.
 * Reads from `competencies` and `employee_competencies` collections,
 * then joins with `employees` to group by department.
 *
 * @param department - Optional filter for a specific department
 * @returns Competency gaps sorted by gap size (largest first)
 */
export const calculateCompetencyGaps = async (
  department?: string
): Promise<CompetencyGapAnalysis[]> => {
  const cacheKey = `competency_gaps_${department || 'all'}`;
  const cached = getCached<CompetencyGapAnalysis[]>(cacheKey);
  if (cached) {
    logger.log('[analyticsService] Using cached competency gaps');
    return cached;
  }

  try {
    // Fetch competencies, employee competencies, and employees in parallel
    const [competenciesSnap, empCompSnap, employeesSnap] = await Promise.all([
      getDocs(query(collection(db, COMPETENCIES), where('is_active', '==', true))),
      getDocs(collection(db, EMPLOYEE_COMPETENCIES)),
      department
        ? getDocs(query(collection(db, EMPLOYEES), where('status', '==', 'ACTIVE'), where('department', '==', department)))
        : getDocs(query(collection(db, EMPLOYEES), where('status', '==', 'ACTIVE'))),
    ]);

    if (competenciesSnap.empty || employeesSnap.empty) {
      logger.log('[analyticsService] No competencies or employees found for gap analysis');
      return [];
    }

    // Build competency lookup map: id -> { name, ... }
    const competencyMap = new Map<string, { name: string; competency_code: string }>();
    for (const docSnap of competenciesSnap.docs) {
      const data = docSnap.data();
      competencyMap.set(docSnap.id, {
        name: (data.name as string) || (data.competency_code as string) || docSnap.id,
        competency_code: (data.competency_code as string) || '',
      });
    }

    // Build employee lookup map: employee_id -> department
    const employeeDeptMap = new Map<string, string>();
    for (const docSnap of employeesSnap.docs) {
      const data = docSnap.data();
      const empId = (data.employee_id as string) || docSnap.id;
      employeeDeptMap.set(empId, (data.department as string) || 'UNKNOWN');
    }

    // Build aggregation: key = "department::competency_id"
    interface GapAccumulator {
      department: string;
      competencyId: string;
      competencyName: string;
      totalLevel: number;
      totalTargetLevel: number;
      employeesBelow: number;
      totalEmployees: number;
    }

    const gapMap = new Map<string, GapAccumulator>();

    for (const docSnap of empCompSnap.docs) {
      const data = docSnap.data();
      const employeeId = (data.employee_id as string) || '';
      const competencyId = (data.competency_id as string) || '';
      const currentLevel = levelToNumber((data.current_level as string) || 'NOVICE');
      const targetLevel = levelToNumber((data.target_level as string) || 'COMPETENT');

      // Skip if employee is not in our filtered set
      const dept = employeeDeptMap.get(employeeId);
      if (!dept) continue;

      // Skip if competency is not active
      const comp = competencyMap.get(competencyId);
      if (!comp) continue;

      const key = `${dept}::${competencyId}`;
      const existing = gapMap.get(key);

      if (existing) {
        existing.totalLevel += currentLevel;
        existing.totalTargetLevel += targetLevel;
        existing.totalEmployees += 1;
        if (currentLevel < targetLevel) {
          existing.employeesBelow += 1;
        }
      } else {
        gapMap.set(key, {
          department: dept,
          competencyId,
          competencyName: comp.name,
          totalLevel: currentLevel,
          totalTargetLevel: targetLevel,
          employeesBelow: currentLevel < targetLevel ? 1 : 0,
          totalEmployees: 1,
        });
      }
    }

    // Convert to result array
    const gaps: CompetencyGapAnalysis[] = [];
    for (const acc of gapMap.values()) {
      if (acc.totalEmployees === 0) continue;

      const avgCurrent = acc.totalLevel / acc.totalEmployees;
      const avgTarget = acc.totalTargetLevel / acc.totalEmployees;
      const gap = Math.round((avgTarget - avgCurrent) * 100) / 100;

      gaps.push({
        department: acc.department,
        competency: acc.competencyName,
        currentLevel: Math.round(avgCurrent * 100) / 100,
        targetLevel: Math.round(avgTarget * 100) / 100,
        gap,
        employeesBelow: acc.employeesBelow,
        totalEmployees: acc.totalEmployees,
      });
    }

    // Sort by gap size (largest first)
    gaps.sort((a, b) => b.gap - a.gap);

    setCache(cacheKey, gaps);
    return gaps;
  } catch (error) {
    logger.error('[analyticsService] calculateCompetencyGaps error:', error);
    return [];
  }
};

// ============================================================
// 4. calculateROI()
// ============================================================

/**
 * Calculate ROI (Return on Investment) analysis for a given year.
 * Reads from `training_costs` collection and correlates with training results
 * to estimate benefits.
 *
 * Optimized: Filters costs by year (period field) and results by training_date
 * instead of reading entire collections.
 *
 * @param year - The year to calculate ROI for (e.g., 2026)
 */
export const calculateROI = async (year: number): Promise<ROIAnalysis> => {
  const yearStr = String(year);
  const defaultResult: ROIAnalysis = {
    period: yearStr,
    totalCost: 0,
    totalBenefit: 0,
    roi: 0,
    costPerEmployee: 0,
    costPerTrainingHour: 0,
    qualityImprovementRate: 0,
  };

  const cacheKey = `roi_${yearStr}`;
  const cached = getCached<ROIAnalysis>(cacheKey);
  if (cached) {
    logger.log('[analyticsService] Using cached ROI for year:', yearStr);
    return cached;
  }

  try {
    const yearStart = `${yearStr}-01-01`;
    const yearEnd = `${yearStr}-12-31`;

    // Fetch costs filtered by year, results filtered by year, and active programs
    const [costsSnap, resultsSnap, programsSnap] = await Promise.all([
      getDocs(query(
        collection(db, TRAINING_COSTS),
        where('period', '>=', `${yearStr}-01`),
        where('period', '<=', `${yearStr}-12`),
        orderBy('period', 'asc')
      )),
      getDocs(query(
        collection(db, TRAINING_RESULTS),
        where('training_date', '>=', yearStart),
        where('training_date', '<=', yearEnd),
        orderBy('training_date', 'asc')
      )),
      getDocs(query(collection(db, TRAINING_PROGRAMS), where('is_active', '==', true))),
    ]);

    // Sum all costs (already filtered to target year)
    let totalCost = 0;
    for (const docSnap of costsSnap.docs) {
      const data = docSnap.data();
      totalCost += (data.total as number) || 0;
    }

    // Parse results (already filtered to target year)
    const yearResults: TrainingResultRecord[] = resultsSnap.docs.map(parseResultDoc);

    if (yearResults.length === 0 && totalCost === 0) {
      return defaultResult;
    }

    // Build program duration map
    const programDurationMap = new Map<string, number>();
    for (const docSnap of programsSnap.docs) {
      const data = docSnap.data();
      const code = (data.program_code as string) || docSnap.id;
      programDurationMap.set(code, (data.duration_hours as number) || 0);
    }

    // Calculate training hours
    const passedResults = yearResults.filter((r) => r.result === 'PASS');
    const totalTrainingHours = passedResults.reduce((sum, r) => {
      return sum + (programDurationMap.get(r.program_code) || 0);
    }, 0);

    // Calculate unique employees trained
    const uniqueEmployees = new Set(yearResults.map((r) => r.employee_id));
    const employeeCount = uniqueEmployees.size;

    // Calculate pass rate for the year
    const totalAttempts = yearResults.filter((r) => r.result !== 'ABSENT').length;
    const passCount = passedResults.length;
    const passRate = totalAttempts > 0 ? passCount / totalAttempts : 0;

    // Calculate quality improvement rate:
    // Compare first half vs second half pass rates
    const midYear = `${yearStr}-07`;
    const firstHalf = yearResults.filter(
      (r) => r.training_date < midYear && r.result !== 'ABSENT'
    );
    const secondHalf = yearResults.filter(
      (r) => r.training_date >= midYear && r.result !== 'ABSENT'
    );
    const firstHalfPassRate =
      firstHalf.length > 0
        ? firstHalf.filter((r) => r.result === 'PASS').length / firstHalf.length
        : 0;
    const secondHalfPassRate =
      secondHalf.length > 0
        ? secondHalf.filter((r) => r.result === 'PASS').length / secondHalf.length
        : 0;
    const qualityImprovementRate =
      firstHalfPassRate > 0
        ? Math.round(((secondHalfPassRate - firstHalfPassRate) / firstHalfPassRate) * 10000) / 100
        : 0;

    // Estimate benefit: pass rate * number of employees * average cost saving factor
    // This is a simplified model. The benefit is estimated as:
    //   trainedEmployees * passRate * averageBenefitPerEmployee
    // where averageBenefitPerEmployee is approximated as 2x the cost per employee
    const costPerEmployee = employeeCount > 0 ? Math.round(totalCost / employeeCount) : 0;
    const totalBenefit = Math.round(employeeCount * passRate * costPerEmployee * 2);

    const roi = totalCost > 0
      ? Math.round(((totalBenefit - totalCost) / totalCost) * 10000) / 100
      : 0;

    const costPerTrainingHour = totalTrainingHours > 0
      ? Math.round(totalCost / totalTrainingHours)
      : 0;

    const roiResult: ROIAnalysis = {
      period: yearStr,
      totalCost,
      totalBenefit,
      roi,
      costPerEmployee,
      costPerTrainingHour,
      qualityImprovementRate,
    };

    setCache(cacheKey, roiResult);
    return roiResult;
  } catch (error) {
    logger.error('[analyticsService] calculateROI error:', error);
    return defaultResult;
  }
};

// ============================================================
// 5. getTrainingTrends()
// ============================================================

/**
 * Aggregate training completion data by month.
 * Returns trend data suitable for line/bar charts.
 *
 * Optimized: Only fetches results from the lookback period start date.
 *
 * @param months - Number of months to look back (default: 12)
 */
export const getTrainingTrends = async (
  months: number = 12
): Promise<TrendData[]> => {
  const cacheKey = `trends_${months}`;
  const cached = getCached<TrendData[]>(cacheKey);
  if (cached) {
    logger.log('[analyticsService] Using cached trends for', months, 'months');
    return cached;
  }

  try {
    const periods = getMonthPeriods(months);
    const startDate = `${periods[0]}-01`; // e.g., "2025-03-01"

    // Only fetch results from the lookback period (not entire collection)
    const resultsSnap = await getDocs(buildResultsQuery(startDate));

    if (resultsSnap.empty) {
      logger.log('[analyticsService] No training results found for trends');
      return periods.map((p) => ({ period: p, value: 0, label: 'Completions' }));
    }

    // Count completions per month
    const monthlyCounts = new Map<string, number>();
    for (const period of periods) {
      monthlyCounts.set(period, 0);
    }

    for (const docSnap of resultsSnap.docs) {
      const data = docSnap.data();
      const trainingDate = (data.training_date as string) || '';
      const result = (data.result as string) || '';
      const month = trainingDate.substring(0, 7); // YYYY-MM

      if (result === 'PASS' && monthlyCounts.has(month)) {
        monthlyCounts.set(month, (monthlyCounts.get(month) || 0) + 1);
      }
    }

    const trends = periods.map((period) => ({
      period,
      value: monthlyCounts.get(period) || 0,
      label: 'Completions',
    }));

    setCache(cacheKey, trends);
    return trends;
  } catch (error) {
    logger.error('[analyticsService] getTrainingTrends error:', error);
    return [];
  }
};

// ============================================================
// 6. getDepartmentComparison()
// ============================================================

/**
 * Compare training metrics across departments.
 * Returns completion rate, pass rate, and average score per department.
 *
 * Optimized: Only fetches results from the last N months (default: 6).
 *
 * @param monthsBack - Number of months to look back for results (default: 6)
 */
export const getDepartmentComparison = async (
  monthsBack: number = 6
): Promise<DepartmentComparison[]> => {
  const cacheKey = `dept_comparison_${monthsBack}`;
  const cached = getCached<DepartmentComparison[]>(cacheKey);
  if (cached) {
    logger.log('[analyticsService] Using cached department comparison');
    return cached;
  }

  try {
    const startDate = getDateMonthsAgo(monthsBack);

    // Fetch employees, programs, and results (date-filtered) in parallel
    const [employeesSnap, programsSnap, resultsSnap] = await Promise.all([
      getDocs(query(collection(db, EMPLOYEES), where('status', '==', 'ACTIVE'))),
      getDocs(query(collection(db, TRAINING_PROGRAMS), where('is_active', '==', true))),
      getDocs(buildResultsQuery(startDate)),
    ]);

    if (employeesSnap.empty || programsSnap.empty) {
      logger.log('[analyticsService] No employees or programs for department comparison');
      return [];
    }

    // Parse using shared helpers
    const employees: Employee[] = employeesSnap.docs.map(parseEmployeeDoc);
    const programs: TrainingProgram[] = programsSnap.docs.map(parseProgramDoc);
    const results: TrainingResultRecord[] = resultsSnap.docs.map(parseResultDoc);

    // Group employees by department
    const deptEmployees = new Map<string, Employee[]>();
    for (const emp of employees) {
      const dept = emp.department || 'UNKNOWN';
      const existing = deptEmployees.get(dept);
      if (existing) {
        existing.push(emp);
      } else {
        deptEmployees.set(dept, [emp]);
      }
    }

    // Build result lookup: employee_id -> results[]
    const empResultsMap = new Map<string, TrainingResultRecord[]>();
    for (const r of results) {
      const existing = empResultsMap.get(r.employee_id);
      if (existing) {
        existing.push(r);
      } else {
        empResultsMap.set(r.employee_id, [r]);
      }
    }

    const now = new Date();
    const comparisons: DepartmentComparison[] = [];

    for (const [dept, deptEmps] of deptEmployees) {
      let totalRequired = 0;
      let totalCompleted = 0;
      let deptPassCount = 0;
      let deptAttemptCount = 0;
      let deptScoreSum = 0;
      let deptScoreCount = 0;

      for (const emp of deptEmps) {
        const empResults = empResultsMap.get(emp.employee_id) || [];

        for (const program of programs) {
          if (!isProgramRequiredForEmployee(emp, program)) continue;
          totalRequired++;

          const latestValid = getLatestValidResult(
            emp.employee_id,
            program.program_code,
            results,
            program,
            now
          );

          if (latestValid) {
            totalCompleted++;
          }
        }

        // Pass rate and average score for this employee's results
        for (const r of empResults) {
          if (r.result !== 'ABSENT') {
            deptAttemptCount++;
            if (r.result === 'PASS') {
              deptPassCount++;
            }
          }
          if (r.score !== null && r.score !== undefined) {
            deptScoreSum += r.score;
            deptScoreCount++;
          }
        }
      }

      comparisons.push({
        department: dept,
        completionRate: totalRequired > 0
          ? Math.round((totalCompleted / totalRequired) * 100)
          : 0,
        passRate: deptAttemptCount > 0
          ? Math.round((deptPassCount / deptAttemptCount) * 100)
          : 0,
        avgScore: deptScoreCount > 0
          ? Math.round(deptScoreSum / deptScoreCount)
          : 0,
      });
    }

    // Sort by completion rate descending
    comparisons.sort((a, b) => b.completionRate - a.completionRate);

    setCache(cacheKey, comparisons);
    return comparisons;
  } catch (error) {
    logger.error('[analyticsService] getDepartmentComparison error:', error);
    return [];
  }
};
