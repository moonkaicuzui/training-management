/**
 * 시나리오 6: 이직률 ↔ 교육 상관관계
 */

import { db, collection, query, getDocs, limit } from '@/services/firebase';
import { logger } from '@/utils/logger';
import type { TurnoverTrainingCorrelation } from './types';
import { MONTH_NAMES, safelyFetchHREmployees, fetchTrainingResults, fetchPrograms } from './helpers';

export async function analyzeTurnoverTrainingCorrelation(
  months: number = 6,
): Promise<TurnoverTrainingCorrelation[]> {
  const results: TurnoverTrainingCorrelation[] = [];

  try {
    const now = new Date();
    const programs = await fetchPrograms();
    const allResults = await fetchTrainingResults();

    const employeeTrainingHours = new Map<string, number>();
    for (const r of allResults) {
      if (r.result === 'PASS') {
        const program = programs.get(r.program_code);
        const hours = program?.duration_hours || 1;
        employeeTrainingHours.set(r.employee_id, (employeeTrainingHours.get(r.employee_id) || 0) + hours);
      }
    }

    const employeeHasTraining = new Set<string>();
    for (const r of allResults) {
      if (r.result === 'PASS') employeeHasTraining.add(r.employee_id);
    }

    const tqcSnapshot = await getDocs(query(collection(db, 'tqc_trainees'), limit(1000)));
    const tqcCompletedSet = new Set<string>();
    tqcSnapshot.docs.forEach((d) => {
      const data = d.data();
      if ((data.status as string) === 'PASSED') tqcCompletedSet.add((data.employee_id as string) || '');
    });

    for (let i = 0; i < months; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = MONTH_NAMES[targetDate.getMonth()];
      const y = targetDate.getFullYear();
      const period = `${m}_${y}`;

      const hrEmployees = await safelyFetchHREmployees(m, y);

      if (hrEmployees.length === 0) {
        results.push({
          period, totalResignations: 0, resignedWithTraining: 0, resignedWithoutTraining: 0,
          trainingRetentionRate: 0, noTrainingRetentionRate: 0, tqcCompletionSurvivalRate: 0,
          avgTrainingHoursResigned: 0, avgTrainingHoursRetained: 0,
        });
        continue;
      }

      const resigned = hrEmployees.filter((e) => e.resigned_this_month);
      const active = hrEmployees.filter((e) => e.is_active);
      const totalResignations = resigned.length;

      const resignedWithTraining = resigned.filter((e) => employeeHasTraining.has(e.employee_id)).length;
      const resignedWithoutTraining = totalResignations - resignedWithTraining;

      const trainedActive = active.filter((e) => employeeHasTraining.has(e.employee_id)).length;
      const trainedTotal = trainedActive + resignedWithTraining;
      const trainingRetentionRate = trainedTotal > 0 ? Math.round((trainedActive / trainedTotal) * 100) : 0;

      const untrainedActive = active.filter((e) => !employeeHasTraining.has(e.employee_id)).length;
      const untrainedTotal = untrainedActive + resignedWithoutTraining;
      const noTrainingRetentionRate = untrainedTotal > 0 ? Math.round((untrainedActive / untrainedTotal) * 100) : 0;

      const tqcCompleted = active.filter((e) => tqcCompletedSet.has(e.employee_id)).length;
      const tqcTotal = tqcCompleted + resigned.filter((e) => tqcCompletedSet.has(e.employee_id)).length;
      const tqcCompletionSurvivalRate = tqcTotal > 0 ? Math.round((tqcCompleted / tqcTotal) * 100) : 0;

      const resignedHours = resigned.map((e) => employeeTrainingHours.get(e.employee_id) || 0).reduce((s, v) => s + v, 0);
      const retainedHours = active.map((e) => employeeTrainingHours.get(e.employee_id) || 0).reduce((s, v) => s + v, 0);

      results.push({
        period, totalResignations, resignedWithTraining, resignedWithoutTraining,
        trainingRetentionRate, noTrainingRetentionRate, tqcCompletionSurvivalRate,
        avgTrainingHoursResigned: resigned.length > 0 ? Math.round(resignedHours / resigned.length) : 0,
        avgTrainingHoursRetained: active.length > 0 ? Math.round((retainedHours / active.length) * 10) / 10 : 0,
      });
    }

    results.reverse();
  } catch (error) {
    logger.error('[hrAnalytics] analyzeTurnoverTrainingCorrelation 실패:', error);
  }

  return results;
}
