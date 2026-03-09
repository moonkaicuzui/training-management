/**
 * Quality Analytics
 *
 * Competency gap analysis and ROI calculation for training investments.
 */

import {
  db,
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from '@/services/firebase';
import { logger } from '@/utils/logger';
import type { TrainingResultRecord } from '@/types';

import {
  type CompetencyGapAnalysis,
  type ROIAnalysis,
  COMPETENCIES,
  EMPLOYEE_COMPETENCIES,
  EMPLOYEES,
  TRAINING_COSTS,
  TRAINING_RESULTS,
  TRAINING_PROGRAMS,
  levelToNumber,
  getCached,
  setCache,
  parseResultDoc,
} from './shared';

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
