/**
 * Certification Utils Tests
 * 교육 자격 만료 유틸리티 함수 테스트
 *
 * [TAE] Test Automation Engineer
 */

import { describe, it, expect } from 'vitest';
import type { TrainingResultRecord, TrainingProgram, Position } from '@/types';
import {
  getExpiryDate,
  getDaysUntilExpiry,
  isExpired,
  getExpiryStatus,
} from './certificationUtils';

// ========== Test Data Factories ==========

const createResult = (overrides: Partial<TrainingResultRecord> = {}): TrainingResultRecord => ({
  result_id: 'RES001',
  session_id: 'SES001',
  employee_id: 'EMP001',
  program_code: 'PRG001',
  score: 85,
  result: 'PASS',
  training_date: '2024-01-15',
  grade: 'B',
  needs_retraining: false,
  evaluated_by: 'TRAINER001',
  remarks: '',
  created_at: '2024-01-15',
  updated_at: '2024-01-15',
  updated_by: null,
  ...overrides,
});

const createProgram = (overrides: Partial<TrainingProgram> = {}): TrainingProgram => ({
  program_code: 'PRG001',
  program_name: 'Test Program',
  program_name_vn: 'Chương trình thử nghiệm',
  program_name_kr: '테스트 프로그램',
  category: 'QIP',
  tags: [],
  target_positions: [] as Position[],
  evaluation_type: 'SCORE',
  passing_score: 80,
  grade_aa: 95,
  grade_a: 90,
  grade_b: 80,
  duration_hours: 8,
  validity_months: 12,
  is_active: true,
  created_at: '2023-01-01',
  updated_at: '2023-01-01',
  ...overrides,
});

// ========== Tests ==========

describe('getExpiryDate', () => {
  it('validity_months 기반으로 만료일을 정확히 계산한다', () => {
    const result = createResult({ training_date: '2024-01-15' });
    const program = createProgram({ validity_months: 12 });

    const expiryDate = getExpiryDate(result, program);

    expect(expiryDate).toBeInstanceOf(Date);
    expect(expiryDate!.getFullYear()).toBe(2025);
    expect(expiryDate!.getMonth()).toBe(0); // January
    expect(expiryDate!.getDate()).toBe(15);
  });

  it('validity_months가 6이면 6개월 후 만료일을 반환한다', () => {
    const result = createResult({ training_date: '2024-03-20' });
    const program = createProgram({ validity_months: 6 });

    const expiryDate = getExpiryDate(result, program);

    expect(expiryDate).toBeInstanceOf(Date);
    expect(expiryDate!.getFullYear()).toBe(2024);
    expect(expiryDate!.getMonth()).toBe(8); // September
    expect(expiryDate!.getDate()).toBe(20);
  });

  it('validity_months가 0이면 null을 반환한다 (무기한)', () => {
    const result = createResult({ training_date: '2024-01-15' });
    const program = createProgram({ validity_months: 0 });

    const expiryDate = getExpiryDate(result, program);

    expect(expiryDate).toBeNull();
  });

  it('validity_months가 null이면 null을 반환한다 (무기한)', () => {
    const result = createResult({ training_date: '2024-01-15' });
    const program = createProgram({ validity_months: null });

    const expiryDate = getExpiryDate(result, program);

    expect(expiryDate).toBeNull();
  });

  it('result가 PASS가 아니면 null을 반환한다', () => {
    const result = createResult({ result: 'FAIL', training_date: '2024-01-15' });
    const program = createProgram({ validity_months: 12 });

    const expiryDate = getExpiryDate(result, program);

    expect(expiryDate).toBeNull();
  });

  it('result가 ABSENT이면 null을 반환한다', () => {
    const result = createResult({ result: 'ABSENT', training_date: '2024-01-15' });
    const program = createProgram({ validity_months: 12 });

    const expiryDate = getExpiryDate(result, program);

    expect(expiryDate).toBeNull();
  });
});

describe('getDaysUntilExpiry', () => {
  it('만료까지 남은 일수를 정확히 계산한다', () => {
    const result = createResult({ training_date: '2024-01-15' });
    const program = createProgram({ validity_months: 12 });
    const now = new Date('2024-06-15');

    const days = getDaysUntilExpiry(result, program, now);

    // 만료일: 2025-01-15, 현재: 2024-06-15 → 약 214일
    expect(days).toBeGreaterThan(200);
    expect(days).toBeLessThan(220);
  });

  it('만료일이 지났으면 음수를 반환한다', () => {
    const result = createResult({ training_date: '2023-01-01' });
    const program = createProgram({ validity_months: 6 });
    const now = new Date('2024-06-01');

    const days = getDaysUntilExpiry(result, program, now);

    expect(days).toBeLessThan(0);
  });

  it('무기한 유효(validity_months=0)이면 Infinity를 반환한다', () => {
    const result = createResult({ result: 'PASS', training_date: '2024-01-15' });
    const program = createProgram({ validity_months: 0 });
    const now = new Date('2024-06-15');

    const days = getDaysUntilExpiry(result, program, now);

    expect(days).toBe(Infinity);
  });

  it('무기한 유효(validity_months=null)이면 Infinity를 반환한다', () => {
    const result = createResult({ result: 'PASS', training_date: '2024-01-15' });
    const program = createProgram({ validity_months: null });
    const now = new Date('2024-06-15');

    const days = getDaysUntilExpiry(result, program, now);

    expect(days).toBe(Infinity);
  });

  it('PASS가 아닌 결과는 -1을 반환한다', () => {
    const result = createResult({ result: 'FAIL', training_date: '2024-01-15' });
    const program = createProgram({ validity_months: 12 });
    const now = new Date('2024-06-15');

    const days = getDaysUntilExpiry(result, program, now);

    expect(days).toBe(-1);
  });

  it('ABSENT 결과도 -1을 반환한다', () => {
    const result = createResult({ result: 'ABSENT', training_date: '2024-01-15' });
    const program = createProgram({ validity_months: 12 });
    const now = new Date('2024-06-15');

    const days = getDaysUntilExpiry(result, program, now);

    expect(days).toBe(-1);
  });

  it('만료일 당일이면 0을 반환한다', () => {
    const result = createResult({ training_date: '2024-01-15' });
    const program = createProgram({ validity_months: 6 });
    const now = new Date('2024-07-15');

    const days = getDaysUntilExpiry(result, program, now);

    expect(days).toBe(0);
  });
});

