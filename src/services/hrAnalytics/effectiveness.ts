/**
 * 시나리오 1: 교육 효과 측정
 * 교육 전후 HR 품질 지표 비교
 */

import { getHRSummary } from '@/services/hrIntegrationService';
import { logger } from '@/utils/logger';
import type { TrainingEffectivenessResult } from './types';
import {
  MONTH_NAMES, getPreviousMonth, getNextMonth,
  safelyFetchHREmployees, fetchTrainingResults,
} from './helpers';

export async function analyzeTrainingEffectiveness(
  month: string,
  year: number,
): Promise<TrainingEffectivenessResult[]> {
  const results: TrainingEffectivenessResult[] = [];

  try {
    const prev = getPreviousMonth(month, year);
    const next = getNextMonth(month, year);

    const [beforeHR, afterHR, currentHR] = await Promise.all([
      safelyFetchHREmployees(prev.month, prev.year),
      safelyFetchHREmployees(next.month, next.year),
      safelyFetchHREmployees(month, year),
    ]);

    const monthIdx = MONTH_NAMES.indexOf(month);
    const startDate = `${year}-${String(monthIdx + 1).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(monthIdx + 1).padStart(2, '0')}-31`;
    const trainingResults = await fetchTrainingResults({ startDate, endDate });

    if (trainingResults.length === 0) return results;

    const beforeMap = new Map(beforeHR.map((e) => [e.employee_id, e]));
    const afterMap = new Map(afterHR.map((e) => [e.employee_id, e]));
    const currentMap = new Map(currentHR.map((e) => [e.employee_id, e]));

    const processedEmployees = new Set<string>();
    for (const tr of trainingResults) {
      const key = `${tr.employee_id}_${tr.program_code}`;
      if (processedEmployees.has(key)) continue;
      processedEmployees.add(key);

      const before = beforeMap.get(tr.employee_id);
      const after = afterMap.get(tr.employee_id);
      const current = currentMap.get(tr.employee_id);
      const emp = current || before || after;
      if (!emp) continue;

      const beforeMetrics: TrainingEffectivenessResult['beforeMetrics'] = {
        aqlPassRate: undefined, fivePrsPassRate: undefined, riskScore: before?.risk_score,
      };
      const afterMetrics: TrainingEffectivenessResult['afterMetrics'] = {
        aqlPassRate: undefined, fivePrsPassRate: undefined, riskScore: after?.risk_score,
      };

      try {
        const [beforeSummary, afterSummary] = await Promise.all([
          getHRSummary(prev.month, prev.year),
          getHRSummary(next.month, next.year),
        ]);
        if (beforeSummary) {
          beforeMetrics.aqlPassRate = beforeSummary.aqlPassRate;
          beforeMetrics.fivePrsPassRate = beforeSummary.fivePrsPassRate;
        }
        if (afterSummary) {
          afterMetrics.aqlPassRate = afterSummary.aqlPassRate;
          afterMetrics.fivePrsPassRate = afterSummary.fivePrsPassRate;
        }
      } catch { /* ignore */ }

      results.push({
        employeeId: tr.employee_id,
        employeeName: emp.employee_name,
        programCode: tr.program_code,
        trainingDate: tr.training_date,
        beforeMetrics,
        afterMetrics,
        improvement: {
          aqlChange: beforeMetrics.aqlPassRate !== undefined && afterMetrics.aqlPassRate !== undefined
            ? afterMetrics.aqlPassRate - beforeMetrics.aqlPassRate : undefined,
          fivePrsChange: beforeMetrics.fivePrsPassRate !== undefined && afterMetrics.fivePrsPassRate !== undefined
            ? afterMetrics.fivePrsPassRate - beforeMetrics.fivePrsPassRate : undefined,
          riskChange: beforeMetrics.riskScore !== undefined && afterMetrics.riskScore !== undefined
            ? beforeMetrics.riskScore - afterMetrics.riskScore : undefined,
        },
      });
    }
  } catch (error) {
    logger.error('[hrAnalytics] analyzeTrainingEffectiveness 실패:', error);
  }

  return results;
}
