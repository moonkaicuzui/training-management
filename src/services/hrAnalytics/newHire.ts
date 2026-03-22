/**
 * 시나리오 3: 신입 TQC 자동 등록 현황
 */

import { db, collection, query, getDocs, limit } from '@/services/firebase';
import { logger } from '@/utils/logger';
import type { NewHireTrainingStatus } from './types';
import { daysSince, safelyFetchHREmployees, fetchQTrainEmployees, fetchTrainingResults, fetchPrograms } from './helpers';

export async function getNewHireTrainingStatus(
  month: string,
  year: number,
): Promise<NewHireTrainingStatus[]> {
  const results: NewHireTrainingStatus[] = [];

  try {
    const hrEmployees = await safelyFetchHREmployees(month, year);

    let newHires: Array<{ employee_id: string; employee_name: string; entrance_date: string; team: string; building: string; working_days: number }>;

    if (hrEmployees.length > 0) {
      newHires = hrEmployees
        .filter((e) => (e.hired_this_month || e.working_days < 60) && e.is_active)
        .map((e) => ({ employee_id: e.employee_id, employee_name: e.employee_name, entrance_date: e.entrance_date, team: e.team, building: e.building, working_days: e.working_days }));
    } else {
      const qtEmployees = await fetchQTrainEmployees();
      newHires = [];
      for (const [, emp] of qtEmployees) {
        if (emp.status !== 'ACTIVE') continue;
        const days = daysSince(emp.hire_date);
        if (days > 0 && days < 60) {
          newHires.push({ employee_id: emp.employee_id, employee_name: emp.employee_name, entrance_date: emp.hire_date, team: emp.department, building: emp.building, working_days: days });
        }
      }
    }

    if (newHires.length === 0) return results;

    const tqcSnapshot = await getDocs(query(collection(db, 'tqc_trainees'), limit(1000)));
    const tqcMap = new Map<string, { status: string; created_at?: string }>();
    tqcSnapshot.docs.forEach((d) => {
      const data = d.data();
      const empId = (data.employee_id as string) || '';
      if (empId) {
        tqcMap.set(empId, { status: (data.status as string) || 'IN_TRAINING', created_at: (data.created_at as string) || undefined });
      }
    });

    const allResults = await fetchTrainingResults();
    const employeeCompletedMap = new Map<string, string[]>();
    for (const r of allResults) {
      if (r.result === 'PASS') {
        const existing = employeeCompletedMap.get(r.employee_id) || [];
        existing.push(r.program_code);
        employeeCompletedMap.set(r.employee_id, existing);
      }
    }

    const programs = await fetchPrograms();
    const newcomerPrograms = Array.from(programs.values()).filter((p) => p.category === 'NEWCOMER').map((p) => p.program_code);

    for (const hire of newHires) {
      const tqc = tqcMap.get(hire.employee_id);
      let tqcStatus: NewHireTrainingStatus['tqcStatus'] = 'not_enrolled';
      if (tqc) {
        if (tqc.status === 'PASSED') tqcStatus = 'completed';
        else if (tqc.status === 'FAILED') tqcStatus = 'failed';
        else tqcStatus = 'in_training';
      }

      const completed = employeeCompletedMap.get(hire.employee_id) || [];
      const requiredPrograms = newcomerPrograms.length > 0 ? newcomerPrograms : ['NEWCOMER'];
      const completedPrograms = completed.filter((p) => requiredPrograms.includes(p));
      const completionRate = requiredPrograms.length > 0 ? Math.round((completedPrograms.length / requiredPrograms.length) * 100) : 0;

      results.push({
        employeeId: hire.employee_id, employeeName: hire.employee_name,
        hireDate: hire.entrance_date, team: hire.team, building: hire.building,
        daysEmployed: hire.working_days, tqcStatus, tqcEnrollDate: tqc?.created_at,
        requiredPrograms, completedPrograms, completionRate,
      });
    }

    results.sort((a, b) => b.hireDate.localeCompare(a.hireDate));
  } catch (error) {
    logger.error('[hrAnalytics] getNewHireTrainingStatus 실패:', error);
  }

  return results;
}
