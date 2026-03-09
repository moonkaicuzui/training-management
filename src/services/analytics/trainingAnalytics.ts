/**
 * Training Analytics
 *
 * Training trends (monthly completions) and department comparison metrics.
 */

import {
  db,
  collection,
  getDocs,
  query,
  where,
} from '@/services/firebase';
import { logger } from '@/utils/logger';
import {
  getLatestValidResult,
  isProgramRequiredForEmployee,
} from '@/utils/kpiCalculator';
import type { Employee, TrainingProgram, TrainingResultRecord } from '@/types';

import {
  type TrendData,
  type DepartmentComparison,
  EMPLOYEES,
  TRAINING_PROGRAMS,
  getMonthPeriods,
  getCached,
  setCache,
  getDateMonthsAgo,
  buildResultsQuery,
  parseResultDoc,
  parseEmployeeDoc,
  parseProgramDoc,
} from './shared';

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
