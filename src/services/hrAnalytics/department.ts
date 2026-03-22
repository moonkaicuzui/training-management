/**
 * 시나리오 5: 부서별 교육 완료율
 */

import { logger } from '@/utils/logger';
import type { DepartmentTrainingRate } from './types';
import { fetchQTrainEmployees, fetchPrograms, fetchTrainingResults } from './helpers';

export async function getDepartmentTrainingRates(): Promise<DepartmentTrainingRate[]> {
  const results: DepartmentTrainingRate[] = [];

  try {
    const qtEmployees = await fetchQTrainEmployees();
    const programs = await fetchPrograms();
    const allResults = await fetchTrainingResults();

    const deptEmployees = new Map<string, Array<{ employee_id: string; employee_name: string; status: string; position: string }>>();
    for (const [, emp] of qtEmployees) {
      const dept = emp.department || 'OTHER';
      const list = deptEmployees.get(dept) || [];
      list.push(emp);
      deptEmployees.set(dept, list);
    }

    const employeePassedMap = new Map<string, Set<string>>();
    const employeeScores = new Map<string, number[]>();
    const employeePassCount = new Map<string, number>();

    for (const r of allResults) {
      if (r.result === 'PASS') {
        const passed = employeePassedMap.get(r.employee_id) || new Set();
        passed.add(r.program_code);
        employeePassedMap.set(r.employee_id, passed);
        employeePassCount.set(r.employee_id, (employeePassCount.get(r.employee_id) || 0) + 1);
      }
      if (r.score !== null) {
        const scores = employeeScores.get(r.employee_id) || [];
        scores.push(r.score);
        employeeScores.set(r.employee_id, scores);
      }
    }

    for (const [dept, employees] of deptEmployees) {
      const activeEmployees = employees.filter((e) => e.status === 'ACTIVE');
      if (activeEmployees.length === 0) continue;

      let totalRequired = 0;
      let totalCompleted = 0;
      const scores: number[] = [];
      let passCount = 0;
      let totalCount = 0;
      const performerMap: Array<{ name: string; count: number }> = [];
      const needsAttentionList: string[] = [];

      for (const emp of activeEmployees) {
        const targetPrograms = Array.from(programs.values()).filter(
          (p) => p.target_positions.length === 0 || p.target_positions.includes(emp.position)
        );
        totalRequired += targetPrograms.length;

        const passed = employeePassedMap.get(emp.employee_id);
        const completedCount = passed ? targetPrograms.filter((p) => passed.has(p.program_code)).length : 0;
        totalCompleted += completedCount;

        const empScores = employeeScores.get(emp.employee_id) || [];
        scores.push(...empScores);

        const empPassCount = employeePassCount.get(emp.employee_id) || 0;
        passCount += empPassCount;
        totalCount += empScores.length || (empPassCount > 0 ? empPassCount : 0);

        performerMap.push({ name: emp.employee_name, count: empPassCount });
        if (completedCount === 0 && targetPrograms.length > 0) needsAttentionList.push(emp.employee_name);
      }

      performerMap.sort((a, b) => b.count - a.count);

      results.push({
        department: dept,
        totalEmployees: employees.length,
        activeEmployees: activeEmployees.length,
        requiredPrograms: totalRequired,
        completedPrograms: totalCompleted,
        completionRate: totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 0,
        avgScore: scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0,
        passRate: totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0,
        topPerformers: performerMap.slice(0, 3).map((p) => p.name),
        needsAttention: needsAttentionList.slice(0, 5),
      });
    }

    results.sort((a, b) => b.completionRate - a.completionRate);
  } catch (error) {
    logger.error('[hrAnalytics] getDepartmentTrainingRates 실패:', error);
  }

  return results;
}
