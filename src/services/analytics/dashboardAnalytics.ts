/**
 * Dashboard Analytics
 *
 * Functions for dashboard metrics: latest metrics (with pre-aggregated fallback),
 * historical metrics, and client-side calculation.
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
} from '@/utils/kpiCalculator';
import type { Employee, TrainingProgram, TrainingResultRecord } from '@/types';

import {
  type AnalyticsMetrics,
  DASHBOARD_METRICS,
  EMPLOYEES,
  TRAINING_PROGRAMS,
  TRAINING_SESSIONS,
  convertTimestampToString,
  getCached,
  setCache,
  getDateMonthsAgo,
  buildResultsQuery,
  parseResultDoc,
  parseEmployeeDoc,
  parseProgramDoc,
} from './shared';

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
