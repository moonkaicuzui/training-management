/**
 * Training Result Firebase Service
 *
 * Firestore CRUD operations for the 'training_results' collection.
 * Data integrity rule: NO DELETE - only create/update with edit logs.
 */

import {
  db,
  doc,
  collection,
  getDoc,
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
import type { TrainingResultRecord, ResultFilters } from '@/types';
import { logger } from '@/utils/logger';

// ============================================================
// Collection Name
// ============================================================

const COLLECTION = 'training_results';

// ============================================================
// Helper Functions
// ============================================================

/** Timestamp를 ISO string으로 변환 (nullable 지원) */
const convertTimestampToString = (
  timestamp: Timestamp | string | null | undefined
): string | null => {
  if (timestamp === null || timestamp === undefined) return null;
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

/** Firestore 문서를 TrainingResultRecord 타입으로 변환 */
const docToResult = (
  docId: string,
  data: Record<string, unknown>
): TrainingResultRecord => {
  return {
    result_id: (data.result_id as string) || docId,
    session_id: (data.session_id as string | null) ?? null,
    employee_id: (data.employee_id as string) || '',
    program_code: (data.program_code as string) || '',
    training_date: (data.training_date as string) || '',
    score: (data.score as number | null) ?? null,
    grade: (data.grade as TrainingResultRecord['grade']) ?? null,
    result: (data.result as TrainingResultRecord['result']) || 'ABSENT',
    needs_retraining: (data.needs_retraining as boolean) || false,
    evaluated_by: (data.evaluated_by as string) || '',
    remarks: (data.remarks as string) || '',
    test_attempt: data.test_attempt as number | undefined,
    trainer_name: data.trainer_name as string | undefined,
    stop_working_date: data.stop_working_date as string | undefined,
    created_at:
      convertTimestampToString(
        data.created_at as Timestamp | string | null | undefined
      ) || '',
    updated_at: convertTimestampToString(
      data.updated_at as Timestamp | string | null | undefined
    ),
    updated_by: (data.updated_by as string | null) ?? null,
  };
};

// ============================================================
// Read Operations
// ============================================================

/**
 * 교육 결과 목록 조회 (필터 지원)
 * Firestore where() 쿼리로 서버 사이드 필터링,
 * startDate/endDate/grade는 클라이언트 사이드 필터링
 */
export const getResults = async (
  filters?: ResultFilters
): Promise<TrainingResultRecord[]> => {
  const constraints = [];

  // Firestore where() conditions
  if (filters?.employeeId) {
    constraints.push(where('employee_id', '==', filters.employeeId));
  }
  if (filters?.programCode) {
    constraints.push(where('program_code', '==', filters.programCode));
  }
  if (filters?.result) {
    constraints.push(where('result', '==', filters.result));
  }

  // 필터가 있을 때만 limit 적용, 전체 조회 시에는 limit 없이 (KPI 정확성 보장)
  if (filters?.employeeId || filters?.programCode || filters?.result) {
    constraints.push(limit(2000));
  }

  const q = query(collection(db, COLLECTION), ...constraints);
  const snapshot = await getDocs(q);

  let results = snapshot.docs.map((d) =>
    docToResult(d.id, d.data() as Record<string, unknown>)
  );

  // Client-side filters
  if (filters?.startDate) {
    results = results.filter((r) => r.training_date >= filters.startDate!);
  }
  if (filters?.endDate) {
    results = results.filter((r) => r.training_date <= filters.endDate!);
  }
  if (filters?.grade) {
    results = results.filter((r) => r.grade === filters.grade);
  }

  // Sort by training_date descending (client-side)
  results.sort((a, b) => b.training_date.localeCompare(a.training_date));

  return results;
};

/**
 * 단일 교육 결과 조회
 */
export const getResult = async (
  id: string
): Promise<TrainingResultRecord | null> => {
  const docRef = doc(db, COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docToResult(docSnap.id, docSnap.data() as Record<string, unknown>);
};

/**
 * 특정 직원의 교육 결과 목록 조회
 * training_date 기준 내림차순 정렬
 */
export const getResultsByEmployee = async (
  employeeId: string
): Promise<TrainingResultRecord[]> => {
  const q = query(
    collection(db, COLLECTION),
    where('employee_id', '==', employeeId),
    limit(200)
  );
  const snapshot = await getDocs(q);

  const results = snapshot.docs.map((d) =>
    docToResult(d.id, d.data() as Record<string, unknown>)
  );

  // Sort by training_date descending (client-side)
  results.sort((a, b) => b.training_date.localeCompare(a.training_date));

  return results;
};

// ============================================================
// Write Operations
// ============================================================

/**
 * 교육 결과 생성 (단건)
 * Document ID = result_id (자동 생성)
 */
export const createResult = async (
  data: Omit<
    TrainingResultRecord,
    'result_id' | 'created_at' | 'updated_at' | 'updated_by'
  >
): Promise<TrainingResultRecord> => {
  try {
    // M-9: training_date 형식 검증 (YYYY-MM-DD)
    if (data.training_date && !/^\d{4}-\d{2}-\d{2}/.test(data.training_date)) {
      // 비-ISO 형식이면 정규화 시도
      const parsed = new Date(data.training_date);
      if (isNaN(parsed.getTime())) {
        throw new Error(`Invalid training_date format: ${data.training_date}. Expected YYYY-MM-DD.`);
      }
      data = { ...data, training_date: parsed.toISOString().split('T')[0] };
    }

    const resultId = `RES-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const docRef = doc(db, COLLECTION, resultId);

    await setDoc(docRef, {
      ...data,
      result_id: resultId,
      created_at: serverTimestamp(),
      updated_at: null,
      updated_by: null,
    });

    return {
      ...data,
      result_id: resultId,
      created_at: new Date().toISOString(),  // 반환 객체용 (Firestore에는 serverTimestamp 저장됨)
      updated_at: null,
      updated_by: null,
    };
  } catch (error) {
    logger.error(`[resultService] createResult failed for ${data.employee_id}/${data.program_code}:`, error);
    throw error;
  }
};

/**
 * 교육 결과 일괄 생성
 * Firestore batch는 500건 제한이므로 자동 분할
 */
export const batchCreateResults = async (
  results: Array<
    Omit<
      TrainingResultRecord,
      'result_id' | 'created_at' | 'updated_at' | 'updated_by'
    >
  >
): Promise<TrainingResultRecord[]> => {
  try {
    const BATCH_SIZE = 500;
    const createdResults: TrainingResultRecord[] = [];

    for (let i = 0; i < results.length; i += BATCH_SIZE) {
      const chunk = results.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);

      for (const item of chunk) {
        const resultId = `RES-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const docRef = doc(db, COLLECTION, resultId);

        batch.set(docRef, {
          ...item,
          result_id: resultId,
          created_at: serverTimestamp(),
          updated_at: null,
          updated_by: null,
        });

        createdResults.push({
          ...item,
          result_id: resultId,
          created_at: new Date().toISOString(),  // 반환 객체용 (Firestore에는 serverTimestamp 저장됨)
          updated_at: null,
          updated_by: null,
        });
      }

      await batch.commit();
    }

    return createdResults;
  } catch (error) {
    logger.error(`[resultService] batchCreateResults failed for ${results.length} items:`, error);
    throw error;
  }
};

/**
 * 교육 결과 수정
 * updated_at은 자동으로 serverTimestamp() 설정
 */
export const updateResult = async (
  id: string,
  updates: Partial<TrainingResultRecord>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    logger.error(`[resultService] updateResult failed for ${id}:`, error);
    throw error;
  }
};
