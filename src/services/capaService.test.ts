/**
 * CAPA Service Tests
 * capaService.ts 의 핵심 비즈니스 로직 단위 테스트
 *
 * 테스트 대상:
 * - createCAPA: CAPA 생성 + 번호 자동 생성
 * - updateCAPAStage: 단계 전환 (유효한 전환만 허용) + 단계별 데이터 검증
 * - VALID_TRANSITIONS: 전환 규칙 검증
 * - getCAPAs: 필터링 조회
 * - getCAPA: 단건 조회
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase module - Timestamp must be a class for instanceof checks
vi.mock('@/services/firebase', () => {
  class MockTimestamp {
    private _date: Date;
    constructor(date?: Date) {
      this._date = date || new Date('2024-06-15T00:00:00Z');
    }
    toDate() {
      return this._date;
    }
    static fromDate(d: Date) {
      return new MockTimestamp(d);
    }
    static now() {
      return new MockTimestamp(new Date('2024-06-15T00:00:00Z'));
    }
  }

  return {
    db: {},
    doc: vi.fn(() => 'mock-doc-ref'),
    collection: vi.fn(() => 'mock-collection-ref'),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    query: vi.fn(() => 'mock-query'),
    where: vi.fn(() => 'mock-where'),
    orderBy: vi.fn(() => 'mock-orderBy'),
    limit: vi.fn(() => 'mock-limit'),
    serverTimestamp: vi.fn(() => 'SERVER_TIMESTAMP'),
    writeBatch: vi.fn(),
    Timestamp: MockTimestamp,
  };
});

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
  createCAPA,
  updateCAPAStage,
  getCAPA,
  getCAPAs,
} from '@/services/capaService';

import {
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
} from '@/services/firebase';

import type { CAPAStatus } from '@/types/capa';

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

const baseCAPAInput = {
  title: 'Test CAPA',
  description: 'Test CAPA description',
  type: 'corrective' as const,
  severity: 'major' as const,
  priority: 'high' as const,
  source: 'internal' as const,
  discovery: {
    problemDescription: 'Test problem',
    source: 'internal' as const,
    discoveredBy: 'admin',
    affectedArea: 'Production Line A',
  },
  owner: 'admin-user',
};

// Existing CAPA data for each stage (with required fields for validation)
const discoveryStageData = {
  status: 'discovery',
  discovery: {
    problemDescription: 'Test problem',
    immediateActions: 'Stop production line',
    affectedArea: 'Line A',
  },
};

const investigationStageData = {
  status: 'investigation',
  discovery: discoveryStageData.discovery,
  investigation: {
    rootCauseAnalysis: '5 Why analysis result',
    impactAssessment: 'Affects Line A',
    investigatedBy: 'inspector-001',
    findings: 'Training gap identified',
  },
};

const actionStageData = {
  ...investigationStageData,
  status: 'action',
  action: {
    correctiveActions: [{ id: 'act-1', description: 'Retrain workers', assignedTo: 'trainer-001', status: 'pending' }],
    preventiveActions: [],
    plannedBy: 'admin',
  },
};

const verificationStageData = {
  ...actionStageData,
  status: 'verification',
  verification: {
    verificationMethod: 'Re-inspection',
    effectivenessScore: 85,
    isEffective: true,
    verifiedBy: 'qa-001',
    verificationNotes: 'Effective',
  },
};

// ============================================================
// Tests
// ============================================================

describe('capaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----------------------------------------------------------
  // createCAPA
  // ----------------------------------------------------------

  describe('createCAPA', () => {
    it('CAPA를 생성하고 document ID를 반환한다', async () => {
      vi.mocked(addDoc).mockResolvedValue({ id: 'new-capa-id' } as never);

      const result = await createCAPA(baseCAPAInput);

      expect(result).toBe('new-capa-id');
      expect(addDoc).toHaveBeenCalledTimes(1);
    });

    it('CAPA 번호가 CAPA-{year}-{3자리} 형식으로 자동 생성된다', async () => {
      vi.mocked(addDoc).mockResolvedValue({ id: 'new-capa-id' } as never);

      await createCAPA(baseCAPAInput);

      const savedData = vi.mocked(addDoc).mock.calls[0][1] as Record<string, unknown>;
      expect(savedData.capaNumber).toMatch(/^CAPA-\d{4}-\d{3}$/);
    });

    it('초기 상태는 discovery이다', async () => {
      vi.mocked(addDoc).mockResolvedValue({ id: 'new-capa-id' } as never);

      await createCAPA(baseCAPAInput);

      const savedData = vi.mocked(addDoc).mock.calls[0][1] as Record<string, unknown>;
      expect(savedData.status).toBe('discovery');
    });

    it('serverTimestamp로 createdAt/updatedAt를 설정한다', async () => {
      vi.mocked(addDoc).mockResolvedValue({ id: 'new-capa-id' } as never);

      await createCAPA(baseCAPAInput);

      const savedData = vi.mocked(addDoc).mock.calls[0][1] as Record<string, unknown>;
      expect(savedData.createdAt).toBe('SERVER_TIMESTAMP');
      expect(savedData.updatedAt).toBe('SERVER_TIMESTAMP');
    });

    it('dueDate가 있으면 Timestamp.fromDate로 변환한다', async () => {
      vi.mocked(addDoc).mockResolvedValue({ id: 'new-capa-id' } as never);
      const dueDate = new Date('2024-07-15');

      await createCAPA({ ...baseCAPAInput, dueDate });

      const savedData = vi.mocked(addDoc).mock.calls[0][1] as Record<string, unknown>;
      expect(savedData.dueDate).not.toBeNull();
    });

    it('dueDate가 없으면 null로 설정한다', async () => {
      vi.mocked(addDoc).mockResolvedValue({ id: 'new-capa-id' } as never);

      await createCAPA(baseCAPAInput);

      const savedData = vi.mocked(addDoc).mock.calls[0][1] as Record<string, unknown>;
      expect(savedData.dueDate).toBeNull();
    });

    it('team이 없으면 빈 배열로 설정한다', async () => {
      vi.mocked(addDoc).mockResolvedValue({ id: 'new-capa-id' } as never);

      await createCAPA(baseCAPAInput);

      const savedData = vi.mocked(addDoc).mock.calls[0][1] as Record<string, unknown>;
      expect(savedData.team).toEqual([]);
    });
  });

  // ----------------------------------------------------------
  // updateCAPAStage: 유효한 전환
  // ----------------------------------------------------------

  describe('updateCAPAStage - 유효한 전환', () => {
    it('discovery → investigation 전환을 허용한다 (immediateActions 존재 시)', async () => {
      vi.mocked(getDoc).mockResolvedValue(
        createMockDocSnapshot('capa-001', discoveryStageData) as never
      );
      vi.mocked(updateDoc).mockResolvedValue(undefined as never);

      await expect(
        updateCAPAStage('capa-001', {
          status: 'investigation',
          investigation: {
            rootCauseAnalysis: '5 Why analysis',
            impactAssessment: 'Impact on line A',
            investigatedBy: 'inspector-001',
            findings: 'Root cause found',
          },
        })
      ).resolves.not.toThrow();

      expect(updateDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        expect.objectContaining({ status: 'investigation' })
      );
    });

    it('discovery → rejected 전환을 허용한다 (검증 스킵)', async () => {
      vi.mocked(getDoc).mockResolvedValue(
        createMockDocSnapshot('capa-001', { status: 'discovery' }) as never
      );
      vi.mocked(updateDoc).mockResolvedValue(undefined as never);

      await expect(
        updateCAPAStage('capa-001', { status: 'rejected' })
      ).resolves.not.toThrow();
    });

    it('investigation → action 전환을 허용한다 (rootCauseAnalysis 존재 시)', async () => {
      vi.mocked(getDoc).mockResolvedValue(
        createMockDocSnapshot('capa-001', investigationStageData) as never
      );
      vi.mocked(updateDoc).mockResolvedValue(undefined as never);

      await expect(
        updateCAPAStage('capa-001', { status: 'action' })
      ).resolves.not.toThrow();
    });

    it('investigation → rejected 전환을 허용한다', async () => {
      vi.mocked(getDoc).mockResolvedValue(
        createMockDocSnapshot('capa-001', { status: 'investigation' }) as never
      );
      vi.mocked(updateDoc).mockResolvedValue(undefined as never);

      await expect(
        updateCAPAStage('capa-001', { status: 'rejected' })
      ).resolves.not.toThrow();
    });

    it('action → verification 전환을 허용한다 (조치 항목 존재 시)', async () => {
      vi.mocked(getDoc).mockResolvedValue(
        createMockDocSnapshot('capa-001', actionStageData) as never
      );
      vi.mocked(updateDoc).mockResolvedValue(undefined as never);

      await expect(
        updateCAPAStage('capa-001', { status: 'verification' })
      ).resolves.not.toThrow();
    });

    it('action → rejected 전환을 허용한다', async () => {
      vi.mocked(getDoc).mockResolvedValue(
        createMockDocSnapshot('capa-001', { status: 'action' }) as never
      );
      vi.mocked(updateDoc).mockResolvedValue(undefined as never);

      await expect(
        updateCAPAStage('capa-001', { status: 'rejected' })
      ).resolves.not.toThrow();
    });

    it('verification → closed 전환을 허용한다 (effectivenessScore 존재 시)', async () => {
      vi.mocked(getDoc).mockResolvedValue(
        createMockDocSnapshot('capa-001', verificationStageData) as never
      );
      vi.mocked(updateDoc).mockResolvedValue(undefined as never);

      await expect(
        updateCAPAStage('capa-001', {
          status: 'closed',
          closure: {
            finalReview: '최종 검토 완료',
            documentationComplete: true,
            knowledgeShared: true,
            closedBy: 'admin',
            closureNotes: '정상 종료',
          },
        })
      ).resolves.not.toThrow();
    });

    it('verification → action 전환을 허용한다 (검증 실패 시 되돌아감)', async () => {
      vi.mocked(getDoc).mockResolvedValue(
        createMockDocSnapshot('capa-001', verificationStageData) as never
      );
      vi.mocked(updateDoc).mockResolvedValue(undefined as never);

      await expect(
        updateCAPAStage('capa-001', { status: 'action' })
      ).resolves.not.toThrow();
    });
  });

  // ----------------------------------------------------------
  // updateCAPAStage: 무효한 전환
  // ----------------------------------------------------------

  describe('updateCAPAStage - 무효한 전환', () => {
    const invalidTransitions: Array<[CAPAStatus, CAPAStatus]> = [
      ['discovery', 'action'],
      ['discovery', 'verification'],
      ['discovery', 'closed'],
      ['investigation', 'closed'],
      ['investigation', 'discovery'],
      ['action', 'discovery'],
      ['action', 'investigation'],
      ['closed', 'discovery'],
      ['closed', 'investigation'],
      ['closed', 'action'],
      ['closed', 'verification'],
      ['rejected', 'discovery'],
      ['rejected', 'investigation'],
    ];

    it.each(invalidTransitions)(
      '%s → %s 전환을 거부한다',
      async (from, to) => {
        vi.mocked(getDoc).mockResolvedValue(
          createMockDocSnapshot('capa-001', { status: from }) as never
        );

        await expect(
          updateCAPAStage('capa-001', { status: to })
        ).rejects.toThrow(/Invalid CAPA transition/);

        expect(updateDoc).not.toHaveBeenCalled();
      }
    );
  });

  // ----------------------------------------------------------
  // updateCAPAStage: 단계별 데이터 검증
  // ----------------------------------------------------------

  describe('updateCAPAStage - 데이터 검증', () => {
    it('discovery → investigation: immediateActions 없으면 거부한다', async () => {
      vi.mocked(getDoc).mockResolvedValue(
        createMockDocSnapshot('capa-001', {
          status: 'discovery',
          discovery: { problemDescription: 'Test' }, // immediateActions 없음
        }) as never
      );

      await expect(
        updateCAPAStage('capa-001', { status: 'investigation' })
      ).rejects.toThrow(/Immediate action is required/);
    });

    it('investigation → action: rootCauseAnalysis 없으면 거부한다', async () => {
      vi.mocked(getDoc).mockResolvedValue(
        createMockDocSnapshot('capa-001', {
          status: 'investigation',
          investigation: { findings: 'Some findings' }, // rootCauseAnalysis 없음
        }) as never
      );

      await expect(
        updateCAPAStage('capa-001', { status: 'action' })
      ).rejects.toThrow(/Root cause analysis is required/);
    });

    it('action → verification: 조치 항목이 없으면 거부한다', async () => {
      vi.mocked(getDoc).mockResolvedValue(
        createMockDocSnapshot('capa-001', {
          status: 'action',
          action: { correctiveActions: [], preventiveActions: [] }, // 빈 조치
        }) as never
      );

      await expect(
        updateCAPAStage('capa-001', { status: 'verification' })
      ).rejects.toThrow(/At least one action item is required/);
    });

    it('verification → closed: effectivenessScore 없으면 거부한다', async () => {
      vi.mocked(getDoc).mockResolvedValue(
        createMockDocSnapshot('capa-001', {
          status: 'verification',
          verification: { isEffective: true }, // effectivenessScore 없음
        }) as never
      );

      await expect(
        updateCAPAStage('capa-001', { status: 'closed' })
      ).rejects.toThrow(/Effectiveness score is required/);
    });

    it('존재하지 않는 CAPA에 대해 에러를 던진다', async () => {
      vi.mocked(getDoc).mockResolvedValue(
        createMockDocSnapshot('capa-999', {}, false) as never
      );

      await expect(
        updateCAPAStage('capa-999', { status: 'investigation' })
      ).rejects.toThrow(/CAPA not found/);
    });
  });

  // ----------------------------------------------------------
  // updateCAPAStage: 단계 데이터 저장
  // ----------------------------------------------------------

  describe('updateCAPAStage - 데이터 저장', () => {
    it('investigation 단계 데이터를 저장한다', async () => {
      vi.mocked(getDoc).mockResolvedValue(
        createMockDocSnapshot('capa-001', discoveryStageData) as never
      );
      vi.mocked(updateDoc).mockResolvedValue(undefined as never);

      await updateCAPAStage('capa-001', {
        status: 'investigation',
        investigation: {
          rootCauseAnalysis: '5 Why 분석 결과',
          investigationMethod: '5why',
          impactAssessment: '라인 A 전체 영향',
          investigatedBy: 'inspector-001',
          findings: '작업자 교육 부족',
        },
      });

      const updateData = vi.mocked(updateDoc).mock.calls[0][1] as Record<string, unknown>;
      expect(updateData.status).toBe('investigation');
      expect(updateData.investigation).toBeDefined();
      const investigation = updateData.investigation as Record<string, unknown>;
      expect(investigation.rootCauseAnalysis).toBe('5 Why 분석 결과');
      expect(investigation.investigatedAt).toBeDefined();
    });

    it('verification → closed 전환 시 closure 데이터를 저장한다', async () => {
      vi.mocked(getDoc).mockResolvedValue(
        createMockDocSnapshot('capa-001', verificationStageData) as never
      );
      vi.mocked(updateDoc).mockResolvedValue(undefined as never);

      await updateCAPAStage('capa-001', {
        status: 'closed',
        closure: {
          finalReview: '최종 검토 완료',
          documentationComplete: true,
          knowledgeShared: true,
          closedBy: 'admin',
          closureNotes: '정상 종료',
        },
      });

      const updateData = vi.mocked(updateDoc).mock.calls[0][1] as Record<string, unknown>;
      expect(updateData.status).toBe('closed');
      expect(updateData.closure).toBeDefined();
      const closure = updateData.closure as Record<string, unknown>;
      expect(closure.finalReview).toBe('최종 검토 완료');
      expect(closure.closedAt).toBeDefined();
    });
  });

  // ----------------------------------------------------------
  // getCAPA
  // ----------------------------------------------------------

  describe('getCAPA', () => {
    it('ID로 CAPA를 조회한다', async () => {
      vi.mocked(getDoc).mockResolvedValue(
        createMockDocSnapshot('capa-001', {
          capaNumber: 'CAPA-2024-001',
          title: 'Test CAPA',
          description: 'Description',
          type: 'corrective',
          status: 'discovery',
          severity: 'major',
          priority: 'high',
          source: 'internal',
          owner: 'admin',
          createdAt: new Date('2024-06-01'),
          updatedAt: new Date('2024-06-01'),
        }) as never
      );

      const result = await getCAPA('capa-001');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('capa-001');
      expect(result!.capaNumber).toBe('CAPA-2024-001');
      expect(result!.status).toBe('discovery');
    });

    it('존재하지 않는 ID로 조회하면 null을 반환한다', async () => {
      vi.mocked(getDoc).mockResolvedValue(
        createMockDocSnapshot('capa-999', {}, false) as never
      );

      const result = await getCAPA('capa-999');

      expect(result).toBeNull();
    });
  });

  // ----------------------------------------------------------
  // getCAPAs (필터링)
  // ----------------------------------------------------------

  describe('getCAPAs', () => {
    const makeCAPAData = (overrides: Record<string, unknown> = {}) => ({
      capaNumber: 'CAPA-2024-001',
      title: 'CAPA 1',
      description: 'Desc 1',
      type: 'corrective',
      status: 'discovery',
      severity: 'major',
      priority: 'high',
      source: 'internal',
      owner: 'admin',
      createdAt: new Date('2024-06-01'),
      updatedAt: new Date('2024-06-01'),
      ...overrides,
    });

    it('필터 없이 전체 CAPA를 조회한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'capa-001', data: makeCAPAData() },
        ]) as never
      );

      const results = await getCAPAs();

      expect(results).toHaveLength(1);
      expect(results[0].capaNumber).toBe('CAPA-2024-001');
    });

    it('search 필터로 제목/설명/번호를 검색한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'capa-001', data: makeCAPAData({ title: 'Stitching Defect' }) },
          { id: 'capa-002', data: makeCAPAData({ capaNumber: 'CAPA-2024-002', title: 'Other Issue', owner: 'user2' }) },
        ]) as never
      );

      const results = await getCAPAs({ search: 'stitching' });

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Stitching Defect');
    });

    it('owner 필터로 담당자별 CAPA를 조회한다', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        createMockQuerySnapshot([
          { id: 'capa-001', data: makeCAPAData() },
          { id: 'capa-002', data: makeCAPAData({ capaNumber: 'CAPA-2024-002', owner: 'other-user' }) },
        ]) as never
      );

      const results = await getCAPAs({ owner: 'admin' });

      expect(results).toHaveLength(1);
      expect(results[0].owner).toBe('admin');
    });
  });
});
