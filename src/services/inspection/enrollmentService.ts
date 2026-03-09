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
  limit,
} from '@/services/firebase';
import type {
  InspectionEnrollment,
  InspectionEnrollmentInput,
  InspectionEnrollmentFilters,
} from '@/types/inspection';
import { logger } from '@/utils/logger';
import { ENROLLMENTS_COLLECTION, convertTimestamp } from './constants';

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

export const createEnrollment = async (
  input: InspectionEnrollmentInput
): Promise<InspectionEnrollment> => {
  try {
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

interface AutoEnrollResult {
  enrolled: number;
  skipped: number;
  errors: number;
}

export const autoEnrollFromLogs = async (
  source: 'FIVE_PRS_RECOMMENDATION' | 'AQL_RECOMMENDATION',
  enrolledBy: string
): Promise<AutoEnrollResult> => {
  const logCollection = source === 'FIVE_PRS_RECOMMENDATION'
    ? 'five_prs_enrollment_logs'
    : 'aql_enrollment_logs';

  const result: AutoEnrollResult = { enrolled: 0, skipped: 0, errors: 0 };

  try {
    const logsQuery = query(collection(db, logCollection), limit(500));
    const logsSnapshot = await getDocs(logsQuery);

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
