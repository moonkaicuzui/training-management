/**
 * Log Firebase Service
 *
 * Firestore CRUD operations for the 'program_change_logs' and 'result_edit_logs' collections.
 * Tracks all changes to training programs and result edits for audit compliance.
 */

import {
  db,
  doc,
  collection,
  setDoc,
  query,
  where,
  getDocs,
  Timestamp,
  serverTimestamp,
} from '@/services/firebase';
import type {
  ProgramChangeLog,
  ResultEditLog,
  ChangeAction,
  TrainingProgram,
  TrainingResultRecord,
} from '@/types';

// ============================================================
// Collection Names
// ============================================================

const PROGRAM_CHANGE_LOGS_COLLECTION = 'program_change_logs';
const RESULT_EDIT_LOGS_COLLECTION = 'result_edit_logs';

// ============================================================
// Helper Functions
// ============================================================

/** Timestamp를 ISO string으로 변환 */
const convertTimestampToString = (
  timestamp: Timestamp | string | undefined
): string => {
  if (!timestamp) return '';
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

/** Firestore 문서를 ProgramChangeLog 타입으로 변환 */
const docToProgramChangeLog = (
  docId: string,
  data: Record<string, unknown>
): ProgramChangeLog => {
  return {
    log_id: (data.log_id as string) || docId,
    program_code: (data.program_code as string) || '',
    action: (data.action as ChangeAction) || 'UPDATE',
    changed_by: (data.changed_by as string) || '',
    before_data: (data.before_data as string) || null,
    after_data: (data.after_data as string) || null,
    changed_at: convertTimestampToString(
      data.changed_at as Timestamp | string | undefined
    ),
  };
};

/** Firestore 문서를 ResultEditLog 타입으로 변환 */
const docToResultEditLog = (
  docId: string,
  data: Record<string, unknown>
): ResultEditLog => {
  return {
    log_id: (data.log_id as string) || docId,
    result_id: (data.result_id as string) || '',
    before_data: (data.before_data as string) || '',
    after_data: (data.after_data as string) || '',
    edit_reason: (data.edit_reason as string) || '',
    edited_by: (data.edited_by as string) || '',
    edited_at: convertTimestampToString(
      data.edited_at as Timestamp | string | undefined
    ),
  };
};

// ============================================================
// Program Change Log Operations
// ============================================================

/**
 * 프로그램 변경 로그 조회
 * programCode가 제공되면 해당 프로그램의 로그만 조회
 * changed_at 기준 내림차순 정렬 (client-side)
 */
export const getProgramChangeLogs = async (
  programCode?: string
): Promise<ProgramChangeLog[]> => {
  const constraints = [];

  if (programCode) {
    constraints.push(where('program_code', '==', programCode));
  }

  const q = query(
    collection(db, PROGRAM_CHANGE_LOGS_COLLECTION),
    ...constraints
  );
  const snapshot = await getDocs(q);

  const results = snapshot.docs.map((d) =>
    docToProgramChangeLog(d.id, d.data() as Record<string, unknown>)
  );

  // Client-side sort by changed_at descending
  results.sort((a, b) => {
    return new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime();
  });

  return results;
};

/**
 * 프로그램 변경 로그 기록
 * 프로그램 생성/수정/삭제 시 호출
 */
export const logProgramChange = async (
  programCode: string,
  action: ChangeAction,
  beforeData: Partial<TrainingProgram> | null,
  afterData: Partial<TrainingProgram> | null,
  changedBy: string = 'system@hsvina.com'
): Promise<ProgramChangeLog> => {
  const logId = `PCL-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
  const changedAt = new Date().toISOString();

  const firestoreData = {
    log_id: logId,
    program_code: programCode,
    action,
    changed_by: changedBy,
    before_data: beforeData ? JSON.stringify(beforeData) : null,
    after_data: afterData ? JSON.stringify(afterData) : null,
    changed_at: serverTimestamp(),
  };

  const docRef = doc(db, PROGRAM_CHANGE_LOGS_COLLECTION, logId);
  await setDoc(docRef, firestoreData);

  const logData: ProgramChangeLog = {
    log_id: logId,
    program_code: programCode,
    action,
    changed_by: changedBy,
    before_data: beforeData ? JSON.stringify(beforeData) : null,
    after_data: afterData ? JSON.stringify(afterData) : null,
    changed_at: changedAt,
  };

  return logData;
};

// ============================================================
// Result Edit Log Operations
// ============================================================

/**
 * 결과 수정 로그 조회
 * resultId가 제공되면 해당 결과의 로그만 조회
 * edited_at 기준 내림차순 정렬 (client-side)
 */
export const getResultEditLogs = async (
  resultId?: string
): Promise<ResultEditLog[]> => {
  const constraints = [];

  if (resultId) {
    constraints.push(where('result_id', '==', resultId));
  }

  const q = query(
    collection(db, RESULT_EDIT_LOGS_COLLECTION),
    ...constraints
  );
  const snapshot = await getDocs(q);

  const results = snapshot.docs.map((d) =>
    docToResultEditLog(d.id, d.data() as Record<string, unknown>)
  );

  // Client-side sort by edited_at descending
  results.sort((a, b) => {
    return new Date(b.edited_at).getTime() - new Date(a.edited_at).getTime();
  });

  return results;
};

/**
 * 결과 수정 로그 기록
 * 교육 결과 수정 시 호출
 */
export const logResultEdit = async (
  resultId: string,
  beforeData: Partial<TrainingResultRecord>,
  afterData: Partial<TrainingResultRecord>,
  editReason: string,
  editedBy: string = 'system@hsvina.com'
): Promise<ResultEditLog> => {
  const logId = `REL-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
  const editedAt = new Date().toISOString();

  const firestoreData = {
    log_id: logId,
    result_id: resultId,
    before_data: JSON.stringify(beforeData),
    after_data: JSON.stringify(afterData),
    edit_reason: editReason,
    edited_by: editedBy,
    edited_at: serverTimestamp(),
  };

  const docRef = doc(db, RESULT_EDIT_LOGS_COLLECTION, logId);
  await setDoc(docRef, firestoreData);

  const logData: ResultEditLog = {
    log_id: logId,
    result_id: resultId,
    before_data: JSON.stringify(beforeData),
    after_data: JSON.stringify(afterData),
    edit_reason: editReason,
    edited_by: editedBy,
    edited_at: editedAt,
  };

  return logData;
};
