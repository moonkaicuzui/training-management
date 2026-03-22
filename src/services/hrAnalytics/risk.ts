/**
 * 시나리오 2: 위험 직원 교육 우선순위
 */

import { logger } from '@/utils/logger';
import type { RiskBasedRecommendation } from './types';
import { daysSince, safelyFetchHREmployees, fetchQTrainEmployees, fetchTrainingResults } from './helpers';

export async function getHighRiskTrainingRecommendations(
  month: string,
  year: number,
): Promise<RiskBasedRecommendation[]> {
  const results: RiskBasedRecommendation[] = [];

  try {
    const hrEmployees = await safelyFetchHREmployees(month, year);
    const highRiskEmployees = hrEmployees.filter((e) => e.risk_score >= 25 && e.is_active);

    if (highRiskEmployees.length === 0) {
      const qtEmployees = await fetchQTrainEmployees();
      for (const [, emp] of qtEmployees) {
        if (emp.status !== 'ACTIVE') continue;
        const days = daysSince(emp.hire_date);
        if (days > 0 && days < 60) {
          results.push({
            employeeId: emp.employee_id, employeeName: emp.employee_name,
            team: emp.department, building: emp.building,
            riskScore: 30, riskLevel: 'medium',
            riskFactors: ['60일 미만 신입'], recommendedPrograms: ['NEWCOMER'],
            currentTrainingStatus: 'none',
          });
        }
      }
      return results;
    }

    const allResults = await fetchTrainingResults();
    const employeeResultMap = new Map<string, string[]>();
    for (const r of allResults) {
      if (r.result === 'PASS') {
        const existing = employeeResultMap.get(r.employee_id) || [];
        existing.push(r.program_code);
        employeeResultMap.set(r.employee_id, existing);
      }
    }

    for (const emp of highRiskEmployees) {
      const riskFactors: string[] = [];
      const recommendedPrograms: string[] = [];

      if (emp.unauthorized_absent_days > 0) { riskFactors.push('무단결근'); recommendedPrograms.push('QIP-001'); }
      if (emp.absent_days > 3) { riskFactors.push('높은 결근율'); }
      if (emp.working_days < 60) { riskFactors.push('60일 미만 근무'); recommendedPrograms.push('NEWCOMER'); }
      if (emp.risk_score >= 50) { riskFactors.push('매우 높은 위험 점수'); recommendedPrograms.push('RETRAINING'); }
      if (recommendedPrograms.length === 0) recommendedPrograms.push('QIP-001');

      const completedPrograms = employeeResultMap.get(emp.employee_id) || [];
      let status: 'none' | 'in_progress' | 'completed' = 'none';
      if (completedPrograms.length > 0) {
        status = recommendedPrograms.every((p) => completedPrograms.includes(p)) ? 'completed' : 'in_progress';
      }

      results.push({
        employeeId: emp.employee_id, employeeName: emp.employee_name,
        team: emp.team, building: emp.building,
        riskScore: emp.risk_score,
        riskLevel: emp.risk_score >= 50 ? 'high' : emp.risk_score >= 25 ? 'medium' : 'low',
        riskFactors, recommendedPrograms: [...new Set(recommendedPrograms)],
        currentTrainingStatus: status,
      });
    }

    results.sort((a, b) => b.riskScore - a.riskScore);
  } catch (error) {
    logger.error('[hrAnalytics] getHighRiskTrainingRecommendations 실패:', error);
  }

  return results;
}
