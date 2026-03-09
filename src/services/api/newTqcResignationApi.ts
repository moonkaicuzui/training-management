import * as tqcService from '../tqcService';

import type {
  NewTQCResignation,
  NewTQCResignationFilters,
  NewTQCResignationInput,
} from '@/types';

import { NotFoundError } from './common';

export async function getNewTQCResignations(
  filters?: NewTQCResignationFilters
): Promise<NewTQCResignation[]> {
  let result = await tqcService.getResignations(filters);

  if (filters?.trainer && filters.trainer !== 'all') {
    const trainees = await tqcService.getTrainees();
    const traineeIds = trainees
      .filter(t => t.trainer_id === filters.trainer)
      .map(t => t.trainee_id);
    result = result.filter(r => traineeIds.includes(r.trainee_id));
  }

  if (filters?.team && filters.team !== 'all') {
    const trainees = await tqcService.getTrainees();
    const traineeIds = trainees
      .filter(t => t.team_id === filters.team)
      .map(t => t.trainee_id);
    result = result.filter(r => traineeIds.includes(r.trainee_id));
  }

  return result;
}

export async function createNewTQCResignation(
  input: NewTQCResignationInput
): Promise<NewTQCResignation> {
  const now = new Date().toISOString();
  const trainee = await tqcService.getTraineeById(input.trainee_id);
  if (!trainee) throw new NotFoundError('Trainee not found');

  const startDate = new Date(trainee.start_date);
  const resignDate = new Date(input.resign_date);
  const trainingDays = Math.ceil(
    (resignDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const stages = await tqcService.getStagesByTrainee(input.trainee_id);
  const completedStages = stages.filter(s => s.status === 'COMPLETED');
  const lastCompletedStage =
    completedStages.length > 0
      ? completedStages.sort((a, b) => b.stage_order - a.stage_order)[0].stage_name
      : undefined;

  const existingResignations = await tqcService.getResignations();
  const resignationCount = existingResignations.length + 1;

  const newResignation: NewTQCResignation = {
    resignation_id: `RSG-${new Date().getFullYear()}-${String(resignationCount).padStart(3, '0')}`,
    trainee_id: input.trainee_id,
    resign_date: input.resign_date,
    reason_category: input.reason_category,
    reason_detail: input.reason_detail,
    training_duration_days: trainingDays,
    last_completed_stage: lastCompletedStage,
    created_at: now,
    created_by: 'admin',
  };

  await tqcService.createResignation(newResignation);

  await tqcService.updateTrainee(input.trainee_id, {
    status: 'RESIGNED',
    updated_at: now,
  });

  return newResignation;
}
