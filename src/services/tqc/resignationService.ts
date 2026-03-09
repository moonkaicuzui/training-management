import {
  db,
  doc,
  collection,
  setDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  limit,
  Timestamp,
} from '@/services/firebase';
import type {
  NewTQCResignation,
  NewTQCResignationFilters,
} from '@/types';
import { logger } from '@/utils/logger';
import { COLLECTIONS, convertTimestamp } from './constants';

const docToResignation = (docId: string, data: Record<string, unknown>): NewTQCResignation => ({
  resignation_id: (data.resignation_id as string) || docId,
  trainee_id: (data.trainee_id as string) || '',
  resign_date: (data.resign_date as string) || '',
  reason_category: (data.reason_category as NewTQCResignation['reason_category']) || 'OTHER',
  reason_detail: data.reason_detail as string | undefined,
  training_duration_days: (data.training_duration_days as number) || 0,
  last_completed_stage: data.last_completed_stage as string | undefined,
  created_at: convertTimestamp(data.created_at as Timestamp | string | undefined),
  created_by: data.created_by as string | undefined,
});

export const getResignations = async (
  filters?: NewTQCResignationFilters
): Promise<NewTQCResignation[]> => {
  const constraints = [];

  if (filters?.reasonCategory && filters.reasonCategory !== 'all') {
    constraints.push(where('reason_category', '==', filters.reasonCategory));
  }

  constraints.push(limit(500));

  const q = query(collection(db, COLLECTIONS.RESIGNATIONS), ...constraints);
  const snapshot = await getDocs(q);

  let results = snapshot.docs.map((d) =>
    docToResignation(d.id, d.data() as Record<string, unknown>)
  );

  if (filters?.dateFrom) {
    results = results.filter((r) => r.resign_date >= filters.dateFrom!);
  }

  if (filters?.dateTo) {
    results = results.filter((r) => r.resign_date <= filters.dateTo!);
  }

  return results;
};

export const createResignation = async (
  data: NewTQCResignation
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.RESIGNATIONS, data.resignation_id);
    await setDoc(docRef, {
      ...data,
      created_at: serverTimestamp(),
    });
  } catch (error) {
    logger.error(`[tqcService] createResignation failed for ${data.resignation_id}:`, error);
    throw error;
  }
};
