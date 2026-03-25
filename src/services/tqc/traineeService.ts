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
  limit,
  Timestamp,
} from '@/services/firebase';
import type {
  NewTQCTrainee,
  NewTQCTraineeFilters,
} from '@/types';
import { logger } from '@/utils/logger';
import { COLLECTIONS, convertTimestamp } from './constants';

const docToTrainee = (docId: string, data: Record<string, unknown>): NewTQCTrainee => ({
  trainee_id: (data.trainee_id as string) || docId,
  employee_id: data.employee_id as string | undefined,
  name: (data.name as string) || '',
  team_id: (data.team_id as string) || '',
  trainer_id: (data.trainer_id as string) || '',
  start_week: (data.start_week as number) || 0,
  start_date: (data.start_date as string) || '',
  expected_end_date: data.expected_end_date as string | undefined,
  training_end_date: data.training_end_date as string | undefined,
  introducer: data.introducer as string | undefined,
  building: data.building as string | undefined,
  working_area: data.working_area as string | undefined,
  status: (data.status as NewTQCTrainee['status']) || 'IN_TRAINING',
  color_blind_status: (data.color_blind_status as NewTQCTrainee['color_blind_status']) ?? null,
  progress_percentage: (data.progress_percentage as number) || 0,
  final_test_score: data.final_test_score as number | undefined,
  final_grade: data.final_grade as string | undefined,
  final_result: data.final_result as NewTQCTrainee['final_result'] | undefined,
  certificate_issued: data.certificate_issued as boolean | undefined,
  certificate_date: data.certificate_date as string | undefined,
  meeting_1week_date: data.meeting_1week_date as string | undefined,
  meeting_1month_date: data.meeting_1month_date as string | undefined,
  meeting_3month_date: data.meeting_3month_date as string | undefined,
  notes: data.notes as string | undefined,
  created_at: convertTimestamp(data.created_at as Timestamp | string | undefined),
  updated_at: convertTimestamp(data.updated_at as Timestamp | string | undefined),
  created_by: data.created_by as string | undefined,
});

export const getTrainees = async (
  filters?: NewTQCTraineeFilters
): Promise<NewTQCTrainee[]> => {
  const constraints = [];

  if (filters?.status && filters.status !== 'all') {
    constraints.push(where('status', '==', filters.status));
  }
  if (filters?.team && filters.team !== 'all') {
    constraints.push(where('team_id', '==', filters.team));
  }

  constraints.push(limit(500));

  const q = query(collection(db, COLLECTIONS.TRAINEES), ...constraints);
  const snapshot = await getDocs(q);

  let results = snapshot.docs.map((d) =>
    docToTrainee(d.id, d.data() as Record<string, unknown>)
  );

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    results = results.filter(
      (t) =>
        t.trainee_id.toLowerCase().includes(searchLower) ||
        t.name.toLowerCase().includes(searchLower) ||
        (t.employee_id && t.employee_id.toLowerCase().includes(searchLower))
    );
  }

  if (filters?.trainer && filters.trainer !== 'all') {
    results = results.filter((t) => t.trainer_id === filters.trainer);
  }

  if (filters?.startWeek) {
    const weekNum = parseInt(filters.startWeek, 10);
    if (!isNaN(weekNum)) {
      results = results.filter((t) => t.start_week === weekNum);
    }
  }

  if (filters?.colorBlindStatus && filters.colorBlindStatus !== 'all') {
    if (filters.colorBlindStatus === 'pending') {
      results = results.filter((t) => t.color_blind_status === null);
    } else {
      results = results.filter((t) => t.color_blind_status === filters.colorBlindStatus);
    }
  }

  return results;
};

export const getTraineeById = async (
  traineeId: string
): Promise<NewTQCTrainee | null> => {
  const docRef = doc(db, COLLECTIONS.TRAINEES, traineeId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docToTrainee(docSnap.id, docSnap.data() as Record<string, unknown>);
};

export const createTrainee = async (
  data: NewTQCTrainee
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.TRAINEES, data.trainee_id);
    await setDoc(docRef, {
      ...data,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    logger.error(`[tqcService] createTrainee failed for ${data.trainee_id}:`, error);
    throw error;
  }
};

// M-6: TQC 교육생 상태 전환 유효성 맵
const VALID_TRAINEE_TRANSITIONS: Record<string, string[]> = {
  'IN_TRAINING': ['PASSED', 'FAILED', 'RESIGNED'],
  'PASSED': [],
  'FAILED': ['IN_TRAINING'],  // 재교육 가능
  'RESIGNED': [],
};

export const updateTrainee = async (
  traineeId: string,
  updates: Partial<NewTQCTrainee>
): Promise<void> => {
  try {
    // M-6: 상태 전환 검증
    if (updates.status) {
      const existing = await getTraineeById(traineeId);
      if (existing) {
        const allowed = VALID_TRAINEE_TRANSITIONS[existing.status];
        if (allowed && !allowed.includes(updates.status)) {
          throw new Error(
            `Invalid trainee status transition: ${existing.status} → ${updates.status}. Allowed: [${allowed.join(', ') || 'none'}]`
          );
        }
      }
    }

    const docRef = doc(db, COLLECTIONS.TRAINEES, traineeId);
    await updateDoc(docRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    logger.error(`[tqcService] updateTrainee failed for ${traineeId}:`, error);
    throw error;
  }
};
