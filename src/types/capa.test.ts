/**
 * CAPA Types Tests
 * CAPA 타입 및 상수 유효성 검증 테스트
 *
 * [TAE 🤖] Test Automation Engineer
 */

import { describe, it, expect } from 'vitest';
import {
  CAPA_STATUS_ORDER,
  CAPA_STATUS_LABELS,
  CAPA_SEVERITY_LABELS,
  CAPA_PRIORITY_LABELS,
  CAPA_SOURCE_LABELS,
  CAPA_TYPE_LABELS,
  type CAPAStatus,
  type CAPASeverity,
  type CAPAPriority,
  type CAPASource,
  type CAPAType,
  type CAPA,
  type CAPAInput,
  type CAPAUpdate,
  type CAPAStageUpdate,
  type CAPAFilters,
  type ActionItem,
} from './capa';

// ========== Type Guard Functions ==========

function isValidCAPAStatus(value: string): value is CAPAStatus {
  return ['discovery', 'investigation', 'action', 'verification', 'closed', 'rejected'].includes(value);
}

function isValidCAPASeverity(value: string): value is CAPASeverity {
  return ['critical', 'major', 'minor'].includes(value);
}

function isValidCAPAPriority(value: string): value is CAPAPriority {
  return ['high', 'medium', 'low'].includes(value);
}

function isValidCAPASource(value: string): value is CAPASource {
  return ['audit', 'customer', 'internal', 'supplier', 'process', 'training'].includes(value);
}

function isValidCAPAType(value: string): value is CAPAType {
  return ['corrective', 'preventive'].includes(value);
}

// ========== Tests ==========

describe('CAPAStatus Type', () => {
  const validStatuses: CAPAStatus[] = ['discovery', 'investigation', 'action', 'verification', 'closed', 'rejected'];

  it.each(validStatuses)('"%s"는 유효한 CAPAStatus이다', (status) => {
    expect(isValidCAPAStatus(status)).toBe(true);
  });

  it('잘못된 상태값은 유효하지 않다', () => {
    expect(isValidCAPAStatus('invalid')).toBe(false);
    expect(isValidCAPAStatus('open')).toBe(false);
    expect(isValidCAPAStatus('')).toBe(false);
    expect(isValidCAPAStatus('DISCOVERY')).toBe(false); // 대소문자 구분
  });
});

describe('CAPASeverity Type', () => {
  const validSeverities: CAPASeverity[] = ['critical', 'major', 'minor'];

  it.each(validSeverities)('"%s"는 유효한 CAPASeverity이다', (severity) => {
    expect(isValidCAPASeverity(severity)).toBe(true);
  });

  it('잘못된 심각도는 유효하지 않다', () => {
    expect(isValidCAPASeverity('high')).toBe(false);
    expect(isValidCAPASeverity('low')).toBe(false);
    expect(isValidCAPASeverity('severe')).toBe(false);
  });
});

describe('CAPAPriority Type', () => {
  const validPriorities: CAPAPriority[] = ['high', 'medium', 'low'];

  it.each(validPriorities)('"%s"는 유효한 CAPAPriority이다', (priority) => {
    expect(isValidCAPAPriority(priority)).toBe(true);
  });

  it('잘못된 우선순위는 유효하지 않다', () => {
    expect(isValidCAPAPriority('critical')).toBe(false);
    expect(isValidCAPAPriority('urgent')).toBe(false);
    expect(isValidCAPAPriority('normal')).toBe(false);
  });
});

describe('CAPASource Type', () => {
  const validSources: CAPASource[] = ['audit', 'customer', 'internal', 'supplier', 'process', 'training'];

  it.each(validSources)('"%s"는 유효한 CAPASource이다', (source) => {
    expect(isValidCAPASource(source)).toBe(true);
  });

  it('잘못된 출처는 유효하지 않다', () => {
    expect(isValidCAPASource('external')).toBe(false);
    expect(isValidCAPASource('management')).toBe(false);
    expect(isValidCAPASource('qa')).toBe(false);
  });
});

