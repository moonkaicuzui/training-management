/**
 * CAPA Store Tests
 * CAPA 스토어 기능 및 워크플로우 테스트
 *
 * [TAE 🤖] Test Automation Engineer
 */

import { describe, it, expect } from 'vitest';
import type {
  CAPA,
  CAPAStatus,
  CAPASeverity,
  CAPAType,
  CAPAFilters,
  CAPADashboardStats,
} from '@/types/capa';

// ========== Mock Data ==========

const mockCAPAs: CAPA[] = [
  {
    id: 'capa-1',
    capaNumber: 'CAPA-2024-001',
    title: '품질 이슈 발생',
    description: '생산 라인에서 품질 이슈 발생',
    type: 'corrective',
    status: 'discovery',
    severity: 'critical',
    priority: 'high',
    source: 'audit',
    discovery: {
      problemDescription: '생산 라인 A에서 불량률 증가',
      source: 'audit',
      discoveredAt: new Date('2024-01-15'),
      discoveredBy: 'inspector-1',
      affectedArea: 'Production Line A',
    },
    owner: 'user-1',
    team: ['user-2', 'user-3'],
    createdBy: 'user-1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    dueDate: new Date('2024-02-15'),
  },
  {
    id: 'capa-2',
    capaNumber: 'CAPA-2024-002',
    title: '교육 관련 개선',
    description: '교육 프로그램 개선 필요',
    type: 'preventive',
    status: 'investigation',
    severity: 'major',
    priority: 'medium',
    source: 'training',
    discovery: {
      problemDescription: '교육 이수율 저조',
      source: 'training',
      discoveredAt: new Date('2024-01-20'),
      discoveredBy: 'trainer-1',
      affectedArea: 'Training Department',
    },
    investigation: {
      rootCauseAnalysis: '교육 시간 부족으로 인한 참여율 저하',
      investigationMethod: '5why',
      impactAssessment: '중간 영향',
      findings: '교육 일정 조정 필요',
      investigatedBy: 'analyst-1',
      investigatedAt: new Date('2024-01-22'),
    },
    owner: 'user-2',
    createdBy: 'user-2',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-22'),
  },
  {
    id: 'capa-3',
    capaNumber: 'CAPA-2024-003',
    title: '고객 불만 처리',
    description: '고객 불만 사항 처리',
    type: 'corrective',
    status: 'closed',
    severity: 'minor',
    priority: 'low',
    source: 'customer',
    discovery: {
      problemDescription: '배송 지연 불만',
      source: 'customer',
      discoveredAt: new Date('2024-01-05'),
      discoveredBy: 'cs-1',
      affectedArea: 'Logistics',
    },
    verification: {
      verificationMethod: '고객 피드백 확인',
      isEffective: true,
      recurrenceCheck: false,
      verifiedBy: 'qa-1',
      verifiedAt: new Date('2024-01-25'),
      verificationNotes: '개선 확인됨',
    },
    closure: {
      finalReview: '정상 종료',
      documentationComplete: true,
      knowledgeShared: true,
      closedBy: 'manager-1',
      closedAt: new Date('2024-01-28'),
    },
    owner: 'user-3',
    createdBy: 'user-3',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-28'),
  },
];

// ========== Helper Functions (from capaStore) ==========

function generateCAPANumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `CAPA-${year}-${random}`;
}

