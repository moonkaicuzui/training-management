// ============================================================
// Q-TRAIN Quality API
// Inspection Training, Metal Detector
// ============================================================

import * as inspectionService from '../inspectionService';
import * as mdInspectionService from '../mdInspectionService';

import type {
  InspectionResultDetail,
  InspectionResultInput,
  InspectionEnrollment,
  InspectionEnrollmentInput,
  InspectionEnrollmentFilters,
  InspectionStrikeInfo,
} from '@/types/inspection';

import type {
  MDInspection,
  MDFailure,
  MDFilters,
  MDDashboardKPI,
  MDWeeklyTrend,
  MDWeeklyComparison,
  MDRepeatedIssueSummary,
  MDEmailRecipient,
} from '@/types/metalDetector';

import {
  invalidateResultCache,
  invalidateDashboardCache,
} from './common';

// ========== Inspection Training API ==========

export async function getInspectionResults(): Promise<InspectionResultDetail[]> {
  return inspectionService.getAllResults();
}

export async function getInspectionResultsByEmployee(
  employeeId: string
): Promise<InspectionResultDetail[]> {
  return inspectionService.getResultsByEmployee(employeeId);
}

export async function getInspectionDetail(
  resultId: string
): Promise<InspectionResultDetail | null> {
  return inspectionService.getInspectionDetail(resultId);
}

export async function createInspectionResult(
  input: InspectionResultInput,
  createdBy: string
): Promise<{ resultId: string; inspectionId: string; matchRate: number }> {
  const result = await inspectionService.createInspectionResult(input, createdBy);
  invalidateResultCache();
  invalidateDashboardCache();

  // 3-strike out check: if FAIL, check consecutive failures
  if (result.matchRate < 80) {
    try {
      const strikeInfo = await inspectionService.getConsecutiveFailures(input.employee_id);
      if (strikeInfo.requires_reassignment) {
        // Get employee name from enrollment or use employee_id as fallback
        let employeeName = input.employee_id;
        if (input.enrollment_id) {
          const enrollments = await inspectionService.getEnrollments({ employee_id: input.employee_id });
          const enrollment = enrollments.find((e) => e.enrollment_id === input.enrollment_id);
          if (enrollment) employeeName = enrollment.employee_name;
        }

        await inspectionService.handleThreeStrikeOut(
          input.employee_id,
          employeeName,
          result.resultId,
          input.enrollment_id
        );
      }
    } catch {
      // Non-blocking: 3-strike handling should not prevent result submission
    }
  }

  return result;
}

export async function getInspectionEnrollments(
  filters?: InspectionEnrollmentFilters
): Promise<InspectionEnrollment[]> {
  return inspectionService.getEnrollments(filters);
}

export async function createInspectionEnrollment(
  input: InspectionEnrollmentInput
): Promise<InspectionEnrollment> {
  return inspectionService.createEnrollment(input);
}

export async function checkDuplicateInspectionEnrollment(
  employeeId: string,
  programCode: string,
): Promise<InspectionEnrollment | null> {
  return inspectionService.checkDuplicateEnrollment(employeeId, programCode);
}

export async function updateInspectionEnrollmentStatus(
  enrollmentId: string,
  status: InspectionEnrollment['status']
): Promise<void> {
  return inspectionService.updateEnrollmentStatus(enrollmentId, status);
}

export async function getInspectionConsecutiveFailures(
  employeeId: string
): Promise<InspectionStrikeInfo> {
  return inspectionService.getConsecutiveFailures(employeeId);
}

export async function autoEnrollInspectionFromLogs(
  source: 'FIVE_PRS_RECOMMENDATION' | 'AQL_RECOMMENDATION',
  enrolledBy: string
) {
  return inspectionService.autoEnrollFromLogs(source, enrolledBy);
}

// ========== Metal Detector Inspection ==========

export const mdInspection = {
  getInspections: (filters?: MDFilters) => mdInspectionService.getInspections(filters),
  getInspectionById: (id: string) => mdInspectionService.getInspectionById(id),
  createInspection: (data: Omit<MDInspection, 'id' | 'weekNumber' | 'year' | 'createdAt' | 'updatedAt'>) =>
    mdInspectionService.createInspection(data),
  updateInspection: (id: string, data: Partial<Omit<MDInspection, 'id' | 'createdAt'>>) =>
    mdInspectionService.updateInspection(id, data),
  getFailures: (inspectionId?: string) => mdInspectionService.getFailures(inspectionId),
  createFailure: (data: Omit<MDFailure, 'id' | 'createdAt' | 'updatedAt'>) =>
    mdInspectionService.createFailure(data),
  updateFailure: (id: string, data: Partial<Omit<MDFailure, 'id' | 'createdAt'>>) =>
    mdInspectionService.updateFailure(id, data),
  getDashboardKPIs: (year: number, weekNumber?: number): Promise<MDDashboardKPI> =>
    mdInspectionService.getDashboardKPIs(year, weekNumber),
  getWeeklyTrend: (year: number, weekCount?: number): Promise<MDWeeklyTrend[]> =>
    mdInspectionService.getWeeklyTrend(year, weekCount),
  getWeeklyComparison: (year: number, weekNumber: number): Promise<MDWeeklyComparison> =>
    mdInspectionService.getWeeklyComparison(year, weekNumber),
  getRepeatedIssues: (year: number, weekNumber: number): Promise<MDRepeatedIssueSummary> =>
    mdInspectionService.getRepeatedIssues(year, weekNumber),
  getEmailRecipients: (): Promise<MDEmailRecipient[]> =>
    mdInspectionService.getEmailRecipients(),
  addEmailRecipient: (data: Omit<MDEmailRecipient, 'id' | 'createdAt' | 'updatedAt'>): Promise<MDEmailRecipient> =>
    mdInspectionService.addEmailRecipient(data),
  updateEmailRecipient: (id: string, data: Partial<Omit<MDEmailRecipient, 'id' | 'createdAt'>>): Promise<void> =>
    mdInspectionService.updateEmailRecipient(id, data),
  removeEmailRecipient: (id: string): Promise<void> =>
    mdInspectionService.removeEmailRecipient(id),
  getRecipientsForNotification: (type: 'weeklyReport' | 'failAlert' | 'caOverdue'): Promise<MDEmailRecipient[]> =>
    mdInspectionService.getRecipientsForNotification(type),
};
