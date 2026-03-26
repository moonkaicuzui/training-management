// ============================================================
// Q-TRAIN Analytics API
// Dashboard, Progress Matrix, Retraining, Expiring, Search,
// Certification Expiry Notifications
// ============================================================

import {
  calculateDashboardKPIs,
  toDashboardStats,
} from '@/utils/kpiCalculator';
import { logger } from '@/utils/logger';

import * as employeeService from '../employeeService';
import * as programService from '../programService';
import * as sessionService from '../sessionService';
import * as resultService from '../resultService';
import * as aqlService from '../aqlService';
import * as notificationService from '../notificationService';

import type {
  Employee,
  TrainingProgram,
  TrainingResultRecord,
  DashboardStats,
  MonthlyTrainingData,
  GradeDistribution,
  ProgressMatrixData,
  ProgressMatrixFilters,
  RetrainingTarget,
  ExpiringTraining,
  Grade,
} from '@/types';

import { apiCache } from './common';

// ========== Dashboard API ==========

export async function getDashboardStats(): Promise<DashboardStats> {
  const cached = apiCache.get<DashboardStats>('dashboard:stats');
  if (cached) return cached;

  const [employees, programs, results] = await Promise.all([
    employeeService.getEmployees(),
    programService.getPrograms(),
    resultService.getResults(),
  ]);

  const kpiResult = calculateDashboardKPIs(employees, programs, results);
  const stats = toDashboardStats(kpiResult);

  // Google Drive CSV 직원 수를 별도 필드로 보존 (KPI의 totalEmployees는 Firestore employees 기반 유지)
  try {
    const manpower = await aqlService.fetchAqlManpower();
    const activeCount = manpower.data.filter(row => !row.stop_working_date).length;
    if (activeCount > 0) {
      stats.hrTotalEmployees = activeCount;
    }
  } catch (error) {
    logger.warn('[api] Failed to fetch manpower from Drive, using Firestore employee count:', error);
  }

  apiCache.set('dashboard:stats', stats);
  return stats;
}

export async function getMonthlyTrainingData(): Promise<MonthlyTrainingData[]> {
  const cached = apiCache.get<MonthlyTrainingData[]>('dashboard:monthly');
  if (cached) return cached;

  const sessions = await sessionService.getSessions();

  const monthlyData: Record<string, { planned: number; completed: number }> = {};

  // Get last 6 months
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = date.toISOString().substring(0, 7);
    monthlyData[monthKey] = { planned: 0, completed: 0 };
  }

  // Count sessions
  for (const session of sessions) {
    const monthKey = session.session_date.substring(0, 7);
    if (monthlyData[monthKey]) {
      monthlyData[monthKey].planned += session.attendees?.length || 0;
      if (session.status === 'COMPLETED') {
        monthlyData[monthKey].completed += session.attendees?.length || 0;
      }
    }
  }

  const result = Object.entries(monthlyData).map(([month, data]) => ({
    month,
    ...data,
  }));

  apiCache.set('dashboard:monthly', result);
  return result;
}

export async function getGradeDistribution(): Promise<GradeDistribution[]> {
  const cached = apiCache.get<GradeDistribution[]>('dashboard:grades');
  if (cached) return cached;

  const results = await resultService.getResults();

  const counts: Record<Grade, number> = { AA: 0, A: 0, B: 0, C: 0 };
  let total = 0;

  for (const result of results) {
    if (result.grade) {
      counts[result.grade]++;
      total++;
    }
  }

  const grades: Grade[] = ['AA', 'A', 'B', 'C'];
  const distribution = grades.map(grade => ({
    grade,
    count: counts[grade],
    percentage: total > 0 ? Math.round((counts[grade] / total) * 100) : 0,
  }));

  apiCache.set('dashboard:grades', distribution);
  return distribution;
}

// ========== Progress Matrix API ==========

