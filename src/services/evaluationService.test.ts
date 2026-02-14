/**
 * Evaluation Service Tests
 * evaluationService.ts 의 Firestore CRUD 로직 단위 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase module
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
  serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
  Timestamp: class MockTimestamp {
    toDate() {
      return new Date('2024-01-01T00:00:00.000Z');
    }
    static fromDate(d: Date) {
      return { toDate: () => d };
    }
  },
}));

import {
  getEvaluations,
  getEvaluation,
  getEvaluationsByProgram,
  createEvaluation,
  updateEvaluation,
} from '@/services/evaluationService';
import type { TrainingEvaluation } from '@/services/evaluationService';

import {
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
} from '@/services/firebase';

// ============================================================
// Test Data
// ============================================================

const mockEvaluationData: Record<string, unknown> = {
  id: 'eval-001',
  programId: 'prog-001',
  programName: 'Safety Training',
  sessionId: 'sess-001',
  sessionDate: '2024-01-15',
  employeeId: 'emp-001',
  employeeName: 'Nguyen Van A',
  department: 'Production',
  evaluationType: 'reaction',
  responses: [
    { criteriaId: 'crit-001', score: 4, comment: 'Good' },
  ],
  overallScore: 4.0,
  feedback: 'Training was well-organized.',
  submittedAt: '2024-01-15T10:00:00.000Z',
  status: 'submitted',
};

const createMockDocSnapshot = (id: string, data: Record<string, unknown>, exists = true) => ({
  id,
  data: () => data,
  exists: () => exists,
});

const createMockQuerySnapshot = (docs: Array<{ id: string; data: Record<string, unknown> }>) => ({
  docs: docs.map((d) => ({
    id: d.id,
    data: () => d.data,
    exists: () => true,
  })),
  empty: docs.length === 0,
});

// ============================================================
// Tests
// ============================================================

describe('evaluationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----------------------------------------------------------
  // Read Operations
  // ----------------------------------------------------------

  describe('getEvaluations', () => {
    it('필터 없이 모든 평가를 조회한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'eval-001', data: mockEvaluationData },
        ]) as never
      );

      const result = await getEvaluations();

      expect(query).toHaveBeenCalled();
      expect(orderBy).toHaveBeenCalledWith('submittedAt', 'desc');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('eval-001');
    });

    it('programId 필터로 평가를 조회한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'eval-001', data: mockEvaluationData },
        ]) as never
      );

      await getEvaluations({ programId: 'prog-001' });

      expect(where).toHaveBeenCalledWith('programId', '==', 'prog-001');
    });

    it('evaluationType 필터로 평가를 조회한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'eval-001', data: mockEvaluationData },
        ]) as never
      );

      await getEvaluations({ evaluationType: 'reaction' });

      expect(where).toHaveBeenCalledWith('evaluationType', '==', 'reaction');
    });

    it('status 필터로 평가를 조회한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'eval-001', data: mockEvaluationData },
        ]) as never
      );

      await getEvaluations({ status: 'submitted' });

      expect(where).toHaveBeenCalledWith('status', '==', 'submitted');
    });

    it('search 필터로 프로그램명 기반 검색을 수행한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'eval-001', data: { ...mockEvaluationData, programName: 'Safety Training' } },
          { id: 'eval-002', data: { ...mockEvaluationData, id: 'eval-002', programName: 'Quality Control' } },
        ]) as never
      );

      const result = await getEvaluations({ search: 'safety' });

      expect(result).toHaveLength(1);
      expect(result[0].programName).toBe('Safety Training');
    });

    it('search 필터로 직원명 기반 검색을 수행한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'eval-001', data: { ...mockEvaluationData, employeeName: 'Nguyen Van A' } },
          { id: 'eval-002', data: { ...mockEvaluationData, id: 'eval-002', employeeName: 'Tran Thi B' } },
        ]) as never
      );

      const result = await getEvaluations({ search: 'nguyen' });

      expect(result).toHaveLength(1);
      expect(result[0].employeeName).toBe('Nguyen Van A');
    });

    it('search 필터로 부서명 기반 검색을 수행한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'eval-001', data: { ...mockEvaluationData, department: 'Production' } },
          { id: 'eval-002', data: { ...mockEvaluationData, id: 'eval-002', department: 'Quality' } },
        ]) as never
      );

      const result = await getEvaluations({ search: 'production' });

      expect(result).toHaveLength(1);
      expect(result[0].department).toBe('Production');
    });

    it('여러 필터를 동시에 적용할 수 있다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'eval-001', data: mockEvaluationData },
        ]) as never
      );

      await getEvaluations({
        programId: 'prog-001',
        evaluationType: 'reaction',
        status: 'submitted',
      });

      expect(where).toHaveBeenCalledWith('programId', '==', 'prog-001');
      expect(where).toHaveBeenCalledWith('evaluationType', '==', 'reaction');
      expect(where).toHaveBeenCalledWith('status', '==', 'submitted');
    });

    it('빈 결과를 반환할 수 있다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([]) as never
      );

      const result = await getEvaluations();

      expect(result).toHaveLength(0);
    });
  });

  describe('getEvaluation', () => {
    it('ID로 평가를 조회한다', async () => {
      vi.mocked(getDoc).mockResolvedValue(
        createMockDocSnapshot('eval-001', mockEvaluationData) as never
      );

      const result = await getEvaluation('eval-001');

      expect(doc).toHaveBeenCalled();
      expect(result).not.toBeNull();
      expect(result!.id).toBe('eval-001');
      expect(result!.programName).toBe('Safety Training');
      expect(result!.evaluationType).toBe('reaction');
    });

    it('존재하지 않는 평가는 null을 반환한다', async () => {
      vi.mocked(getDoc).mockResolvedValue(
        createMockDocSnapshot('nonexistent', {}, false) as never
      );

      const result = await getEvaluation('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getEvaluationsByProgram', () => {
    it('프로그램 ID로 평가 목록을 조회한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'eval-001', data: mockEvaluationData },
          { id: 'eval-002', data: { ...mockEvaluationData, id: 'eval-002' } },
        ]) as never
      );

      const result = await getEvaluationsByProgram('prog-001');

      expect(where).toHaveBeenCalledWith('programId', '==', 'prog-001');
      expect(result).toHaveLength(2);
    });
  });

  // ----------------------------------------------------------
  // Write Operations
  // ----------------------------------------------------------

  describe('createEvaluation', () => {
    it('새 평가를 생성한다', async () => {
      vi.mocked(setDoc).mockResolvedValue(undefined as never);

      const input: Omit<TrainingEvaluation, 'submittedAt'> = {
        id: 'eval-new',
        programId: 'prog-001',
        programName: 'Safety Training',
        sessionId: 'sess-001',
        sessionDate: '2024-02-01',
        employeeId: 'emp-002',
        employeeName: 'Tran Thi B',
        department: 'Quality',
        evaluationType: 'learning',
        responses: [
          { criteriaId: 'crit-001', score: 5 },
        ],
        overallScore: 5.0,
        feedback: 'Excellent training content.',
        status: 'submitted',
      };

      const result = await createEvaluation(input);

      expect(doc).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        expect.objectContaining({
          ...input,
          submittedAt: 'SERVER_TIMESTAMP',
        })
      );
      expect(result.id).toBe('eval-new');
      expect(result.programName).toBe('Safety Training');
      expect(result.submittedAt).toBeTruthy();
    });
  });

  describe('updateEvaluation', () => {
    it('평가를 업데이트한다', async () => {
      vi.mocked(updateDoc).mockResolvedValue(undefined as never);

      await updateEvaluation('eval-001', {
        status: 'reviewed',
        overallScore: 4.5,
      });

      expect(doc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        expect.objectContaining({
          status: 'reviewed',
          overallScore: 4.5,
          updatedAt: 'SERVER_TIMESTAMP',
        })
      );
    });

    it('피드백만 업데이트할 수 있다', async () => {
      vi.mocked(updateDoc).mockResolvedValue(undefined as never);

      await updateEvaluation('eval-001', {
        feedback: 'Updated feedback',
      });

      expect(updateDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        expect.objectContaining({
          feedback: 'Updated feedback',
          updatedAt: 'SERVER_TIMESTAMP',
        })
      );
    });
  });
});