describe('CAPAType Type', () => {
  const validTypes: CAPAType[] = ['corrective', 'preventive'];

  it.each(validTypes)('"%s"는 유효한 CAPAType이다', (type) => {
    expect(isValidCAPAType(type)).toBe(true);
  });

  it('잘못된 유형은 유효하지 않다', () => {
    expect(isValidCAPAType('reactive')).toBe(false);
    expect(isValidCAPAType('proactive')).toBe(false);
    expect(isValidCAPAType('both')).toBe(false);
  });
});

describe('CAPA_STATUS_ORDER Constant', () => {
  it('5단계 워크플로우 순서를 포함한다', () => {
    expect(CAPA_STATUS_ORDER).toEqual([
      'discovery',
      'investigation',
      'action',
      'verification',
      'closed',
    ]);
  });

  it('rejected는 워크플로우 순서에 포함되지 않는다', () => {
    expect(CAPA_STATUS_ORDER).not.toContain('rejected');
  });

  it('5개의 상태를 가진다', () => {
    expect(CAPA_STATUS_ORDER).toHaveLength(5);
  });
});

describe('CAPA Label Constants', () => {
  describe('CAPA_STATUS_LABELS', () => {
    it('모든 상태에 대한 레이블이 있다', () => {
      const statuses: CAPAStatus[] = ['discovery', 'investigation', 'action', 'verification', 'closed', 'rejected'];

      statuses.forEach((status) => {
        expect(CAPA_STATUS_LABELS[status]).toBeDefined();
        expect(typeof CAPA_STATUS_LABELS[status]).toBe('string');
        expect(CAPA_STATUS_LABELS[status].length).toBeGreaterThan(0);
      });
    });

    it('한국어 레이블을 가진다', () => {
      expect(CAPA_STATUS_LABELS.discovery).toBe('발견');
      expect(CAPA_STATUS_LABELS.investigation).toBe('조사');
      expect(CAPA_STATUS_LABELS.action).toBe('조치');
      expect(CAPA_STATUS_LABELS.verification).toBe('검증');
      expect(CAPA_STATUS_LABELS.closed).toBe('종료');
      expect(CAPA_STATUS_LABELS.rejected).toBe('반려');
    });
  });

  describe('CAPA_SEVERITY_LABELS', () => {
    it('모든 심각도에 대한 레이블이 있다', () => {
      const severities: CAPASeverity[] = ['critical', 'major', 'minor'];

      severities.forEach((severity) => {
        expect(CAPA_SEVERITY_LABELS[severity]).toBeDefined();
        expect(typeof CAPA_SEVERITY_LABELS[severity]).toBe('string');
      });
    });

    it('한국어 레이블을 가진다', () => {
      expect(CAPA_SEVERITY_LABELS.critical).toBe('심각');
      expect(CAPA_SEVERITY_LABELS.major).toBe('중대');
      expect(CAPA_SEVERITY_LABELS.minor).toBe('경미');
    });
  });

  describe('CAPA_PRIORITY_LABELS', () => {
    it('모든 우선순위에 대한 레이블이 있다', () => {
      const priorities: CAPAPriority[] = ['high', 'medium', 'low'];

      priorities.forEach((priority) => {
        expect(CAPA_PRIORITY_LABELS[priority]).toBeDefined();
        expect(typeof CAPA_PRIORITY_LABELS[priority]).toBe('string');
      });
    });

    it('한국어 레이블을 가진다', () => {
      expect(CAPA_PRIORITY_LABELS.high).toBe('높음');
      expect(CAPA_PRIORITY_LABELS.medium).toBe('보통');
      expect(CAPA_PRIORITY_LABELS.low).toBe('낮음');
    });
  });

  describe('CAPA_SOURCE_LABELS', () => {
    it('모든 출처에 대한 레이블이 있다', () => {
      const sources: CAPASource[] = ['audit', 'customer', 'internal', 'supplier', 'process', 'training'];

      sources.forEach((source) => {
        expect(CAPA_SOURCE_LABELS[source]).toBeDefined();
        expect(typeof CAPA_SOURCE_LABELS[source]).toBe('string');
      });
    });

    it('한국어 레이블을 가진다', () => {
      expect(CAPA_SOURCE_LABELS.audit).toBe('감사');
      expect(CAPA_SOURCE_LABELS.customer).toBe('고객 불만');
      expect(CAPA_SOURCE_LABELS.internal).toBe('내부 발견');
      expect(CAPA_SOURCE_LABELS.supplier).toBe('공급업체');
      expect(CAPA_SOURCE_LABELS.process).toBe('공정 이상');
      expect(CAPA_SOURCE_LABELS.training).toBe('교육 관련');
    });
  });

  describe('CAPA_TYPE_LABELS', () => {
    it('모든 유형에 대한 레이블이 있다', () => {
      const types: CAPAType[] = ['corrective', 'preventive'];

      types.forEach((type) => {
        expect(CAPA_TYPE_LABELS[type]).toBeDefined();
        expect(typeof CAPA_TYPE_LABELS[type]).toBe('string');
      });
    });

    it('한국어 레이블을 가진다', () => {
      expect(CAPA_TYPE_LABELS.corrective).toBe('시정조치');
      expect(CAPA_TYPE_LABELS.preventive).toBe('예방조치');
    });
  });
});