describe('isExpired', () => {
  it('만료일이 지나면 true를 반환한다', () => {
    const result = createResult({ training_date: '2023-01-01' });
    const program = createProgram({ validity_months: 6 });
    const now = new Date('2024-06-01');

    expect(isExpired(result, program, now)).toBe(true);
  });

  it('만료일 이전이면 false를 반환한다', () => {
    const result = createResult({ training_date: '2024-01-15' });
    const program = createProgram({ validity_months: 12 });
    const now = new Date('2024-06-15');

    expect(isExpired(result, program, now)).toBe(false);
  });

  it('무기한 유효(validity_months=0)이면 항상 false를 반환한다', () => {
    const result = createResult({ result: 'PASS', training_date: '2020-01-01' });
    const program = createProgram({ validity_months: 0 });
    const now = new Date('2026-12-31');

    expect(isExpired(result, program, now)).toBe(false);
  });

  it('무기한 유효(validity_months=null)이면 항상 false를 반환한다', () => {
    const result = createResult({ result: 'PASS', training_date: '2020-01-01' });
    const program = createProgram({ validity_months: null });
    const now = new Date('2026-12-31');

    expect(isExpired(result, program, now)).toBe(false);
  });

  it('FAIL 결과는 만료로 취급하지 않는다 (getDaysUntilExpiry가 -1 반환)', () => {
    // isExpired는 days <= 0 && days !== -1 → FAIL(-1)은 false
    const result = createResult({ result: 'FAIL', training_date: '2024-01-15' });
    const program = createProgram({ validity_months: 12 });
    const now = new Date('2024-06-15');

    expect(isExpired(result, program, now)).toBe(false);
  });
});

describe('getExpiryStatus', () => {
  it('유효 기간이 30일 이상 남으면 valid를 반환한다', () => {
    const result = createResult({ training_date: '2024-01-15' });
    const program = createProgram({ validity_months: 12 });
    const now = new Date('2024-06-15'); // 만료일 2025-01-15까지 약 214일

    expect(getExpiryStatus(result, program, now)).toBe('valid');
  });

  it('만료까지 30일 이내이면 expiring_soon을 반환한다', () => {
    const result = createResult({ training_date: '2024-01-15' });
    const program = createProgram({ validity_months: 12 });
    // 만료일: 2025-01-15, 현재: 2024-12-20 → 26일 남음
    const now = new Date('2024-12-20');

    expect(getExpiryStatus(result, program, now)).toBe('expiring_soon');
  });

  it('이미 만료되면 expired를 반환한다', () => {
    const result = createResult({ training_date: '2023-01-01' });
    const program = createProgram({ validity_months: 6 });
    const now = new Date('2024-06-01'); // 만료일: 2023-07-01

    expect(getExpiryStatus(result, program, now)).toBe('expired');
  });

  it('무기한 유효(validity_months=0)이면 valid를 반환한다', () => {
    const result = createResult({ result: 'PASS', training_date: '2020-01-01' });
    const program = createProgram({ validity_months: 0 });
    const now = new Date('2026-12-31');

    expect(getExpiryStatus(result, program, now)).toBe('valid');
  });

  it('무기한 유효(validity_months=null)이면 valid를 반환한다', () => {
    const result = createResult({ result: 'PASS', training_date: '2020-01-01' });
    const program = createProgram({ validity_months: null });
    const now = new Date('2026-12-31');

    expect(getExpiryStatus(result, program, now)).toBe('valid');
  });

  it('PASS가 아닌 결과는 expired를 반환한다', () => {
    const result = createResult({ result: 'FAIL', training_date: '2024-01-15' });
    const program = createProgram({ validity_months: 12 });
    const now = new Date('2024-06-15');

    expect(getExpiryStatus(result, program, now)).toBe('expired');
  });

  it('ABSENT 결과는 expired를 반환한다', () => {
    const result = createResult({ result: 'ABSENT', training_date: '2024-01-15' });
    const program = createProgram({ validity_months: 12 });
    const now = new Date('2024-06-15');

    expect(getExpiryStatus(result, program, now)).toBe('expired');
  });

  it('만료까지 정확히 30일이면 expiring_soon을 반환한다', () => {
    const result = createResult({ training_date: '2024-01-15' });
    const program = createProgram({ validity_months: 12 });
    // 만료일: 2025-01-15, 현재 정확히 30일 전: 2024-12-16
    const now = new Date('2024-12-16');

    expect(getExpiryStatus(result, program, now)).toBe('expiring_soon');
  });

  it('만료까지 정확히 31일이면 valid를 반환한다', () => {
    const result = createResult({ training_date: '2024-01-15' });
    const program = createProgram({ validity_months: 12 });
    // 만료일: 2025-01-15, 31일 전: 2024-12-15
    const now = new Date('2024-12-15');

    expect(getExpiryStatus(result, program, now)).toBe('valid');
  });
});
