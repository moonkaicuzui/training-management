/**
 * Inspection Training Firebase Service
 *
 * Firestore CRUD for 'inspection_results' and 'inspection_enrollments' collections.
 * Data integrity rule: NO DELETE on inspection_results.
 */

import {
  db,
  doc,
  collection,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  writeBatch,
  limit,
  Timestamp,
} from '@/services/firebase';
import type { Grade } from '@/types';
import type {
  InspectionResultDetail,
  InspectionResultInput,
  InspectionEnrollment,
  InspectionEnrollmentInput,
  InspectionEnrollmentFilters,
  InspectionStrikeInfo,
} from '@/types/inspection';
import { logger } from '@/utils/logger';

// ============================================================
// Collection Names
// ============================================================

const RESULTS_COLLECTION = 'inspection_results';
const ENROLLMENTS_COLLECTION = 'inspection_enrollments';
const TRAINING_RESULTS_COLLECTION = 'training_results';

// ============================================================
// Helper Functions
// ============================================================

const convertTimestamp = (
  ts: Timestamp | string | null | undefined
): string => {
  if (!ts) return '';
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  return ts;
};

const calculateGrade = (matchRate: number): Grade => {
  if (matchRate >= 100) return 'AA';
  if (matchRate >= 95) return 'A';
  if (matchRate >= 85) return 'B';
  return 'C';
};

// ============================================================
// Inspection Results
// ============================================================

/**
 * Create inspection result with batch write:
 * 1. training_results (summary for existing dashboards)
 * 2. inspection_results (detailed pair-by-pair data)
 * 3. Update enrollment status if linked
 */
export const createInspectionResult = async (
  input: InspectionResultInput,
  createdBy: string
): Promise<{ resultId: string; inspectionId: string; matchRate: number }> => {
  try {
    // Calculate match rate
    const matchedCount = input.pairs.filter((p) => p.is_match).length;
    const matchRate = Math.round((matchedCount / input.total_pairs) * 100);
    const result: 'PASS' | 'FAIL' = matchRate >= 80 ? 'PASS' : 'FAIL';
    const grade = calculateGrade(matchRate);

    // Get test_attempt by counting previous results for this employee + program
    const prevQuery = query(
      collection(db, TRAINING_RESULTS_COLLECTION),
      where('employee_id', '==', input.employee_id),
      where('program_code', '==', input.program_code),
      limit(50)
    );
    const prevSnapshot = await getDocs(prevQuery);
    const testAttempt = prevSnapshot.size + 1;

    // Generate IDs
    const resultId = `RES-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const inspectionId = `INS-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const batch = writeBatch(db);

    // 1. Write to training_results (summary)
    const resultRef = doc(db, TRAINING_RESULTS_COLLECTION, resultId);
    batch.set(resultRef, {
      result_id: resultId,
      session_id: null,
      employee_id: input.employee_id,
      program_code: input.program_code,
      training_date: input.training_date,
      score: matchRate,
      grade,
      result,
      needs_retraining: result === 'FAIL',
      evaluated_by: createdBy,
      remarks: `Inspection match: ${matchedCount}/${input.total_pairs} (${matchRate}%)`,
      test_attempt: testAttempt,
      trainer_name: input.trainer_name,
      created_at: serverTimestamp(),
      updated_at: null,
      updated_by: null,
    });

    // 2. Write to inspection_results (detailed)
    const inspectionRef = doc(db, RESULTS_COLLECTION, inspectionId);
    batch.set(inspectionRef, {
      inspection_id: inspectionId,
      result_id: resultId,
      employee_id: input.employee_id,
      program_code: input.program_code,
      training_date: input.training_date,
      inspector_id: input.inspector_id,
      inspector_name: input.inspector_name,
      trainer_name: input.trainer_name,
      carton_count: input.carton_count,
      total_pairs: input.total_pairs,
      pairs: input.pairs,
      matched_count: matchedCount,
      match_rate: matchRate,
      location: input.location,
      notes: input.notes || '',
      created_at: serverTimestamp(),
      created_by: createdBy,
    });

    // 3. Update enrollment if linked
    if (input.enrollment_id) {
      const enrollmentRef = doc(db, ENROLLMENTS_COLLECTION, input.enrollment_id);
      batch.update(enrollmentRef, {
        status: 'COMPLETED',
        completed_result_id: resultId,
      });
    }

    await batch.commit();

    return { resultId, inspectionId, matchRate };
  } catch (error) {
    logger.error('[inspectionService] createInspectionResult failed:', error);
    throw error;
  }
};

/**
 * Get inspection detail by result_id
 */
