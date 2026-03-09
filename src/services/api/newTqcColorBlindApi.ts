import * as tqcService from '../tqcService';

import type {
  NewTQCColorBlindTest,
  NewTQCColorBlindTestInput,
} from '@/types';

export async function getNewTQCColorBlindTests(traineeId?: string): Promise<NewTQCColorBlindTest[]> {
  return tqcService.getColorBlindTests(traineeId);
}

export async function createNewTQCColorBlindTest(
  input: NewTQCColorBlindTestInput
): Promise<NewTQCColorBlindTest> {
  const now = new Date().toISOString();
  const existingTests = await tqcService.getColorBlindTests();
  const testCount = existingTests.length + 1;

  const newTest: NewTQCColorBlindTest = {
    test_id: `CBT-${new Date().getFullYear()}-${String(testCount).padStart(3, '0')}`,
    trainee_id: input.trainee_id,
    test_date: input.test_date,
    result: input.result,
    notes: input.notes,
    tested_by: 'admin',
    created_at: now,
  };

  await tqcService.createColorBlindTest(newTest);

  await tqcService.updateTrainee(input.trainee_id, {
    color_blind_status: input.result,
    updated_at: now,
  });

  return newTest;
}