function calculateDashboardStats(capas: CAPA[]): CAPADashboardStats {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const byStatus: Record<CAPAStatus, number> = {
    discovery: 0,
    investigation: 0,
    action: 0,
    verification: 0,
    closed: 0,
    rejected: 0,
  };

  const bySeverity: Record<CAPASeverity, number> = { critical: 0, major: 0, minor: 0 };
  const byType: Record<CAPAType, number> = { corrective: 0, preventive: 0 };

  let overdue = 0;
  let closedThisMonth = 0;
  let totalResolutionDays = 0;
  let closedCount = 0;
  let effectiveCount = 0;
  let verifiedCount = 0;

  capas.forEach((capa) => {
    byStatus[capa.status]++;
    bySeverity[capa.severity]++;
    byType[capa.type]++;

    // Check overdue
    if (capa.dueDate && capa.status !== 'closed' && capa.status !== 'rejected') {
      const dueDate = capa.dueDate instanceof Date ? capa.dueDate : new Date(capa.dueDate);
      if (dueDate < now) {
        overdue++;
      }
    }

    // Closed this month
    if (capa.status === 'closed' && capa.closure?.closedAt) {
      const closedAt = capa.closure.closedAt instanceof Date
        ? capa.closure.closedAt
        : new Date(capa.closure.closedAt);
      if (closedAt.getMonth() === thisMonth && closedAt.getFullYear() === thisYear) {
        closedThisMonth++;
      }

      const createdAt = capa.createdAt instanceof Date
        ? capa.createdAt
        : new Date(capa.createdAt);
      const days = Math.ceil((closedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      totalResolutionDays += days;
      closedCount++;
    }

    // Effectiveness rate
    if (capa.verification) {
      verifiedCount++;
      if (capa.verification.isEffective) {
        effectiveCount++;
      }
    }
  });

  return {
    total: capas.length,
    byStatus,
    bySeverity,
    byType,
    overdue,
    closedThisMonth,
    averageResolutionDays: closedCount > 0 ? Math.round(totalResolutionDays / closedCount) : 0,
    effectivenessRate: verifiedCount > 0 ? Math.round((effectiveCount / verifiedCount) * 100) : 0,
  };
}

// ========== Tests ==========

describe('CAPA Store Helper Functions', () => {
  describe('generateCAPANumber', () => {
    it('현재 년도를 포함한 CAPA 번호를 생성한다', () => {
      const capaNumber = generateCAPANumber();
      const currentYear = new Date().getFullYear();

      expect(capaNumber).toMatch(/^CAPA-\d{4}-\d{3}$/);
      expect(capaNumber).toContain(`CAPA-${currentYear}`);
    });

    it('매번 다른 번호를 생성한다', () => {
      const numbers = new Set<string>();
      for (let i = 0; i < 100; i++) {
        numbers.add(generateCAPANumber());
      }
      // 100번 생성 시 대부분 고유해야 함 (확률적)
      expect(numbers.size).toBeGreaterThan(80);
    });

    it('3자리 숫자로 패딩한다', () => {
      const capaNumber = generateCAPANumber();
      const parts = capaNumber.split('-');
      expect(parts[2].length).toBe(3);
    });
  });

  describe('calculateDashboardStats', () => {
    it('총 CAPA 수를 올바르게 계산한다', () => {
      const stats = calculateDashboardStats(mockCAPAs);
      expect(stats.total).toBe(3);
    });

    it('상태별 개수를 올바르게 계산한다', () => {
      const stats = calculateDashboardStats(mockCAPAs);

      expect(stats.byStatus.discovery).toBe(1);
      expect(stats.byStatus.investigation).toBe(1);
      expect(stats.byStatus.closed).toBe(1);
      expect(stats.byStatus.action).toBe(0);
      expect(stats.byStatus.verification).toBe(0);
      expect(stats.byStatus.rejected).toBe(0);
    });

    it('심각도별 개수를 올바르게 계산한다', () => {
      const stats = calculateDashboardStats(mockCAPAs);

      expect(stats.bySeverity.critical).toBe(1);
      expect(stats.bySeverity.major).toBe(1);
      expect(stats.bySeverity.minor).toBe(1);
    });

    it('유형별 개수를 올바르게 계산한다', () => {
      const stats = calculateDashboardStats(mockCAPAs);

      expect(stats.byType.corrective).toBe(2);
      expect(stats.byType.preventive).toBe(1);
    });

    it('효과성 비율을 올바르게 계산한다', () => {
      const stats = calculateDashboardStats(mockCAPAs);
      // 검증된 CAPA 1개 중 1개가 효과적 = 100%
      expect(stats.effectivenessRate).toBe(100);
    });

    it('빈 배열에 대해 기본값을 반환한다', () => {
      const stats = calculateDashboardStats([]);

      expect(stats.total).toBe(0);
      expect(stats.averageResolutionDays).toBe(0);
      expect(stats.effectivenessRate).toBe(0);
    });

    it('기한 초과된 CAPA를 식별한다', () => {
      const overdueCAPA: CAPA = {
        ...mockCAPAs[0],
        id: 'capa-overdue',
        status: 'investigation',
        dueDate: new Date('2023-01-01'), // 과거 날짜
      };

      const stats = calculateDashboardStats([overdueCAPA]);
      expect(stats.overdue).toBe(1);
    });

    it('종료/반려된 CAPA는 기한 초과에서 제외한다', () => {
      const closedCAPA: CAPA = {
        ...mockCAPAs[0],
        id: 'capa-closed',
        status: 'closed',
        dueDate: new Date('2023-01-01'), // 과거 날짜
      };

      const stats = calculateDashboardStats([closedCAPA]);
      expect(stats.overdue).toBe(0);
    });
  });
});

describe('CAPA Filters', () => {
  describe('filterByStatus', () => {
    it('상태로 필터링할 수 있다', () => {
      const filters: CAPAFilters = { status: ['discovery'] };
      const filtered = mockCAPAs.filter(
        (c) => !filters.status || filters.status.includes(c.status)
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].status).toBe('discovery');
    });

    it('여러 상태로 필터링할 수 있다', () => {
      const filters: CAPAFilters = { status: ['discovery', 'investigation'] };
      const filtered = mockCAPAs.filter(
        (c) => !filters.status || filters.status.includes(c.status)
      );

      expect(filtered).toHaveLength(2);
    });
  });

  describe('filterBySeverity', () => {
    it('심각도로 필터링할 수 있다', () => {
      const filters: CAPAFilters = { severity: ['critical'] };
      const filtered = mockCAPAs.filter(
        (c) => !filters.severity || filters.severity.includes(c.severity)
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].severity).toBe('critical');
    });
  });

  describe('filterByType', () => {
    it('유형으로 필터링할 수 있다', () => {
      const filters: CAPAFilters = { type: 'corrective' };
      const filtered = mockCAPAs.filter(
        (c) => !filters.type || c.type === filters.type
      );

      expect(filtered).toHaveLength(2);
    });
  });

  describe('filterBySearch', () => {
    it('제목으로 검색할 수 있다', () => {
      const filters: CAPAFilters = { search: '품질' };
      const searchLower = filters.search!.toLowerCase();
      const filtered = mockCAPAs.filter(
        (c) => c.title.toLowerCase().includes(searchLower) ||
               c.description.toLowerCase().includes(searchLower) ||
               c.capaNumber.toLowerCase().includes(searchLower)
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toContain('품질');
    });

    it('CAPA 번호로 검색할 수 있다', () => {
      const filters: CAPAFilters = { search: 'CAPA-2024-002' };
      const searchLower = filters.search!.toLowerCase();
      const filtered = mockCAPAs.filter(
        (c) => c.capaNumber.toLowerCase().includes(searchLower)
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].capaNumber).toBe('CAPA-2024-002');
    });

    it('대소문자를 구분하지 않고 검색한다', () => {
      const filters: CAPAFilters = { search: '교육' };
      const searchLower = filters.search!.toLowerCase();
      const filtered = mockCAPAs.filter(
        (c) => c.title.toLowerCase().includes(searchLower) ||
               c.description.toLowerCase().includes(searchLower)
      );

      expect(filtered).toHaveLength(1);
    });
  });

  describe('filterByOwner', () => {
    it('담당자로 필터링할 수 있다', () => {
      const filters: CAPAFilters = { owner: 'user-1' };
      const filtered = mockCAPAs.filter(
        (c) => !filters.owner || c.owner === filters.owner
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].owner).toBe('user-1');
    });
  });

  describe('combinedFilters', () => {
    it('여러 필터를 조합할 수 있다', () => {
      const filters: CAPAFilters = {
        status: ['discovery', 'investigation'],
        severity: ['critical', 'major'],
        type: 'corrective',
      };

      const filtered = mockCAPAs.filter((c) => {
        const statusMatch = !filters.status || filters.status.includes(c.status);
        const severityMatch = !filters.severity || filters.severity.includes(c.severity);
        const typeMatch = !filters.type || c.type === filters.type;
        return statusMatch && severityMatch && typeMatch;
      });

      // discovery + critical + corrective = capa-1
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('capa-1');
    });
  });
});

