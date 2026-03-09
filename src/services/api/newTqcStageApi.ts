import * as tqcService from '../tqcService';

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
  const stages = await tqcService.getStagesByTrainee('');
  const existingStage = stages.find(s => s.stage_id === input.stage_id);
  if (!existingStage) {
    // Fallback: try fetching all stages to find this one
    // We need the trainee_id to update progress
  }

  const now = new Date().toISOString();
  await tqcService.updateStage(input.stage_id, {
    ...input,
    updated_at: now,
    updated_by: 'admin',
  });

  const allTrainees = await tqcService.getTrainees();
  for (const trainee of allTrainees) {
    const traineeStages = await tqcService.getStagesByTrainee(trainee.trainee_id);
    const matchingStage = traineeStages.find(s => s.stage_id === input.stage_id);
    if (matchingStage) {
      const completedCount = traineeStages.filter(s =>
        s.stage_id === input.stage_id
          ? (input.status || s.status) === 'COMPLETED'
          : s.status === 'COMPLETED'
      ).length;
      const progress = Math.round((completedCount / traineeStages.length) * 100);

      const traineeUpdates: Partial<NewTQCTrainee> = {
        progress_percentage: progress,
        updated_at: now,
      };

      if (progress === 100) {
        traineeUpdates.status = 'COMPLETED';
      }

      await tqcService.updateTrainee(trainee.trainee_id, traineeUpdates);

      const updatedStages = await tqcService.getStagesByTrainee(trainee.trainee_id);
      return updatedStages.find(s => s.stage_id === input.stage_id) || null;
    }
  }

  return null;
}
