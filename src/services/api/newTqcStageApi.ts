import * as tqcService from '../tqcService';
import { db, doc, getDoc } from '@/services/firebase';
import { COLLECTIONS } from '../tqc/constants';

import type {
  NewTQCTrainee,
  NewTQCTrainingStage,
  NewTQCStageUpdate,
} from '@/types';

export async function getNewTQCTrainingStages(traineeId: string): Promise<NewTQCTrainingStage[]> {
  return tqcService.getStagesByTrainee(traineeId);
}

export async function updateNewTQCTrainingStage(
  input: NewTQCStageUpdate
): Promise<NewTQCTrainingStage | null> {
  // 1. stage_id로 해당 stage 문서를 직접 조회하여 trainee_id 확인
  const stageDocRef = doc(db, COLLECTIONS.STAGES, input.stage_id);
  const stageSnap = await getDoc(stageDocRef);
  if (!stageSnap.exists()) {
    return null;
  }

  const stageData = stageSnap.data();
  const traineeId = stageData.trainee_id as string;
  if (!traineeId) {
    return null;
  }

  // 2. 해당 stage 업데이트 (serverTimestamp는 updateStage 내부에서 적용됨)
  await tqcService.updateStage(input.stage_id, {
    ...input,
    updated_by: 'admin',
  });

  // 3. 해당 trainee의 stages만 조회하여 progress 계산
  const traineeStages = await tqcService.getStagesByTrainee(traineeId);
  const completedCount = traineeStages.filter(s =>
    s.stage_id === input.stage_id
      ? (input.status || s.status) === 'COMPLETED'
      : s.status === 'COMPLETED'
  ).length;
  const progress = Math.round((completedCount / traineeStages.length) * 100);

  // 4. trainee 업데이트 (serverTimestamp는 updateTrainee 내부에서 적용됨)
  const traineeUpdates: Partial<NewTQCTrainee> = {
    progress_percentage: progress,
  };

  if (progress === 100) {
    traineeUpdates.status = 'COMPLETED';
  }

  await tqcService.updateTrainee(traineeId, traineeUpdates);

  // 5. 업데이트된 stage 반환
  const updatedStages = await tqcService.getStagesByTrainee(traineeId);
  return updatedStages.find(s => s.stage_id === input.stage_id) || null;
}