export async function getProgressMatrix(
  filters?: ProgressMatrixFilters
): Promise<ProgressMatrixData> {
  const [allEmployees, allPrograms, allResults] = await Promise.all([
    employeeService.getEmployees(),
    programService.getPrograms(),
    resultService.getResults(),
  ]);

  let employees = allEmployees.filter(e => e.status === 'ACTIVE');
  const programs = allPrograms.filter(p => p.is_active);

  if (filters?.building) {
    employees = employees.filter(e => e.building === filters.building);
  }
  if (filters?.line) {
    employees = employees.filter(e => e.line === filters.line);
  }
  if (filters?.position) {
    employees = employees.filter(e => e.position === filters.position);
  }

  let filteredPrograms = programs;
  if (filters?.category) {
    filteredPrograms = programs.filter(p => p.category === filters.category);
  }

  const cells: ProgressMatrixData['cells'] = [];
  const now = new Date();

  for (const employee of employees) {
    for (const program of filteredPrograms) {
      const employeeResults = allResults
        .filter(
          r => r.employee_id === employee.employee_id && r.program_code === program.program_code
        )
        .sort((a, b) => b.training_date.localeCompare(a.training_date));

      const lastResult = employeeResults[0];

      let status: 'PASS' | 'FAIL' | 'EXPIRING' | 'EXPIRED' | 'NOT_TAKEN' = 'NOT_TAKEN';
      let expirationDate: string | undefined;

      if (lastResult) {
        if (lastResult.result === 'PASS') {
          if (program.validity_months) {
            const resultDate = new Date(lastResult.training_date);
            const expDate = new Date(resultDate);
            expDate.setMonth(expDate.getMonth() + program.validity_months);
            expirationDate = expDate.toISOString().substring(0, 10);

            const daysUntilExpiry = Math.ceil(
              (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (daysUntilExpiry < 0) {
              status = 'EXPIRED';
            } else if (daysUntilExpiry <= 30) {
              status = 'EXPIRING';
            } else {
              status = 'PASS';
            }
          } else {
            status = 'PASS';
          }
        } else {
          status = 'FAIL';
        }
      }

      cells.push({
        employeeId: employee.employee_id,
        programCode: program.program_code,
        status,
        lastResult,
        expirationDate,
      });
    }
  }

  return {
    employees,
    programs: filteredPrograms,
    cells,
  };
}

// ========== Retraining API ==========

export async function getRetrainingTargets(): Promise<RetrainingTarget[]> {
  const [allResults, allEmployees, allPrograms] = await Promise.all([
    resultService.getResults(),
    employeeService.getEmployees(),
    programService.getPrograms(),
  ]);

  const targets: RetrainingTarget[] = [];
  const now = new Date();
  const EXPIRING_THRESHOLD_DAYS = 30;

  const determineReason = (
    result: TrainingResultRecord,
    program: TrainingProgram
  ): 'FAILED' | 'EXPIRED' | 'EXPIRING_SOON' => {
    if (result.result === 'FAIL' || result.result === 'ABSENT') {
      return 'FAILED';
    }

    if (result.result === 'PASS' && program.validity_months) {
      const resultDate = new Date(result.training_date);
      const expDate = new Date(resultDate);
      expDate.setMonth(expDate.getMonth() + program.validity_months);

      const daysUntilExpiry = Math.ceil(
        (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry <= 0) {
        return 'EXPIRED';
      }
      if (daysUntilExpiry <= EXPIRING_THRESHOLD_DAYS) {
        return 'EXPIRING_SOON';
      }
    }

    return 'FAILED';
  };

  const retrainingResults = allResults.filter(r => r.needs_retraining);

  for (const result of retrainingResults) {
    const employee = allEmployees.find(e => e.employee_id === result.employee_id);
    const program = allPrograms.find(p => p.program_code === result.program_code);

    if (employee && program && employee.status === 'ACTIVE') {
      const retrainingPrograms = allPrograms.filter(
        p =>
          p.category === 'RETRAINING' &&
          p.is_active &&
          p.target_positions.includes(employee.position)
      );

      targets.push({
        employee,
        program,
        lastResult: result,
        reason: determineReason(result, program),
        recommendedPrograms: retrainingPrograms.slice(0, 3),
      });
    }
  }

  return targets;
}

export async function getExpiringTrainings(days: number = 30): Promise<ExpiringTraining[]> {
  const [allResults, allEmployees, allPrograms] = await Promise.all([
    resultService.getResults(),
    employeeService.getEmployees(),
    programService.getPrograms(),
  ]);

  const expiring: ExpiringTraining[] = [];
  const now = new Date();

  // Group results by employee and program, get latest PASS
  const latestPasses: Record<string, TrainingResultRecord> = {};

  for (const result of allResults) {
    if (result.result !== 'PASS') continue;

    const key = `${result.employee_id}-${result.program_code}`;
    if (!latestPasses[key] || result.training_date > latestPasses[key].training_date) {
      latestPasses[key] = result;
    }
  }

  for (const result of Object.values(latestPasses)) {
    const program = allPrograms.find(p => p.program_code === result.program_code);
    if (!program || !program.validity_months) continue;

    const employee = allEmployees.find(e => e.employee_id === result.employee_id);
    if (!employee || employee.status !== 'ACTIVE') continue;

    const resultDate = new Date(result.training_date);
    const expDate = new Date(resultDate);
    expDate.setMonth(expDate.getMonth() + program.validity_months);

    const daysUntilExpiry = Math.ceil(
      (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry > 0 && daysUntilExpiry <= days) {
      expiring.push({
        employee,
        program,
        lastPassDate: result.training_date,
        expirationDate: expDate.toISOString().substring(0, 10),
        daysUntilExpiry,
      });
    }
  }

  return expiring.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
}

export async function getExpiredTrainings(): Promise<ExpiringTraining[]> {
  const [allResults, allEmployees, allPrograms] = await Promise.all([
    resultService.getResults(),
    employeeService.getEmployees(),
    programService.getPrograms(),
  ]);

  const expired: ExpiringTraining[] = [];
  const now = new Date();

  // Group results by employee and program, get latest PASS
  const latestPasses: Record<string, TrainingResultRecord> = {};

  for (const result of allResults) {
    if (result.result !== 'PASS') continue;

    const key = `${result.employee_id}-${result.program_code}`;
    if (!latestPasses[key] || result.training_date > latestPasses[key].training_date) {
      latestPasses[key] = result;
    }
  }

  for (const result of Object.values(latestPasses)) {
    const program = allPrograms.find(p => p.program_code === result.program_code);
    if (!program || !program.validity_months) continue;

    const employee = allEmployees.find(e => e.employee_id === result.employee_id);
    if (!employee || employee.status !== 'ACTIVE') continue;

    const resultDate = new Date(result.training_date);
    const expDate = new Date(resultDate);
    expDate.setMonth(expDate.getMonth() + program.validity_months);

    const daysUntilExpiry = Math.ceil(
      (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry <= 0) {
      expired.push({
        employee,
        program,
        lastPassDate: result.training_date,
        expirationDate: expDate.toISOString().substring(0, 10),
        daysUntilExpiry,
      });
    }
  }

  // Sort by most recently expired first (least negative daysUntilExpiry)
  return expired.sort((a, b) => b.daysUntilExpiry - a.daysUntilExpiry);
}

// ========== Search API ==========

export async function globalSearch(query: string): Promise<{
  employees: Employee[];
  programs: TrainingProgram[];
}> {
  const [allEmployees, allPrograms] = await Promise.all([
    employeeService.getEmployees(),
    programService.getPrograms(),
  ]);

  const queryLower = query.toLowerCase();

  const employees = allEmployees.filter(
    e =>
      e.employee_id.toLowerCase().includes(queryLower) ||
      e.employee_name.toLowerCase().includes(queryLower)
  );

  const programs = allPrograms.filter(
    p =>
      p.program_code.toLowerCase().includes(queryLower) ||
      p.program_name.toLowerCase().includes(queryLower) ||
      p.program_name_vn.toLowerCase().includes(queryLower) ||
      p.program_name_kr.toLowerCase().includes(queryLower)
  );

  return {
    employees: employees.slice(0, 5),
    programs: programs.slice(0, 5),
  };
}

// ========== Certification Expiry Notification API ==========

/**
 * 자격 만료 예정 직원에 대해 자동 알림을 생성합니다.
 * - 30일 이내 만료 예정 자격 조회
 * - 이미 동일 알림이 존재하면 생성하지 않음 (중복 방지)
 * - type: 'CERTIFICATION_EXPIRY', priority: 'HIGH'
 */
export async function checkAndCreateExpiryNotifications(): Promise<number> {
  try {
    const expiringItems = await getExpiringTrainings(30);

    if (expiringItems.length === 0) return 0;

    // 기존 CERTIFICATION_EXPIRY 알림 조회 (중복 방지)
    const existingNotifications = await notificationService.getNotifications(undefined, {
      type: 'CERTIFICATION_EXPIRY',
    });

    // 기존 알림의 employee+program 키 세트
    const existingKeys = new Set<string>();
    for (const n of existingNotifications) {
      if (n.related_entity?.type === 'CERTIFICATION') {
        // notification_id 형식: CERT-EXP-{employee_id}-{program_code}
        existingKeys.add(n.notification_id);
      }
    }

    let createdCount = 0;

    for (const item of expiringItems) {
      const notificationId = `CERT-EXP-${item.employee.employee_id}-${item.program.program_code}`;

      // 이미 동일 알림이 존재하면 건너뜀
      if (existingKeys.has(notificationId)) continue;

      await notificationService.createNotification({
        notification_id: notificationId,
        type: 'CERTIFICATION_EXPIRY',
        priority: 'HIGH',
        title: `자격 만료 예정: ${item.program.program_name}`,
        message: `${item.employee.employee_name}님의 ${item.program.program_code} 자격이 ${item.daysUntilExpiry}일 후 만료됩니다. (만료일: ${item.expirationDate})`,
        recipient_id: item.employee.employee_id,
        recipient_type: 'EMPLOYEE',
        related_entity: {
          type: 'CERTIFICATION',
          id: `${item.employee.employee_id}-${item.program.program_code}`,
        },
        is_read: false,
      });

      createdCount++;
    }

    if (createdCount > 0) {
      logger.info(`[api] Created ${createdCount} certification expiry notifications`);
    }

    return createdCount;
  } catch (error) {
    logger.error('[api] checkAndCreateExpiryNotifications failed:', error);
    return 0;
  }
}
