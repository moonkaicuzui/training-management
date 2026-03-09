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
import type { NewTQCColorBlindTest } from '@/types';
import { logger } from '@/utils/logger';
import { COLLECTIONS, convertTimestamp } from './constants';

const docToColorBlindTest = (docId: string, data: Record<string, unknown>): NewTQCColorBlindTest => ({
  test_id: (data.test_id as string) || docId,
  trainee_id: (data.trainee_id as string) || '',
  test_date: (data.test_date as string) || '',
  result: (data.result as NewTQCColorBlindTest['result']) || 'PASS',
  notes: data.notes as string | undefined,
  tested_by: (data.tested_by as string) || '',
  created_at: convertTimestamp(data.created_at as Timestamp | string | undefined),
});

export const getColorBlindTests = async (
  traineeId?: string
): Promise<NewTQCColorBlindTest[]> => {
  const constraints = [];

  if (traineeId) {
    constraints.push(where('trainee_id', '==', traineeId));
  }

  constraints.push(limit(200));

  const q = query(collection(db, COLLECTIONS.COLOR_BLIND), ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) =>
    docToColorBlindTest(d.id, d.data() as Record<string, unknown>)
  );
};

export const createColorBlindTest = async (
  data: NewTQCColorBlindTest
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.COLOR_BLIND, data.test_id);
    await setDoc(docRef, {
      ...data,
      created_at: serverTimestamp(),
    });
  } catch (error) {
    logger.error(`[tqcService] createColorBlindTest failed for ${data.test_id}:`, error);
    throw error;
  }
};