export const getInspectionDetail = async (
  resultId: string
): Promise<InspectionResultDetail | null> => {
  const q = query(
    collection(db, RESULTS_COLLECTION),
    where('result_id', '==', resultId),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const d = snapshot.docs[0];
  const data = d.data();
  return {
    inspection_id: data.inspection_id || d.id,
    result_id: data.result_id,
    employee_id: data.employee_id,
    program_code: data.program_code,
    training_date: data.training_date,
    inspector_id: data.inspector_id,
    inspector_name: data.inspector_name,
    trainer_name: data.trainer_name,
    carton_count: data.carton_count,
    total_pairs: data.total_pairs,
    pairs: data.pairs || [],
    matched_count: data.matched_count,
    match_rate: data.match_rate,
    location: data.location,
    notes: data.notes,
    created_at: convertTimestamp(data.created_at),
    created_by: data.created_by,
  } as InspectionResultDetail;
};

/**
 * Get inspection results by employee
 */
export const getResultsByEmployee = async (
  employeeId: string
): Promise<InspectionResultDetail[]> => {
  const q = query(
    collection(db, RESULTS_COLLECTION),
    where('employee_id', '==', employeeId),
    limit(100)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((d) => {
      const data = d.data();
      return {
        inspection_id: data.inspection_id || d.id,
        result_id: data.result_id,
        employee_id: data.employee_id,
        program_code: data.program_code,
        training_date: data.training_date,
        inspector_id: data.inspector_id,
        inspector_name: data.inspector_name,
        trainer_name: data.trainer_name,
        carton_count: data.carton_count,
        total_pairs: data.total_pairs,
        pairs: data.pairs || [],
        matched_count: data.matched_count,
        match_rate: data.match_rate,
        location: data.location,
        notes: data.notes,
        created_at: convertTimestamp(data.created_at),
        created_by: data.created_by,
      } as InspectionResultDetail;
    })
    .sort((a, b) => b.training_date.localeCompare(a.training_date));
};

/**
 * Get all inspection results (for dashboard)
 */
export const getAllResults = async (): Promise<InspectionResultDetail[]> => {
  const q = query(collection(db, RESULTS_COLLECTION), limit(500));
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((d) => {
      const data = d.data();
      return {
        inspection_id: data.inspection_id || d.id,
        result_id: data.result_id,
        employee_id: data.employee_id,
        program_code: data.program_code,
        training_date: data.training_date,
        inspector_id: data.inspector_id,
        inspector_name: data.inspector_name,
        trainer_name: data.trainer_name,
        carton_count: data.carton_count,
        total_pairs: data.total_pairs,
        pairs: data.pairs || [],
        matched_count: data.matched_count,
        match_rate: data.match_rate,
        location: data.location,
        notes: data.notes,
        created_at: convertTimestamp(data.created_at),
        created_by: data.created_by,
      } as InspectionResultDetail;
    })
    .sort((a, b) => b.training_date.localeCompare(a.training_date));
};

/**
 * Calculate consecutive failures for an employee
 */
export const getConsecutiveFailures = async (
  employeeId: string
): Promise<InspectionStrikeInfo> => {
  // Get training_results for INS-001, sorted by date desc
  const q = query(
    collection(db, TRAINING_RESULTS_COLLECTION),
    where('employee_id', '==', employeeId),
    where('program_code', '==', 'INS-001'),
    limit(50)
  );
  const snapshot = await getDocs(q);

  const results = snapshot.docs
    .map((d) => {
      const data = d.data();
      return {
        result_id: (data.result_id as string) || d.id,
        training_date: data.training_date as string,
        match_rate: (data.score as number) || 0,
        result: (data.result as 'PASS' | 'FAIL') || 'FAIL',
      };
    })
    .sort((a, b) => b.training_date.localeCompare(a.training_date));

  // Count consecutive failures from most recent
  let consecutiveFailures = 0;
  for (const r of results) {
    if (r.result === 'FAIL') {
      consecutiveFailures++;
    } else {
      break;
    }
  }

  return {
    employee_id: employeeId,
    consecutive_failures: consecutiveFailures,
    last_attempts: results.slice(0, 5),
    requires_reassignment: consecutiveFailures >= 3,
  };
};

// ============================================================
// Three-Strike Out Follow-up
// ============================================================

/**
 * Handle 3-strike out: when an employee has 3 consecutive FAIL results.
 * 1. Create REASSIGNMENT_REQUIRED notification
 * 2. Update related enrollment status to REASSIGNMENT_REQUIRED
 */
export const handleThreeStrikeOut = async (
  employeeId: string,
  employeeName: string,
  _resultId: string,
  enrollmentId?: string
): Promise<void> => {
  try {
    const batch = writeBatch(db);

    // 1. Create notification
    const notificationId = `NOTIF-REASSIGN-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const notifRef = doc(db, 'notifications', notificationId);
    batch.set(notifRef, {
      notification_id: notificationId,
      type: 'REASSIGNMENT_REQUIRED',
      priority: 'URGENT',
      title: `3진 아웃: ${employeeName} (${employeeId})`,
      message: `직원 ${employeeName} (${employeeId})이(가) 검사 교육(INS-001) 3회 연속 불합격으로 재배치가 필요합니다.`,
      recipient_type: 'ALL',
      related_entity: {
        type: 'EMPLOYEE',
        id: employeeId,
      },
      is_read: false,
      created_at: serverTimestamp(),
    });

    // 2. Update enrollment status if linked
    if (enrollmentId) {
      const enrollmentRef = doc(db, ENROLLMENTS_COLLECTION, enrollmentId);
      batch.update(enrollmentRef, {
        status: 'REASSIGNMENT_REQUIRED',
      });
    } else {
      // Find the most recent active enrollment for this employee
      const enrollQuery = query(
        collection(db, ENROLLMENTS_COLLECTION),
        where('employee_id', '==', employeeId),
        where('program_code', '==', 'INS-001'),
        limit(50)
      );
      const enrollSnapshot = await getDocs(enrollQuery);

      for (const d of enrollSnapshot.docs) {
        const data = d.data();
        if (data.status === 'COMPLETED' || data.status === 'PENDING' || data.status === 'SCHEDULED') {
          batch.update(d.ref, {
            status: 'REASSIGNMENT_REQUIRED',
          });
          break; // Update the most relevant one
        }
      }
    }

    await batch.commit();

    logger.info(`[inspectionService] Three-strike out handled for employee ${employeeId}`);
  } catch (error) {
    logger.error('[inspectionService] handleThreeStrikeOut failed:', error);
    // Non-blocking: log error but don't throw to avoid blocking result submission
  }
};

// ============================================================
// Enrollment Operations
// ============================================================

/**
 * Check if an active (PENDING/SCHEDULED) enrollment already exists
 * for the given employee_id + program_code combination.
 * Returns the existing enrollment if found, null otherwise.
 */
export const checkDuplicateEnrollment = async (
  employeeId: string,
  programCode: string,
): Promise<InspectionEnrollment | null> => {
  const q = query(
    collection(db, ENROLLMENTS_COLLECTION),
    where('employee_id', '==', employeeId),
    where('program_code', '==', programCode),
    limit(50),
  );
  const snapshot = await getDocs(q);

  for (const d of snapshot.docs) {
    const data = d.data();
    if (data.status === 'PENDING' || data.status === 'SCHEDULED') {
      return {
        enrollment_id: data.enrollment_id || d.id,
        employee_id: data.employee_id,
        employee_name: data.employee_name,
        program_code: data.program_code,
        source: data.source,
        source_log_id: data.source_log_id,
        enrolled_by: data.enrolled_by,
        enrolled_at: convertTimestamp(data.enrolled_at),
        status: data.status,
        scheduled_date: data.scheduled_date,
        completed_result_id: data.completed_result_id,
      } as InspectionEnrollment;
    }
  }

  return null;
};

/**
 * Create an inspection enrollment.
 * Throws if a PENDING/SCHEDULED enrollment already exists for the same employee + program.
 */
export const createEnrollment = async (
  input: InspectionEnrollmentInput
): Promise<InspectionEnrollment> => {
  try {
    // Duplicate check: prevent re-enrollment if PENDING/SCHEDULED exists
    const existing = await checkDuplicateEnrollment(input.employee_id, input.program_code);
    if (existing) {
      throw new Error(
        `Duplicate enrollment: ${input.employee_name} (${input.employee_id}) already has a ${existing.status} enrollment for ${input.program_code} (ID: ${existing.enrollment_id})`,
      );
    }

    const enrollmentId = `ENR-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const enrollment: InspectionEnrollment = {
      enrollment_id: enrollmentId,
      employee_id: input.employee_id,
      employee_name: input.employee_name,
      program_code: input.program_code,
      source: input.source,
      source_log_id: input.source_log_id,
      enrolled_by: input.enrolled_by,
      enrolled_at: new Date().toISOString(),
      status: 'PENDING',
      scheduled_date: input.scheduled_date,
    };

    const docRef = doc(db, ENROLLMENTS_COLLECTION, enrollmentId);
    await setDoc(docRef, {
      ...enrollment,
      enrolled_at: serverTimestamp(),
    });

    return enrollment;
  } catch (error) {
    logger.error('[inspectionService] createEnrollment failed:', error);
    throw error;
  }
};

/**
 * Get enrollments with optional filters
 */
export const getEnrollments = async (
  filters?: InspectionEnrollmentFilters
): Promise<InspectionEnrollment[]> => {
  const constraints = [];

  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }
  if (filters?.source) {
    constraints.push(where('source', '==', filters.source));
  }
  if (filters?.employee_id) {
    constraints.push(where('employee_id', '==', filters.employee_id));
  }

  constraints.push(limit(500));

  const q = query(collection(db, ENROLLMENTS_COLLECTION), ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((d) => {
      const data = d.data();
      return {
        enrollment_id: data.enrollment_id || d.id,
        employee_id: data.employee_id,
        employee_name: data.employee_name,
        program_code: data.program_code,
        source: data.source,
        source_log_id: data.source_log_id,
        enrolled_by: data.enrolled_by,
        enrolled_at: convertTimestamp(data.enrolled_at),
        status: data.status,
        scheduled_date: data.scheduled_date,
        completed_result_id: data.completed_result_id,
      } as InspectionEnrollment;
    })
    .sort((a, b) => b.enrolled_at.localeCompare(a.enrolled_at));
};

/**
 * Update enrollment status
 */
export const updateEnrollmentStatus = async (
  enrollmentId: string,
  status: InspectionEnrollment['status'],
  updates?: Partial<InspectionEnrollment>
): Promise<void> => {
  try {
    const docRef = doc(db, ENROLLMENTS_COLLECTION, enrollmentId);
    await updateDoc(docRef, {
      status,
      ...updates,
    });
  } catch (error) {
    logger.error('[inspectionService] updateEnrollmentStatus failed:', error);
    throw error;
  }
};

// ============================================================
// Auto-Enrollment from 5PRS / AQL
// ============================================================

interface AutoEnrollResult {
  enrolled: number;
  skipped: number;
  errors: number;
}

/**
 * Auto-enroll employees from 5PRS/AQL enrollment logs into INS-001.
 * Skips employees who already have a PENDING/SCHEDULED INS-001 enrollment.
 */
export const autoEnrollFromLogs = async (
  source: 'FIVE_PRS_RECOMMENDATION' | 'AQL_RECOMMENDATION',
  enrolledBy: string
): Promise<AutoEnrollResult> => {
  const logCollection = source === 'FIVE_PRS_RECOMMENDATION'
    ? 'five_prs_enrollment_logs'
    : 'aql_enrollment_logs';

  const result: AutoEnrollResult = { enrolled: 0, skipped: 0, errors: 0 };

  try {
    // 1. Get recent enrollment logs (last 500)
    const logsQuery = query(collection(db, logCollection), limit(500));
    const logsSnapshot = await getDocs(logsQuery);

    // Extract unique employee IDs with names
    const employeeMap = new Map<string, { name: string; logId: string }>();
    for (const d of logsSnapshot.docs) {
      const data = d.data();
      const empId = data.employee_id as string;
      if (empId && !employeeMap.has(empId)) {
        employeeMap.set(empId, {
          name: (data.employee_name as string) || empId,
          logId: (data.log_id as string) || d.id,
        });
      }
    }

    if (employeeMap.size === 0) return result;

    // 2. Get existing INS-001 enrollments (PENDING/SCHEDULED)
    const existingQuery = query(
      collection(db, ENROLLMENTS_COLLECTION),
      where('program_code', '==', 'INS-001'),
      limit(500)
    );
    const existingSnapshot = await getDocs(existingQuery);
    const existingEmployeeIds = new Set<string>();
    for (const d of existingSnapshot.docs) {
      const data = d.data();
      if (data.status === 'PENDING' || data.status === 'SCHEDULED') {
        existingEmployeeIds.add(data.employee_id as string);
      }
    }

    // 3. Create enrollments for new employees
    for (const [empId, info] of employeeMap) {
      if (existingEmployeeIds.has(empId)) {
        result.skipped++;
        continue;
      }

      try {
        await createEnrollment({
          employee_id: empId,
          employee_name: info.name,
          program_code: 'INS-001',
          source,
          source_log_id: info.logId,
          enrolled_by: enrolledBy,
        });
        result.enrolled++;
      } catch {
        result.errors++;
      }
    }

    return result;
  } catch (error) {
    logger.error('[inspectionService] autoEnrollFromLogs failed:', error);
    throw error;
  }
};
