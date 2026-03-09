/**
 * Certification Expiry Utility Functions
 *
 * 교육 자격 만료 관련 유틸리티.
 * training_results + training_programs 데이터로 만료 상태를 계산합니다.
 *
 * Rules:
 * - validity_months === 0 || null → 무기한 유효
 * - expiring_soon = 30일 이내 만료 예정
 * - expired = 만료일 경과
 */

import type { TrainingResultRecord, TrainingProgram } from '@/types';

export type ExpiryStatus = 'valid' | 'expiring_soon' | 'expired';

const EXPIRING_SOON_THRESHOLD_DAYS = 30;

/**
 * 교육 결과의 만료일 계산
 * validity_months가 0이거나 null이면 null 반환 (무기한)
 */
export function getExpiryDate(
  result: TrainingResultRecord,
  program: TrainingProgram
): Date | null {
  if (!program.validity_months) return null;
  if (result.result !== 'PASS') return null;

  const trainingDate = new Date(result.training_date);
  const expiryDate = new Date(trainingDate);
  expiryDate.setMonth(expiryDate.getMonth() + program.validity_months);

  return expiryDate;
}

/**
 * 만료까지 남은 일수 계산
 * 무기한 유효 → Infinity
 * PASS가 아닌 경우 → -1
 */
export function getDaysUntilExpiry(
  result: TrainingResultRecord,
  program: TrainingProgram,
  now: Date = new Date()
): number {
  if (result.result !== 'PASS') return -1;

  const expiryDate = getExpiryDate(result, program);
  if (!expiryDate) return Infinity; // 무기한 유효

  return Math.ceil(
    (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
}

/**
 * 만료 여부 확인
 * validity_months가 0이거나 null이면 항상 false (무기한)
 */
export function isExpired(
  result: TrainingResultRecord,
  program: TrainingProgram,
  now: Date = new Date()
): boolean {
  const days = getDaysUntilExpiry(result, program, now);
  return days <= 0 && days !== -1;
}

/**
 * 만료 상태 반환
 * - 'valid': 유효 (만료일 30일 이상 남음 또는 무기한)
 * - 'expiring_soon': 30일 이내 만료 예정
 * - 'expired': 이미 만료됨
 *
 * PASS가 아닌 결과는 'expired' 반환
 */
export function getExpiryStatus(
  result: TrainingResultRecord,
  program: TrainingProgram,
  now: Date = new Date()
): ExpiryStatus {
  if (result.result !== 'PASS') return 'expired';

  const days = getDaysUntilExpiry(result, program, now);

  if (days === Infinity) return 'valid'; // 무기한 유효
  if (days <= 0) return 'expired';
  if (days <= EXPIRING_SOON_THRESHOLD_DAYS) return 'expiring_soon';

  return 'valid';
}
