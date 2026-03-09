import {
  db,
  doc,
  collection,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  Timestamp,
} from '@/services/firebase';
import type { NewTQCTrainingStage } from '@/types';
import { logger } from '@/utils/logger';
import { COLLECTIONS, convertTimestamp } from './constants';

const docToStage = (docId: string, data: Record<string, unknown>): NewTQCTrainingStage => ({
  stage_id: (data.stage_id as string) || docId,
  trainee_id: (data.trainee_id as string) || '',
  stage_name: (data.stage_name as string) || '',
  stage_order: (data.stage_order as number) || 0,
  start_date: data.start_date as string | undefined,
  end_date: data.end_date as string | undefined,
  status: (data.status as NewTQCTrainingStage['status']) || 'PENDING',
  notes: data.notes as string | undefined,
  updated_at: convertTimestamp(data.updated_at as Timestamp | string | undefined),
  updated_by: data.updated_by as string | undefined,
});

export const getStagesByTrainee = async (
  traineeId: string
): Promise<NewTQCTrainingStage[]> => {
  const q = query(
    collection(db, COLLECTIONS.STAGES),
    where('trainee_id', '==', traineeId),
    orderBy('stage_order', 'asc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) =>
    docToStage(d.id, d.data() as Record<string, unknown>)
  );
};

export const createStage = async (
  data: NewTQCTrainingStage
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.STAGES, data.stage_id);
    await setDoc(docRef, {
      ...data,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    logger.error(`[tqcService] createStage failed for ${data.stage_id}:`, error);
    throw error;
  }
};

export const updateStage = async (
  stageId: string,
  updates: Partial<NewTQCTrainingStage>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.STAGES, stageId);
    await updateDoc(docRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    logger.error(`[tqcService] updateStage failed for ${stageId}:`, error);
    throw error;
  }
};