describe('CAPAInput Interface Validation', () => {
  it('필수 필드가 모두 있는 입력을 검증한다', () => {
    const validInput: CAPAInput = {
      title: '테스트 CAPA',
      description: '테스트 설명',
      type: 'corrective',
      severity: 'major',
      priority: 'high',
      source: 'audit',
      discovery: {
        problemDescription: '문제 설명',
        source: 'audit',
        discoveredBy: 'user-1',
        affectedArea: '영역 A',
      },
      owner: 'user-1',
    };

    expect(validInput.title).toBeDefined();
    expect(validInput.description).toBeDefined();
    expect(isValidCAPAType(validInput.type)).toBe(true);
    expect(isValidCAPASeverity(validInput.severity)).toBe(true);
    expect(isValidCAPAPriority(validInput.priority)).toBe(true);
    expect(isValidCAPASource(validInput.source)).toBe(true);
    expect(validInput.owner).toBeDefined();
  });

  it('선택적 필드도 올바르게 처리한다', () => {
    const inputWithOptionals: CAPAInput = {
      title: '테스트 CAPA',
      description: '테스트 설명',
      type: 'preventive',
      severity: 'minor',
      priority: 'low',
      source: 'training',
      discovery: {
        problemDescription: '문제 설명',
        source: 'training',
        discoveredBy: 'user-1',
        affectedArea: '영역 B',
        affectedProducts: ['Product A', 'Product B'],
        immediateActions: '즉각 조치',
        attachments: ['file1.pdf'],
      },
      dueDate: new Date('2024-12-31'),
      owner: 'user-2',
      team: ['user-3', 'user-4'],
      relatedTrainingPrograms: ['PROG-001'],
    };

    expect(inputWithOptionals.dueDate).toBeInstanceOf(Date);
    expect(inputWithOptionals.team).toHaveLength(2);
    expect(inputWithOptionals.relatedTrainingPrograms).toHaveLength(1);
  });
});

describe('CAPAUpdate Interface Validation', () => {
  it('부분 업데이트를 허용한다', () => {
    const update: CAPAUpdate = {
      title: '수정된 제목',
    };

    expect(update.title).toBe('수정된 제목');
    expect(update.description).toBeUndefined();
    expect(update.severity).toBeUndefined();
  });

  it('여러 필드를 동시에 업데이트할 수 있다', () => {
    const update: CAPAUpdate = {
      title: '수정된 제목',
      description: '수정된 설명',
      severity: 'critical',
      priority: 'high',
      owner: 'new-owner',
      team: ['member-1', 'member-2'],
    };

    expect(update.title).toBeDefined();
    expect(update.description).toBeDefined();
    expect(isValidCAPASeverity(update.severity!)).toBe(true);
    expect(isValidCAPAPriority(update.priority!)).toBe(true);
  });
});

