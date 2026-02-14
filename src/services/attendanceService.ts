/**
 * Attendance Firebase Service
 *
 * Firestore CRUD operations for the 'attendances' collection.
 * Handles bulk attendance creation and session-based queries.
 */

import {
  db,
  doc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  writeBatch,
  Timestamp,
} from '@/services/firebase';
import type { Attendance, BulkAttendanceInput } from '@/types';

// ============================================================
// Collection Name
// ============================================================

const COLLECTION = 'attendances';

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

/** Firestore 문서를 Attendance 타입으로 변환 */
const docToAttendance = (
  docId: string,
  data: Record<string, unknown>
): Attendance => {
  return {
    attendance_id: (data.attendance_id as string) || docId,
    session_id: data.session_id as Attendance['session_id'],
    employee_id: data.employee_id as Attendance['employee_id'],
    status: data.status as Attendance['status'],
    check_in_time: data.check_in_time as string | undefined,
    check_out_time: data.check_out_time as string | undefined,
    notes: data.notes as string | undefined,
    created_at: convertTimestampToString(data.created_at as Timestamp | string | undefined),
    updated_at: convertTimestampToString(data.updated_at as Timestamp | string | undefined),
  };
};

// ============================================================
// Read Operations
// ============================================================

/**
 * 세션별 출석 목록 조회
 * session_id로 해당 세션의 모든 출석 기록을 조회합니다.
 */
export const getAttendanceBySession = async (
  sessionId: string
): Promise<Attendance[]> => {
  const q = query(
    collection(db, COLLECTION),
    where('session_id', '==', sessionId)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) =>
    docToAttendance(d.id, d.data() as Record<string, unknown>)
  );
};

// ============================================================
// Write Operations
// ============================================================

/**
 * 출석 일괄 저장 (Batch)
 * BulkAttendanceInput을 받아 attendances 컬렉션에 일괄 생성합니다.
 * Firestore batch는 500건 제한이므로 자동 분할합니다.
 */
export const saveBulkAttendance = async (
  input: BulkAttendanceInput
): Promise<Attendance[]> => {
  const BATCH_SIZE = 500;
  const now = Date.now();
  const createdAttendances: Attendance[] = [];

  for (let i = 0; i < input.attendances.length; i += BATCH_SIZE) {
    const chunk = input.attendances.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    for (let j = 0; j < chunk.length; j++) {
      const record = chunk[j];
      const index = i + j;
      const attendanceId = `ATT-${now}-${index}`;
      const docRef = doc(db, COLLECTION, attendanceId);

      const docData = {
        attendance_id: attendanceId,
        session_id: input.session_id,
        employee_id: record.employee_id,
        status: record.status,
        notes: record.notes || '',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      batch.set(docRef, docData);

      createdAttendances.push({
        attendance_id: attendanceId,
        session_id: input.session_id,
        employee_id: record.employee_id,
        status: record.status,
        notes: record.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    await batch.commit();
  }

  return createdAttendances;
};
