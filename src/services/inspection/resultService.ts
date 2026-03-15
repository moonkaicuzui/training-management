import {
  db,
  doc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  writeBatch,
  limit,
} from '@/services/firebase';
import type {
  InspectionResultDetail,
  InspectionResultInput,
} from '@/types/inspection';
import { logger } from '@/utils/logger';
import { calculateInspectionGrade } from '@/utils/gradeCalculator';
import {
  RESULTS_COLLECTION,
  ENROLLMENTS_COLLECTION,
  TRAINING_RESULTS_COLLECTION,
  convertTimestamp,
} from './constants';

const mapDocToDetail = (d: { id: string; data: () => Record<string, unknown> }): InspectionResultDetail => {
  const data = d.data();
  return {
    inspection_id: (data.inspection_id as string) || d.id,
    result_id: data.result_id,
    employee_id: data.employee_id,
    program_code: data.program_code,
    training_date: data.training_date,
    inspector_id: data.inspector_id,
    inspector_name: data.inspector_name,
    trainer_name: data.trainer_name,
    carton_count: data.carton_count,
    total_pairs: data.total_pairs,
    pairs: (data.pairs as unknown[]) || [],
    matched_count: data.matched_count,
    match_rate: data.match_rate,
    location: data.location,
    notes: data.notes,
    created_at: convertTimestamp(data.created_at as import('@/services/firebase').Timestamp | string | null | undefined),
    created_by: data.created_by,
  } as InspectionResultDetail;
};

export const createInspectionResult = async (
  input: InspectionResultInput,
  createdBy: string
): Promise<{ resultId: string; inspectionId: string; matchRate: number }> => {
  try {
    const matchedCount = input.pairs.filter((p) => p.is_match).length;
    const matchRate = input.total_pairs > 0 ? Math.round((matchedCount / input.total_pairs) * 100) : 0;
    const result: 'PASS' | 'FAIL' = matchRate >= 80 ? 'PASS' : 'FAIL';
    const grade = calculateInspectionGrade(matchRate);

    const prevQuery = query(
      collection(db, TRAINING_RESULTS_COLLECTION),
      where('employee_id', '==', input.employee_id),
      where('program_code', '==', input.program_code),
      limit(50)
    );
    const prevSnapshot = await getDocs(prevQuery);
    const testAttempt = prevSnapshot.size + 1;

    const resultId = `RES-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const inspectionId = `INS-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const batch = writeBatch(db);

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

  return mapDocToDetail(snapshot.docs[0]);
};

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
    .map(mapDocToDetail)
    .sort((a, b) => b.training_date.localeCompare(a.training_date));
};

export const getAllResults = async (): Promise<InspectionResultDetail[]> => {
  const q = query(collection(db, RESULTS_COLLECTION), limit(500));
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map(mapDocToDetail)
    .sort((a, b) => b.training_date.localeCompare(a.training_date));
};
