/**
 * Result Service Tests
 * resultService.ts 의 핵심 비즈니스 로직 단위 테스트
 *
 * 테스트 대상:
 * - createResult: 결과 생성 + ID 자동 생성
 * - batchCreateResults: 일괄 결과 생성 (500개 청크)
 * - updateResult: 결과 수정 (serverTimestamp 자동 설정)
 * - getResults: 필터링 조회
 * - NO DELETE 정책: delete 함수가 존재하지 않음
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase module
const mockBatch = {
  set: vi.fn(),
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

import * as resultServiceModule from '@/services/resultService';
import {
  createResult,
  batchCreateResults,
  updateResult,
  getResults,
  getResult,
  getResultsByEmployee,
} from '@/services/resultService';

import {
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  where,
} from '@/services/firebase';

// ============================================================
// Test Helpers
// ============================================================

const createMockDocSnapshot = (
  id: string,
  data: Record<string, unknown>,
  exists = true
) => ({
  id,
  data: () => data,
  exists: () => exists,
});

const createMockQuerySnapshot = (
  docs: Array<{ id: string; data: Record<string, unknown> }>
) => ({
  docs: docs.map((d) => ({
    id: d.id,
    data: () => d.data,
    exists: () => true,
  })),
  empty: docs.length === 0,
  size: docs.length,
});

const baseResultInput = {
  session_id: 'SES-001' as string | null,
  employee_id: 'EMP-001',
  program_code: 'QIP-001',
  training_date: '2024-06-15',
  score: 95 as number | null,
  grade: 'A' as const,
  result: 'PASS' as const,
  needs_retraining: false,
  evaluated_by: 'trainer-001',
  remarks: 'Good performance',
};

// ============================================================
// Tests
// ============================================================

describe('resultService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBatch.set.mockClear();
    mockBatch.commit.mockClear().mockResolvedValue(undefined);
  });

  // ----------------------------------------------------------
  // NO DELETE 정책 검증
  // ----------------------------------------------------------

  describe('NO DELETE 정책', () => {
    it('deleteResult 함수가 export되지 않는다', () => {
      const exports = Object.keys(resultServiceModule);
      expect(exports).not.toContain('deleteResult');
      expect(exports).not.toContain('removeResult');
      expect(exports).not.toContain('batchDeleteResults');
    });
  });

  // ----------------------------------------------------------
  // createResult
  // ----------------------------------------------------------

  describe('createResult', () => {
    it('결과를 생성하고 TrainingResultRecord를 반환한다', async () => {
      vi.mocked(setDoc).mockResolvedValue(undefined as never);

      const result = await createResult(baseResultInput);

      expect(result.result_id).toMatch(/^RES-/);
      expect(result.employee_id).toBe('EMP-001');
      expect(result.program_code).toBe('QIP-001');
      expect(result.score).toBe(95);
      expect(result.grade).toBe('A');
      expect(result.result).toBe('PASS');
      expect(result.created_at).toBeTruthy();
      expect(result.updated_at).toBeNull();
      expect(result.updated_by).toBeNull();
    });

    it('serverTimestamp로 created_at을 설정한다', async () => {
      vi.mocked(setDoc).mockResolvedValue(undefined as never);

      await createResult(baseResultInput);

      const savedData = vi.mocked(setDoc).mock.calls[0][1] as Record<string, unknown>;
      expect(savedData.created_at).toBe('SERVER_TIMESTAMP');
      expect(savedData.updated_at).toBeNull();
      expect(savedData.updated_by).toBeNull();
    });

    it('FAIL 결과도 정상적으로 생성한다', async () => {
      vi.mocked(setDoc).mockResolvedValue(undefined as never);

      const failResult = await createResult({
        ...baseResultInput,
        score: 65,
        grade: 'C' as const,
        result: 'FAIL' as const,
        needs_retraining: true,
      });

      expect(failResult.result).toBe('FAIL');
      expect(failResult.needs_retraining).toBe(true);
      expect(failResult.grade).toBe('C');
    });

    it('score가 null인 PASS/FAIL 결과를 생성할 수 있다', async () => {
      vi.mocked(setDoc).mockResolvedValue(undefined as never);

      const result = await createResult({
        ...baseResultInput,
        score: null,
        grade: null,
        result: 'PASS' as const,
      });

      expect(result.score).toBeNull();
      expect(result.grade).toBeNull();
    });
  });

  // ----------------------------------------------------------
  // batchCreateResults
  // ----------------------------------------------------------

  describe('batchCreateResults', () => {
    it('여러 결과를 배치로 생성한다', async () => {
      const inputs = [
        { ...baseResultInput, employee_id: 'EMP-001' },
        { ...baseResultInput, employee_id: 'EMP-002' },
        { ...baseResultInput, employee_id: 'EMP-003' },
      ];

      const results = await batchCreateResults(inputs);

      expect(results).toHaveLength(3);
      expect(mockBatch.set).toHaveBeenCalledTimes(3);
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
      results.forEach((r) => {
        expect(r.result_id).toMatch(/^RES-/);
        expect(r.updated_at).toBeNull();
        expect(r.updated_by).toBeNull();
      });
    });

    it('빈 배열이면 배치를 실행하지 않고 빈 배열을 반환한다', async () => {
      const results = await batchCreateResults([]);

      expect(results).toHaveLength(0);
      expect(mockBatch.commit).not.toHaveBeenCalled();
    });

    it('각 결과에 고유한 result_id를 부여한다', async () => {
      const inputs = [
        { ...baseResultInput, employee_id: 'EMP-001' },
        { ...baseResultInput, employee_id: 'EMP-002' },
      ];

      const results = await batchCreateResults(inputs);

      const ids = results.map((r) => r.result_id);
      expect(new Set(ids).size).toBe(ids.length); // 모든 ID가 고유함
    });
  });

  // ----------------------------------------------------------
  // updateResult
  // ----------------------------------------------------------

  describe('updateResult', () => {
    it('결과를 수정하고 serverTimestamp를 자동 설정한다', async () => {
      vi.mocked(updateDoc).mockResolvedValue(undefined as never);

      await updateResult('RES-001', {
        score: 90,
        grade: 'A',
        result: 'PASS',
        updated_by: 'admin-user',
      });

      expect(updateDoc).toHaveBeenCalledWith('mock-doc-ref', {
        score: 90,
        grade: 'A',
        result: 'PASS',
        updated_by: 'admin-user',
        updated_at: 'SERVER_TIMESTAMP',
      });
    });

    it('부분 업데이트가 가능하다', async () => {
      vi.mocked(updateDoc).mockResolvedValue(undefined as never);

      await updateResult('RES-001', { remarks: 'Updated remark' });

      expect(updateDoc).toHaveBeenCalledWith('mock-doc-ref', {
        remarks: 'Updated remark',
        updated_at: 'SERVER_TIMESTAMP',
      });
    });
  });

  // ----------------------------------------------------------
  // getResult
  // ----------------------------------------------------------

  describe('getResult', () => {
    it('ID로 단일 결과를 조회한다', async () => {
      vi.mocked(getDoc).mockResolvedValue(
        createMockDocSnapshot('RES-001', {
          result_id: 'RES-001',
          session_id: 'SES-001',
          employee_id: 'EMP-001',
          program_code: 'QIP-001',
          training_date: '2024-06-15',
          score: 95,
          grade: 'A',
          result: 'PASS',
          needs_retraining: false,
          evaluated_by: 'trainer-001',
          remarks: '',
          created_at: '2024-06-15T10:00:00Z',
          updated_at: null,
          updated_by: null,
        }) as never
      );

      const result = await getResult('RES-001');

      expect(result).not.toBeNull();
      expect(result!.result_id).toBe('RES-001');
      expect(result!.score).toBe(95);
    });

    it('존재하지 않으면 null을 반환한다', async () => {
      vi.mocked(getDoc).mockResolvedValue(
        createMockDocSnapshot('RES-999', {}, false) as never
      );

      const result = await getResult('RES-999');

      expect(result).toBeNull();
    });
  });

  // ----------------------------------------------------------
  // getResults (필터링)
  // ----------------------------------------------------------

  describe('getResults', () => {
    it('필터 없이 전체 결과를 조회한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          {
            id: 'RES-001',
            data: {
              result_id: 'RES-001',
              employee_id: 'EMP-001',
              program_code: 'QIP-001',
              training_date: '2024-06-15',
              score: 95,
              grade: 'A',
              result: 'PASS',
              needs_retraining: false,
              evaluated_by: 'trainer-001',
              remarks: '',
              created_at: '2024-06-15T10:00:00Z',
              updated_at: null,
              updated_by: null,
            },
          },
        ]) as never
      );

      const results = await getResults();

      expect(results).toHaveLength(1);
      expect(results[0].result_id).toBe('RES-001');
    });

    it('employeeId 필터로 직원별 결과를 조회한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([]) as never
      );

      await getResults({ employeeId: 'EMP-001' });

      expect(where).toHaveBeenCalledWith('employee_id', '==', 'EMP-001');
    });

    it('programCode 필터로 프로그램별 결과를 조회한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([]) as never
      );

      await getResults({ programCode: 'QIP-001' });

      expect(where).toHaveBeenCalledWith('program_code', '==', 'QIP-001');
    });

    it('result 필터로 PASS/FAIL 결과를 조회한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([]) as never
      );

      await getResults({ result: 'FAIL' });

      expect(where).toHaveBeenCalledWith('result', '==', 'FAIL');
    });

    it('startDate/endDate 필터로 날짜 범위 결과를 조회한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          {
            id: 'RES-001',
            data: {
              result_id: 'RES-001',
              employee_id: 'EMP-001',
              program_code: 'QIP-001',
              training_date: '2024-06-15',
              score: 95,
              grade: 'A',
              result: 'PASS',
              needs_retraining: false,
              evaluated_by: 'trainer-001',
              remarks: '',
              created_at: '2024-06-15T10:00:00Z',
              updated_at: null,
              updated_by: null,
            },
          },
          {
            id: 'RES-002',
            data: {
              result_id: 'RES-002',
              employee_id: 'EMP-002',
              program_code: 'QIP-001',
              training_date: '2024-07-20',
              score: 80,
              grade: 'B',
              result: 'PASS',
              needs_retraining: false,
              evaluated_by: 'trainer-001',
              remarks: '',
              created_at: '2024-07-20T10:00:00Z',
              updated_at: null,
              updated_by: null,
            },
          },
        ]) as never
      );

      const results = await getResults({
        startDate: '2024-07-01',
        endDate: '2024-07-31',
      });

      expect(results).toHaveLength(1);
      expect(results[0].training_date).toBe('2024-07-20');
    });

    it('grade 필터로 등급별 결과를 조회한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          {
            id: 'RES-001',
            data: {
              result_id: 'RES-001',
              employee_id: 'EMP-001',
              program_code: 'QIP-001',
              training_date: '2024-06-15',
              score: 95,
              grade: 'A',
              result: 'PASS',
              needs_retraining: false,
              evaluated_by: 'trainer-001',
              remarks: '',
              created_at: '2024-06-15T10:00:00Z',
              updated_at: null,
              updated_by: null,
            },
          },
          {
            id: 'RES-002',
            data: {
              result_id: 'RES-002',
              employee_id: 'EMP-002',
              program_code: 'QIP-001',
              training_date: '2024-06-16',
              score: 85,
              grade: 'B',
              result: 'PASS',
              needs_retraining: false,
              evaluated_by: 'trainer-001',
              remarks: '',
              created_at: '2024-06-16T10:00:00Z',
              updated_at: null,
              updated_by: null,
            },
          },
        ]) as never
      );

      const results = await getResults({ grade: 'A' });

      expect(results).toHaveLength(1);
      expect(results[0].grade).toBe('A');
    });

    it('training_date 기준 내림차순으로 정렬한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          {
            id: 'RES-001',
            data: {
              result_id: 'RES-001',
              employee_id: 'EMP-001',
              program_code: 'QIP-001',
              training_date: '2024-06-10',
              score: 95,
              grade: 'A',
              result: 'PASS',
              needs_retraining: false,
              evaluated_by: 'trainer-001',
              remarks: '',
              created_at: '2024-06-10T10:00:00Z',
              updated_at: null,
              updated_by: null,
            },
          },
          {
            id: 'RES-002',
            data: {
              result_id: 'RES-002',
              employee_id: 'EMP-002',
              program_code: 'QIP-001',
              training_date: '2024-06-20',
              score: 85,
              grade: 'B',
              result: 'PASS',
              needs_retraining: false,
              evaluated_by: 'trainer-001',
              remarks: '',
              created_at: '2024-06-20T10:00:00Z',
              updated_at: null,
              updated_by: null,
            },
          },
        ]) as never
      );

      const results = await getResults();

      expect(results[0].training_date).toBe('2024-06-20');
      expect(results[1].training_date).toBe('2024-06-10');
    });
  });

  // ----------------------------------------------------------
  // getResultsByEmployee
  // ----------------------------------------------------------

  describe('getResultsByEmployee', () => {
    it('직원 ID로 교육 결과를 조회한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          {
            id: 'RES-001',
            data: {
              result_id: 'RES-001',
              employee_id: 'EMP-001',
              program_code: 'QIP-001',
              training_date: '2024-06-15',
              score: 95,
              grade: 'A',
              result: 'PASS',
              needs_retraining: false,
              evaluated_by: 'trainer-001',
              remarks: '',
              created_at: '2024-06-15T10:00:00Z',
              updated_at: null,
              updated_by: null,
            },
          },
        ]) as never
      );

      const results = await getResultsByEmployee('EMP-001');

      expect(results).toHaveLength(1);
      expect(where).toHaveBeenCalledWith('employee_id', '==', 'EMP-001');
    });
  });
});