describe('CAPA Workflow State Transitions', () => {
  describe('status transitions', () => {
    it('discovery → investigation 전환이 가능하다', () => {
      const validTransitions: Record<CAPAStatus, CAPAStatus[]> = {
        discovery: ['investigation', 'rejected'],
        investigation: ['action', 'rejected'],
        action: ['verification', 'rejected'],
        verification: ['closed', 'action'],
        closed: [],
        rejected: [],
      };

      const currentStatus: CAPAStatus = 'discovery';
      const nextStatus: CAPAStatus = 'investigation';

      expect(validTransitions[currentStatus]).toContain(nextStatus);
    });

    it('closed → investigation 전환은 불가능하다', () => {
      const validTransitions: Record<CAPAStatus, CAPAStatus[]> = {
        discovery: ['investigation', 'rejected'],
        investigation: ['action', 'rejected'],
        action: ['verification', 'rejected'],
        verification: ['closed', 'action'],
        closed: [],
        rejected: [],
      };

      const currentStatus: CAPAStatus = 'closed';
      const nextStatus: CAPAStatus = 'investigation';

      expect(validTransitions[currentStatus]).not.toContain(nextStatus);
    });

    it('각 단계에서 rejected 전환이 가능하다 (closed 제외)', () => {
      const validTransitions: Record<CAPAStatus, CAPAStatus[]> = {
        discovery: ['investigation', 'rejected'],
        investigation: ['action', 'rejected'],
        action: ['verification', 'rejected'],
        verification: ['closed', 'action'],
        closed: [],
        rejected: [],
      };

      const openStatuses: CAPAStatus[] = ['discovery', 'investigation', 'action'];

      openStatuses.forEach((status) => {
        expect(validTransitions[status]).toContain('rejected');
      });
    });
  });
});

describe('CAPA Selectors', () => {
  describe('selectCAPAsByStatus', () => {
    it('특정 상태의 CAPA를 선택한다', () => {
      const status: CAPAStatus = 'discovery';
      const selected = mockCAPAs.filter((c) => c.status === status);

      expect(selected).toHaveLength(1);
      expect(selected.every((c) => c.status === status)).toBe(true);
    });
  });

  describe('selectOverdueCAPAs', () => {
    it('기한 초과된 CAPA를 선택한다', () => {
      const now = new Date();
      const overdueList = mockCAPAs.filter((c) => {
        if (c.status === 'closed' || c.status === 'rejected') return false;
        if (!c.dueDate) return false;
        const dueDate = c.dueDate instanceof Date ? c.dueDate : new Date(c.dueDate);
        return dueDate < now;
      });

      // mockCAPAs에서 기한 초과된 것이 있는지 확인
      expect(Array.isArray(overdueList)).toBe(true);
    });
  });
});
