/**
 * Training Program Firebase Service
 *
 * Firestore CRUD operations for the 'training_programs' collection.
 * Document ID: program_code (e.g., 'QIP-001')
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
  orderBy,
  serverTimestamp,
  Timestamp,
} from '@/services/firebase';
import type { TrainingProgram, ProgramFilters } from '@/types';
import { logger } from '@/utils/logger';

// ============================================================
// Collection Name
// ============================================================

const COLLECTION = 'training_programs';

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

/** Firestore 문서를 TrainingProgram 타입으로 변환 */
const docToProgram = (docId: string, data: Record<string, unknown>): TrainingProgram => {
  return {
    program_code: (data.program_code as string) || docId,
    program_name: (data.program_name as string) || '',
    program_name_vn: (data.program_name_vn as string) || '',
    program_name_kr: (data.program_name_kr as string) || '',
    category: data.category as TrainingProgram['category'],
    tags: (data.tags as string[]) || [],
    target_positions: (data.target_positions as TrainingProgram['target_positions']) || [],
    evaluation_type: (data.evaluation_type as TrainingProgram['evaluation_type']) || 'SCORE',
    passing_score: (data.passing_score as number) || 0,
    grade_aa: (data.grade_aa as number) || 0,
    grade_a: (data.grade_a as number) || 0,
    grade_b: (data.grade_b as number) || 0,
    duration_hours: (data.duration_hours as number) || 0,
    validity_months: (data.validity_months as number | null) ?? null,
    training_level: data.training_level as TrainingProgram['training_level'],
    training_type: data.training_type as TrainingProgram['training_type'],
    is_active: (data.is_active as boolean) ?? true,
    created_at: convertTimestampToString(data.created_at as Timestamp | string | undefined),
    updated_at: convertTimestampToString(data.updated_at as Timestamp | string | undefined),
  };
};

// ============================================================
// Read Operations
// ============================================================

/**
 * 교육 프로그램 목록 조회 (필터 지원)
 * Firestore where() 쿼리로 서버 사이드 필터링,
 * search와 tags는 클라이언트 사이드 필터링
 */
export const getPrograms = async (
  filters?: ProgramFilters
): Promise<TrainingProgram[]> => {
  const constraints = [];

  // Firestore where() conditions
  if (filters?.category) {
    constraints.push(where('category', '==', filters.category));
  }
  if (!filters?.showInactive) {
    constraints.push(where('is_active', '==', true));
  }

  constraints.push(orderBy('program_code', 'asc'));

  const q = query(collection(db, COLLECTION), ...constraints);
  const snapshot = await getDocs(q);

  let results = snapshot.docs.map((d) =>
    docToProgram(d.id, d.data() as Record<string, unknown>)
  );

  // Client-side filters (not supported by Firestore compound queries)
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    results = results.filter(
      (p) =>
        p.program_code.toLowerCase().includes(searchLower) ||
        p.program_name.toLowerCase().includes(searchLower) ||
        p.program_name_vn.toLowerCase().includes(searchLower) ||
        p.program_name_kr.toLowerCase().includes(searchLower)
    );
  }
  if (filters?.tags && filters.tags.length > 0) {
    results = results.filter((p) =>
      filters.tags!.some((tag) => p.tags.includes(tag))
    );
  }

  return results;
};

/**
 * 단일 교육 프로그램 조회
 */
export const getProgram = async (
  code: string
): Promise<TrainingProgram | null> => {
  const docRef = doc(db, COLLECTION, code);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docToProgram(docSnap.id, docSnap.data() as Record<string, unknown>);
};

// ============================================================
// Write Operations
// ============================================================

/**
 * 교육 프로그램 생성
 * Document ID = program_code
 */
export const createProgram = async (
  data: Omit<TrainingProgram, 'created_at' | 'updated_at'>
): Promise<TrainingProgram> => {
  try {
    const docRef = doc(db, COLLECTION, data.program_code);
    const now = serverTimestamp();

    await setDoc(docRef, {
      ...data,
      created_at: now,
      updated_at: now,
    });

    return {
      ...data,
      created_at: new Date().toISOString(),  // 반환 객체용 (Firestore에는 serverTimestamp 저장됨)
      updated_at: new Date().toISOString(),  // 반환 객체용 (Firestore에는 serverTimestamp 저장됨)
    };
  } catch (error) {
    logger.error(`[programService] createProgram failed for ${data.program_code}:`, error);
    throw error;
  }
};

/**
 * 교육 프로그램 수정
 */
export const updateProgram = async (
  code: string,
  updates: Partial<TrainingProgram>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION, code);
    await updateDoc(docRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    logger.error(`[programService] updateProgram failed for ${code}:`, error);
    throw error;
  }
};

/**
 * 교육 프로그램 삭제 (Soft Delete)
 * is_active를 false로 설정
 */
export const deleteProgram = async (
  code: string
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION, code);
    await updateDoc(docRef, {
      is_active: false,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    logger.error(`[programService] deleteProgram failed for ${code}:`, error);
    throw error;
  }
};
