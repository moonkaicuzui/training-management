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
    // H-4: 단계 건너뛰기 방지 — IN_PROGRESS/COMPLETED 전환 시 이전 단계 검증
    if (updates.status === 'IN_PROGRESS' || updates.status === 'COMPLETED') {
      const stageSnap = await getDocs(query(
        collection(db, COLLECTIONS.STAGES),
        where('stage_id', '==', stageId),
      ));
      if (!stageSnap.empty) {
        const stageData = stageSnap.docs[0].data();
        const traineeId = stageData.trainee_id as string;
        const currentOrder = stageData.stage_order as number;

        if (traineeId && currentOrder > 1) {
          const allStages = await getStagesByTrainee(traineeId);
          const prevStages = allStages.filter(s => s.stage_order < currentOrder);
          const allPrevCompleted = prevStages.every(s => s.status === 'COMPLETED');

          if (!allPrevCompleted && updates.status === 'COMPLETED') {
            throw new Error(`이전 단계가 완료되지 않아 stage_order=${currentOrder}를 COMPLETED로 변경할 수 없습니다.`);
          }
          if (!allPrevCompleted && updates.status === 'IN_PROGRESS') {
            const prevInProgressOrCompleted = prevStages.every(
              s => s.status === 'COMPLETED' || s.status === 'IN_PROGRESS'
            );
            if (!prevInProgressOrCompleted) {
              throw new Error(`이전 단계가 시작되지 않아 stage_order=${currentOrder}를 IN_PROGRESS로 변경할 수 없습니다.`);
            }
          }
        }
      }
    }

    const stageDocRef = doc(db, COLLECTIONS.STAGES, stageId);
    await updateDoc(stageDocRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    logger.error(`[tqcService] updateStage failed for ${stageId}:`, error);
    throw error;
  }
};