describe('CAPAStageUpdate Interface Validation', () => {
  it('investigation 단계 업데이트를 검증한다', () => {
    const stageUpdate: CAPAStageUpdate = {
      status: 'investigation',
      investigation: {
        rootCauseAnalysis: '근본 원인 분석',
        investigationMethod: '5why',
        impactAssessment: '영향 평가',
        findings: '발견 사항',
        investigatedBy: 'analyst-1',
      },
    };

    expect(stageUpdate.status).toBe('investigation');
    expect(stageUpdate.investigation).toBeDefined();
    expect(stageUpdate.investigation!.rootCauseAnalysis).toBeDefined();
  });

  it('verification 단계 업데이트를 검증한다', () => {
    const stageUpdate: CAPAStageUpdate = {
      status: 'verification',
      verification: {
        verificationMethod: '검증 방법',
        isEffective: true,
        recurrenceCheck: false,
        verifiedBy: 'qa-1',
        verificationNotes: '검증 노트',
      },
    };

    expect(stageUpdate.status).toBe('verification');
    expect(stageUpdate.verification).toBeDefined();
    expect(stageUpdate.verification!.isEffective).toBe(true);
  });

  it('closure 단계 업데이트를 검증한다', () => {
    const stageUpdate: CAPAStageUpdate = {
      status: 'closed',
      closure: {
        finalReview: '최종 검토',
        documentationComplete: true,
        knowledgeShared: true,
        closedBy: 'manager-1',
        lessonsLearned: '교훈',
      },
    };

    expect(stageUpdate.status).toBe('closed');
    expect(stageUpdate.closure).toBeDefined();
    expect(stageUpdate.closure!.documentationComplete).toBe(true);
  });
});

describe('CAPAFilters Interface Validation', () => {
  it('빈 필터를 허용한다', () => {
    const filters: CAPAFilters = {};
    expect(Object.keys(filters)).toHaveLength(0);
  });

  it('단일 필터를 허용한다', () => {
    const filters: CAPAFilters = {
      status: ['discovery'],
    };
    expect(filters.status).toHaveLength(1);
  });

  it('복합 필터를 허용한다', () => {
    const filters: CAPAFilters = {
      status: ['discovery', 'investigation'],
      severity: ['critical', 'major'],
      type: 'corrective',
      source: ['audit', 'customer'],
      owner: 'user-1',
      search: '검색어',
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31'),
      },
    };

    expect(filters.status).toHaveLength(2);
    expect(filters.severity).toHaveLength(2);
    expect(filters.type).toBe('corrective');
    expect(filters.source).toHaveLength(2);
    expect(filters.dateRange?.start).toBeInstanceOf(Date);
  });
});

describe('ActionItem Interface Validation', () => {
  it('필수 필드가 있는 ActionItem을 검증한다', () => {
    const actionItem: ActionItem = {
      id: 'action-1',
      description: '조치 항목 설명',
      assignedTo: 'user-1',
      dueDate: new Date('2024-03-01'),
      status: 'pending',
    };

    expect(actionItem.id).toBeDefined();
    expect(actionItem.description).toBeDefined();
    expect(actionItem.assignedTo).toBeDefined();
    expect(['pending', 'in_progress', 'completed', 'delayed']).toContain(actionItem.status);
  });

  it('선택적 필드를 포함한 ActionItem을 검증한다', () => {
    const actionItem: ActionItem = {
      id: 'action-2',
      description: '완료된 조치 항목',
      assignedTo: 'user-2',
      dueDate: new Date('2024-02-15'),
      status: 'completed',
      completedAt: new Date('2024-02-10'),
      notes: '메모',
    };

    expect(actionItem.completedAt).toBeInstanceOf(Date);
    expect(actionItem.notes).toBe('메모');
  });
});
