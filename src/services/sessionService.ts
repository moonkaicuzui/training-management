/**
 * Training Session Firebase Service
 *
 * Firestore CRUD operations for the 'training_sessions' collection.
 * Manages training session lifecycle: create, read, update, cancel.
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
  Timestamp,
} from '@/services/firebase';
import type { TrainingSession, SessionFilters } from '@/types';
import { logger } from '@/utils/logger';

// ============================================================
// Collection Name
// ============================================================

const COLLECTION = 'training_sessions';

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

/** Firestore 문서를 TrainingSession 타입으로 변환 */
const docToSession = (docId: string, data: Record<string, unknown>): TrainingSession => {
  return {
    session_id: (data.session_id as string) || docId,
    program_code: (data.program_code as string) || '',
    session_date: (data.session_date as string) || '',
    session_time: (data.session_time as string) || '',
    trainer_name: (data.trainer_name as string) || '',
    trainer: (data.trainer as string) || '',
    location: (data.location as string) || '',
    max_attendees: (data.max_attendees as number) || 0,
    status: (data.status as TrainingSession['status']) || 'PLANNED',
    training_level: data.training_level as TrainingSession['training_level'],
    training_type: data.training_type as TrainingSession['training_type'],
    notes: (data.notes as string) || '',
    created_by: (data.created_by as string) || '',
    created_at: convertTimestampToString(data.created_at as Timestamp | string | undefined),
    attendees: (data.attendees as string[]) || [],
  };
};

// ============================================================
// Read Operations
// ============================================================

/**
 * 교육 세션 목록 조회 (필터 지원)
 * Firestore where() 쿼리로 서버 사이드 필터링,
 * 날짜 범위는 클라이언트 사이드 필터링
 */
export const getSessions = async (
  filters?: SessionFilters
): Promise<TrainingSession[]> => {
  const constraints = [];

  // Firestore where() conditions
  if (filters?.programCode) {
    constraints.push(where('program_code', '==', filters.programCode));
  }
  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }

  const q = query(collection(db, COLLECTION), ...constraints);
  const snapshot = await getDocs(q);

  let results = snapshot.docs.map((d) =>
    docToSession(d.id, d.data() as Record<string, unknown>)
  );

  // Client-side filters (date range - can't combine with other where clauses)
  if (filters?.startDate) {
    results = results.filter((s) => s.session_date >= filters.startDate!);
  }
  if (filters?.endDate) {
    results = results.filter((s) => s.session_date <= filters.endDate!);
  }

  // Sort by session_date descending (client-side)
  results.sort((a, b) => b.session_date.localeCompare(a.session_date));

  return results;
};

/**
 * 단일 교육 세션 조회
 */
export const getSession = async (
  id: string
): Promise<TrainingSession | null> => {
  const docRef = doc(db, COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docToSession(docSnap.id, docSnap.data() as Record<string, unknown>);
};

// ============================================================
// Write Operations
// ============================================================

/**
 * 교육 세션 생성
 * Document ID = session_id (자동 생성: SES-{timestamp})
 */
export const createSession = async (
  data: Omit<TrainingSession, 'session_id' | 'created_at'>
): Promise<TrainingSession> => {
  try {
    const sessionId = `SES-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const docRef = doc(db, COLLECTION, sessionId);
    const now = serverTimestamp();

    await setDoc(docRef, {
      ...data,
      session_id: sessionId,
      created_at: now,
    });

    return {
      ...data,
      session_id: sessionId,
      created_at: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('[sessionService] createSession failed:', error);
    throw error;
  }
};

/**
 * 교육 세션 수정
 */
export const updateSession = async (
  id: string,
  updates: Partial<TrainingSession>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
    });
  } catch (error) {
    logger.error(`[sessionService] updateSession failed for ${id}:`, error);
    throw error;
  }
};

/**
 * 교육 세션 취소
 */
export const cancelSession = async (
  id: string
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      status: 'CANCELLED',
    });
  } catch (error) {
    logger.error(`[sessionService] cancelSession failed for ${id}:`, error);
    throw error;
  }
};
