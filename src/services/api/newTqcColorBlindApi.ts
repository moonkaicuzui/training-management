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
  // H-3: timestamp + random으로 고유 ID 생성 (충돌 방지)
  // Firestore 쓰기용 데이터 (created_at는 tqcService에서 serverTimestamp() 적용)
  const testData: NewTQCColorBlindTest = {
    test_id: `CBT-${new Date().getFullYear()}-${Date.now().toString(36).slice(-4)}${Math.random().toString(36).substring(2, 5)}`,
    trainee_id: input.trainee_id,
    test_date: input.test_date,
    result: input.result,
    notes: input.notes,
    tested_by: 'admin',
    created_at: now,
  };

  await tqcService.createColorBlindTest(testData);

  // updated_at는 tqcService.updateTrainee 내부에서 serverTimestamp() 적용
  await tqcService.updateTrainee(input.trainee_id, {
    color_blind_status: input.result,
  });

  // 반환 객체에는 클라이언트 시간 유지 (Firestore에는 serverTimestamp() 적용됨)
  return testData;
}
