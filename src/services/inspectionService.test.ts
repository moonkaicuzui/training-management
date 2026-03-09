/**
 * Inspection Service Tests
 * inspectionService.ts 의 핵심 비즈니스 로직 단위 테스트
 *
 * 테스트 대상:
 * - calculateGrade: 매칭률 기반 등급 계산
 * - createInspectionResult: 결과 생성 + batch write
 * - getConsecutiveFailures: 연속 실패 횟수 계산 (3진 아웃)
 * - checkDuplicateEnrollment: 중복 등록 체크
 * - createEnrollment: 등록 생성 (중복 방지)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase module
const mockBatch = {
  set: vi.fn(),
  update: vi.fn(),
  commit: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@/services/firebase', () => ({
  db: {},
  doc: vi.fn(() => 'mock-doc-ref'),
  collection: vi.fn(() => 'mock-collection-ref'),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(() => 'mock-query'),
  where: vi.fn(() => 'mock-where'),
  orderBy: vi.fn(() => 'mock-orderBy'),
  limit: vi.fn(() => 'mock-limit'),
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  writeBatch: vi.fn(() => mockBatch),
  Timestamp: class MockTimestamp {
    toDate() {
      return new Date('2024-01-01T00:00:00.000Z');
    }
    static fromDate(d: Date) {
      return { toDate: () => d };
    }
  },
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import {
  createInspectionResult,
  getConsecutiveFailures,
  checkDuplicateEnrollment,
  createEnrollment,
  getInspectionDetail,
} from '@/services/inspectionService';

import {
  getDocs,
  setDoc,
  where,
} from '@/services/firebase';

// ============================================================
// Test Helpers
// ============================================================

const createMockQuerySnapshot = (
  docs: Array<{ id: string; data: Record<string, unknown>; ref?: unknown }>
) => ({
  docs: docs.map((d) => ({
    id: d.id,
    data: () => d.data,
    exists: () => true,
    ref: d.ref || `ref-${d.id}`,
  })),
  empty: docs.length === 0,
  size: docs.length,
});

const createMockPairs = (matchCount: number, total = 20) =>
  Array.from({ length: total }, (_, i) => ({
    pair_number: i + 1,
    trainee_judgment: 'PASS' as const,
    inspector_judgment: 'PASS' as const,
    is_match: i < matchCount,
  }));

// ============================================================
// Tests
// ============================================================

describe('inspectionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBatch.set.mockClear();
    mockBatch.update.mockClear();
    mockBatch.commit.mockClear().mockResolvedValue(undefined);
  });

  // ----------------------------------------------------------
  // createInspectionResult
  // ----------------------------------------------------------

  describe('createInspectionResult', () => {
    const baseInput = {
      employee_id: 'EMP-001',
      program_code: 'INS-001',
      training_date: '2024-06-15',
      inspector_id: 'INS-EMP-001',
      inspector_name: 'Inspector A',
      trainer_name: 'Trainer A',
      carton_count: 2,
      total_pairs: 20,
      pairs: createMockPairs(20),
      location: 'Building A',
    };

    it('20/20 매칭 시 PASS + AA 등급으로 결과를 생성한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([]) as never
      );

      const result = await createInspectionResult(
        { ...baseInput, pairs: createMockPairs(20) },
        'admin-user'
      );

      expect(result.matchRate).toBe(100);
      expect(mockBatch.set).toHaveBeenCalledTimes(2); // training_results + inspection_results
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);

      // training_results에 기록된 데이터 검증
      const trainingResultData = mockBatch.set.mock.calls[0][1];
      expect(trainingResultData.grade).toBe('AA');
      expect(trainingResultData.result).toBe('PASS');
      expect(trainingResultData.score).toBe(100);
      expect(trainingResultData.needs_retraining).toBe(false);
    });

    it('19/20 매칭 시 PASS + A 등급을 반환한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([]) as never
      );

      const result = await createInspectionResult(
        { ...baseInput, pairs: createMockPairs(19) },
        'admin-user'
      );

      expect(result.matchRate).toBe(95);
      const trainingResultData = mockBatch.set.mock.calls[0][1];
      expect(trainingResultData.grade).toBe('A');
      expect(trainingResultData.result).toBe('PASS');
    });

    it('17/20 매칭 시 PASS + B 등급을 반환한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([]) as never
      );

      const result = await createInspectionResult(
        { ...baseInput, pairs: createMockPairs(17) },
        'admin-user'
      );

      expect(result.matchRate).toBe(85);
      const trainingResultData = mockBatch.set.mock.calls[0][1];
      expect(trainingResultData.grade).toBe('B');
      expect(trainingResultData.result).toBe('PASS');
    });

    it('16/20 매칭 시 PASS + C 등급을 반환한다 (80% 이상이므로 PASS)', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([]) as never
      );

      const result = await createInspectionResult(
        { ...baseInput, pairs: createMockPairs(16) },
        'admin-user'
      );

      expect(result.matchRate).toBe(80);
      const trainingResultData = mockBatch.set.mock.calls[0][1];
      expect(trainingResultData.grade).toBe('C');
      expect(trainingResultData.result).toBe('PASS');
    });

    it('15/20 매칭 시 FAIL + C 등급을 반환한다 (75% < 80%)', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([]) as never
      );

      const result = await createInspectionResult(
        { ...baseInput, pairs: createMockPairs(15) },
        'admin-user'
      );

      expect(result.matchRate).toBe(75);
      const trainingResultData = mockBatch.set.mock.calls[0][1];
      expect(trainingResultData.grade).toBe('C');
      expect(trainingResultData.result).toBe('FAIL');
      expect(trainingResultData.needs_retraining).toBe(true);
    });

    it('이전 결과가 있으면 test_attempt를 증가시킨다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'prev-1', data: {} },
          { id: 'prev-2', data: {} },
        ]) as never
      );

      await createInspectionResult(baseInput, 'admin-user');

      const trainingResultData = mockBatch.set.mock.calls[0][1];
      expect(trainingResultData.test_attempt).toBe(3); // 2 previous + 1
    });

    it('enrollment_id가 있으면 enrollment 상태를 COMPLETED로 업데이트한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([]) as never
      );

      await createInspectionResult(
        { ...baseInput, enrollment_id: 'ENR-001' },
        'admin-user'
      );

      expect(mockBatch.update).toHaveBeenCalledTimes(1);
      expect(mockBatch.update).toHaveBeenCalledWith('mock-doc-ref', {
        status: 'COMPLETED',
        completed_result_id: expect.stringMatching(/^RES-/),
      });
    });

    it('enrollment_id가 없으면 enrollment 업데이트를 하지 않는다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([]) as never
      );

      await createInspectionResult(baseInput, 'admin-user');

      expect(mockBatch.update).not.toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------
  // getConsecutiveFailures (3진 아웃 로직)
  // ----------------------------------------------------------

  describe('getConsecutiveFailures', () => {
    it('결과가 없으면 연속 실패 0을 반환한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([]) as never
      );

      const info = await getConsecutiveFailures('EMP-001');

      expect(info.employee_id).toBe('EMP-001');
      expect(info.consecutive_failures).toBe(0);
      expect(info.requires_reassignment).toBe(false);
      expect(info.last_attempts).toHaveLength(0);
    });

    it('최근 3회 연속 FAIL이면 재배치 필요를 반환한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'r1', data: { result_id: 'RES-001', training_date: '2024-06-15', score: 70, result: 'FAIL' } },
          { id: 'r2', data: { result_id: 'RES-002', training_date: '2024-06-10', score: 65, result: 'FAIL' } },
          { id: 'r3', data: { result_id: 'RES-003', training_date: '2024-06-05', score: 60, result: 'FAIL' } },
        ]) as never
      );

      const info = await getConsecutiveFailures('EMP-001');

      expect(info.consecutive_failures).toBe(3);
      expect(info.requires_reassignment).toBe(true);
    });

    it('최근 2회 FAIL + 1회 PASS이면 연속 실패 2를 반환한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'r1', data: { result_id: 'RES-001', training_date: '2024-06-15', score: 70, result: 'FAIL' } },
          { id: 'r2', data: { result_id: 'RES-002', training_date: '2024-06-10', score: 65, result: 'FAIL' } },
          { id: 'r3', data: { result_id: 'RES-003', training_date: '2024-06-05', score: 90, result: 'PASS' } },
        ]) as never
      );

      const info = await getConsecutiveFailures('EMP-001');

      expect(info.consecutive_failures).toBe(2);
      expect(info.requires_reassignment).toBe(false);
    });

    it('최근 결과가 PASS이면 연속 실패 0을 반환한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'r1', data: { result_id: 'RES-001', training_date: '2024-06-15', score: 95, result: 'PASS' } },
          { id: 'r2', data: { result_id: 'RES-002', training_date: '2024-06-10', score: 65, result: 'FAIL' } },
        ]) as never
      );

      const info = await getConsecutiveFailures('EMP-001');

      expect(info.consecutive_failures).toBe(0);
      expect(info.requires_reassignment).toBe(false);
    });

    it('last_attempts는 최근 5개까지만 반환한다', async () => {
      const docs = Array.from({ length: 7 }, (_, i) => ({
        id: `r${i}`,
        data: {
          result_id: `RES-00${i}`,
          training_date: `2024-06-${String(15 - i).padStart(2, '0')}`,
          score: 60,
          result: 'FAIL',
        },
      }));

      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot(docs) as never
      );

      const info = await getConsecutiveFailures('EMP-001');

      expect(info.last_attempts).toHaveLength(5);
      expect(info.consecutive_failures).toBe(7);
      expect(info.requires_reassignment).toBe(true);
    });

    it('INS-001 프로그램 코드로 필터링한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([]) as never
      );

      await getConsecutiveFailures('EMP-001');

      expect(where).toHaveBeenCalledWith('employee_id', '==', 'EMP-001');
      expect(where).toHaveBeenCalledWith('program_code', '==', 'INS-001');
    });
  });

  // ----------------------------------------------------------
  // checkDuplicateEnrollment
  // ----------------------------------------------------------

  describe('checkDuplicateEnrollment', () => {
    it('PENDING 상태의 기존 등록이 있으면 해당 등록을 반환한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          {
            id: 'ENR-001',
            data: {
              enrollment_id: 'ENR-001',
              employee_id: 'EMP-001',
              employee_name: 'Test Employee',
              program_code: 'INS-001',
              source: 'MANUAL',
              enrolled_by: 'admin',
              enrolled_at: '2024-06-01T00:00:00Z',
              status: 'PENDING',
            },
          },
        ]) as never
      );

      const result = await checkDuplicateEnrollment('EMP-001', 'INS-001');

      expect(result).not.toBeNull();
      expect(result!.enrollment_id).toBe('ENR-001');
      expect(result!.status).toBe('PENDING');
    });

    it('SCHEDULED 상태의 기존 등록이 있으면 해당 등록을 반환한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          {
            id: 'ENR-002',
            data: {
              enrollment_id: 'ENR-002',
              employee_id: 'EMP-001',
              employee_name: 'Test Employee',
              program_code: 'INS-001',
              source: 'AQL_RECOMMENDATION',
              enrolled_by: 'admin',
              enrolled_at: '2024-06-01T00:00:00Z',
              status: 'SCHEDULED',
            },
          },
        ]) as never
      );

      const result = await checkDuplicateEnrollment('EMP-001', 'INS-001');

      expect(result).not.toBeNull();
      expect(result!.status).toBe('SCHEDULED');
    });

    it('COMPLETED 상태만 있으면 null을 반환한다 (재등록 가능)', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          {
            id: 'ENR-003',
            data: {
              enrollment_id: 'ENR-003',
              employee_id: 'EMP-001',
              employee_name: 'Test Employee',
              program_code: 'INS-001',
              source: 'MANUAL',
              enrolled_by: 'admin',
              enrolled_at: '2024-05-01T00:00:00Z',
              status: 'COMPLETED',
            },
          },
        ]) as never
      );

      const result = await checkDuplicateEnrollment('EMP-001', 'INS-001');

      expect(result).toBeNull();
    });

    it('등록이 없으면 null을 반환한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([]) as never
      );

      const result = await checkDuplicateEnrollment('EMP-999', 'INS-001');

      expect(result).toBeNull();
    });
  });

  // ----------------------------------------------------------
  // createEnrollment
  // ----------------------------------------------------------

  describe('createEnrollment', () => {
    const baseEnrollmentInput = {
      employee_id: 'EMP-001',
      employee_name: 'Test Employee',
      program_code: 'INS-001',
      source: 'MANUAL' as const,
      enrolled_by: 'admin-user',
    };

    it('중복이 없으면 새 등록을 생성한다', async () => {
      // checkDuplicateEnrollment → 빈 결과 (중복 없음)
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([]) as never
      );
      vi.mocked(setDoc).mockResolvedValue(undefined as never);

      const result = await createEnrollment(baseEnrollmentInput);

      expect(result.enrollment_id).toMatch(/^ENR-/);
      expect(result.employee_id).toBe('EMP-001');
      expect(result.program_code).toBe('INS-001');
      expect(result.status).toBe('PENDING');
      expect(result.source).toBe('MANUAL');
      expect(setDoc).toHaveBeenCalledTimes(1);
    });

    it('PENDING/SCHEDULED 등록이 이미 있으면 에러를 던진다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          {
            id: 'ENR-EXISTING',
            data: {
              enrollment_id: 'ENR-EXISTING',
              employee_id: 'EMP-001',
              employee_name: 'Test Employee',
              program_code: 'INS-001',
              source: 'MANUAL',
              enrolled_by: 'admin',
              enrolled_at: '2024-06-01T00:00:00Z',
              status: 'PENDING',
            },
          },
        ]) as never
      );

      await expect(createEnrollment(baseEnrollmentInput)).rejects.toThrow(
        /Duplicate enrollment/
      );
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('source_log_id를 포함하여 생성할 수 있다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([]) as never
      );
      vi.mocked(setDoc).mockResolvedValue(undefined as never);

      const result = await createEnrollment({
        ...baseEnrollmentInput,
        source: 'FIVE_PRS_RECOMMENDATION',
        source_log_id: 'LOG-001',
      });

      expect(result.source).toBe('FIVE_PRS_RECOMMENDATION');
      expect(result.source_log_id).toBe('LOG-001');
    });
  });

  // ----------------------------------------------------------
  // getInspectionDetail
  // ----------------------------------------------------------

  describe('getInspectionDetail', () => {
    it('result_id로 검사 상세를 조회한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          {
            id: 'INS-001',
            data: {
              inspection_id: 'INS-001',
              result_id: 'RES-001',
              employee_id: 'EMP-001',
              program_code: 'INS-001',
              training_date: '2024-06-15',
              inspector_id: 'INS-EMP-001',
              inspector_name: 'Inspector A',
              trainer_name: 'Trainer A',
              carton_count: 2,
              total_pairs: 20,
              pairs: createMockPairs(18),
              matched_count: 18,
              match_rate: 90,
              location: 'Building A',
              notes: '',
              created_at: '2024-06-15T10:00:00Z',
              created_by: 'admin',
            },
          },
        ]) as never
      );

      const detail = await getInspectionDetail('RES-001');

      expect(detail).not.toBeNull();
      expect(detail!.result_id).toBe('RES-001');
      expect(detail!.match_rate).toBe(90);
    });

    it('존재하지 않는 result_id로 조회하면 null을 반환한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([]) as never
      );

      const detail = await getInspectionDetail('RES-NONEXISTENT');

      expect(detail).toBeNull();
    });
  });
});
