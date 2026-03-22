/**
 * 시나리오 4: 품질 데이터 양방향 비교
 */

import { db, collection, query, getDocs, limit } from '@/services/firebase';
import { getHRSummary } from '@/services/hrIntegrationService';
import { logger } from '@/utils/logger';
import type { QualitySync } from './types';
import { safelyFetchHREmployees, fetchQTrainEmployees } from './helpers';

export async function compareQualityData(
  month: string,
  year: number,
): Promise<QualitySync[]> {
  const results: QualitySync[] = [];

  try {
    const hrEmployees = await safelyFetchHREmployees(month, year);
    const hrSummary = await getHRSummary(month, year).catch(() => null);
    const qtEmployees = await fetchQTrainEmployees();

    const aqlLogsSnapshot = await getDocs(query(collection(db, 'aql_enrollment_logs'), limit(1000)));
    const aqlFailRateMap = new Map<string, number>();
    aqlLogsSnapshot.docs.forEach((d) => {
      const data = d.data();
      const empId = (data.employee_id as string) || '';
      const failRate = (data.fail_rate as number) ?? null;
      if (empId && failRate !== null) aqlFailRateMap.set(empId, failRate);
    });

    const inspResults = await getDocs(query(collection(db, 'inspection_results'), limit(1000)));
    const inspGradeMap = new Map<string, string>();
    inspResults.docs.forEach((d) => {
      const data = d.data();
      const empId = (data.employee_id as string) || '';
      const grade = (data.grade as string) || '';
      if (empId && grade) inspGradeMap.set(empId, grade);
    });

    const hrMap = new Map(hrEmployees.map((e) => [e.employee_id, e]));
    const employeeIds = new Set([...qtEmployees.keys(), ...hrMap.keys()]);

    for (const empId of employeeIds) {
      const qtEmp = qtEmployees.get(empId);
      const hrEmp = hrMap.get(empId);
      if (!qtEmp && !hrEmp) continue;
      if (qtEmp && qtEmp.status !== 'ACTIVE') continue;

      const aqlFailRate = aqlFailRateMap.get(empId);
      const inspGrade = inspGradeMap.get(empId);

      let discrepancy = false;
      if (aqlFailRate !== undefined && hrSummary?.aqlPassRate !== undefined) {
        const expectedPassRate = 100 - aqlFailRate;
        if (Math.abs(expectedPassRate - hrSummary.aqlPassRate) > 10) discrepancy = true;
      }

      results.push({
        employeeId: empId,
        employeeName: qtEmp?.employee_name || hrEmp?.employee_name || '',
        qtrain: { aqlFailRate: aqlFailRate ?? undefined, fivePrsFailRate: undefined, inspectionGrade: inspGrade ?? undefined },
        hrV2: { aqlPassRate: hrSummary?.aqlPassRate ?? undefined, fivePrsPassRate: hrSummary?.fivePrsPassRate ?? undefined, qualityGrade: undefined },
        discrepancy,
        lastSynced: hrSummary?.syncedAt,
      });
    }

    results.sort((a, b) => (b.discrepancy ? 1 : 0) - (a.discrepancy ? 1 : 0));
  } catch (error) {
    logger.error('[hrAnalytics] compareQualityData 실패:', error);
  }

  return results;
}
