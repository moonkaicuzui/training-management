/**
 * CAPA (Corrective and Preventive Action) Type Definitions
 *
 * 5단계 CAPA 워크플로우:
 * 1. Discovery (발견) - 문제 등록, 분류, 심각도 평가
 * 2. Investigation (조사) - 근본원인 분석, 영향 분석, 증거 수집
 * 3. Action (조치) - 시정조치 계획, 예방조치 계획, 담당자 지정
 * 4. Verification (검증) - 효과성 검증, 재발 모니터링, 조치 완료 확인
 * 5. Closure (종료) - 최종 검토, 문서화 완료, 교훈 공유
 */

import type { Timestamp } from 'firebase/firestore';

// ========== Quality Issue Context ==========

/**
 * 품질 이슈 확장 컨텍스트
 * QOS 생태계 표준 필드 (모델, 불량코드, 업체, 공정 등)
 */
export interface QualityIssueContext {
  model?: string;                   // 모델명 (QOS master_orders 표준)
  defectCode?: string;              // 불량 코드 (QOS defectStandards key)
  defectLabel?: string;             // 불량 라벨 (한국어)
  supplierId?: string;              // 업체 ID (QOS suppliers)
  supplierName?: string;            // 업체명
  process?: string;                 // 공정 (NOSEW, HF, PRINTING 등)
  building?: string;                // 건물 (A2동 등)
  line?: string;                    // 라인
  responsibleProcess?: string;      // 귀책 공정
  discoveryProcess?: string;        // 발견 공정
  linkedSystems?: string[];         // 연동 시스템 ['OSC', 'AQL', 'RETURN']
  actionFrameId?: string;           // 선택된 관리 프레임 ID
}

// ========== Communication History ==========

/**
 * CAPA 커뮤니케이션 이력
 */
export interface CAPACommunication {
  id: string;
  to: string;                       // 수신자
  sentAt: string;                   // ISO 날짜
  channel: 'email' | 'chat' | 'verbal' | 'phone';
  content: string;
  createdBy?: string;
}

// ========== Field Investigation ==========

/**
 * 현장 조사 결과
 */
export interface FieldInvestigation {
  id: string;
  actionItemId: string;             // 관련 ActionItem ID
  investigator: string;             // 조사자
  investigatedAt: string;           // ISO 날짜
  findings: string;                 // 조사 결과
  quantity?: number;                // 검사/불량 수량
  defectRate?: number;              // 불량률
  photos?: string[];                // 사진 URL
  notes?: string;
}

// ========== CAPA Status Types ==========

export type CAPAStatus =
  | 'discovery'      // 발견
  | 'investigation'  // 조사
  | 'action'         // 조치
  | 'verification'   // 검증
  | 'closed'         // 종료
  | 'rejected';      // 반려

export type CAPAType = 'corrective' | 'preventive';

export type CAPASeverity = 'critical' | 'major' | 'minor';

export type CAPAPriority = 'high' | 'medium' | 'low';

export type CAPASource =
  | 'audit'           // 감사
  | 'customer'        // 고객 불만
  | 'internal'        // 내부 발견
  | 'supplier'        // 공급업체
  | 'process'         // 공정 이상
  | 'training';       // 교육 관련

// ========== CAPA Stage Data Types ==========

/**
 * 발견 단계 데이터
 */
export interface DiscoveryData {
  problemDescription: string;
  source: CAPASource;
  discoveredAt: Date | Timestamp;
  discoveredBy: string;
  affectedArea: string;
  affectedProducts?: string[];
  immediateActions?: string;
  attachments?: string[]; // File URLs
}

/**
 * 조사 단계 데이터
 */
export interface InvestigationData {
  rootCauseAnalysis: string;
  investigationMethod?: '5why' | 'fishbone' | 'fmea' | 'other';
  contributingFactors?: string[];
  impactAssessment: string;
  evidenceList?: string[];
  investigatedBy: string;
  investigatedAt: Date | Timestamp;
  findings: string;
}

/**
 * 조치 단계 데이터
 */
export interface ActionData {
  correctiveActions: ActionItem[];
  preventiveActions: ActionItem[];
  resourcesRequired?: string;
  estimatedCost?: number;
  plannedBy: string;
  plannedAt: Date | Timestamp;
}

export interface ActionItem {
  id: string;
  description: string;
  assignedTo: string;
  dueDate: Date | Timestamp;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  completedAt?: Date | Timestamp;
  notes?: string;
  area?: string;              // Sewing / Lasting / Repacking
  section?: string;           // Sewing Prep / Sewing Line
  zone?: string;              // Bldg A · 2F
  currentStatus?: string;     // 현재 현황 설명
  followUp?: string;          // 후속 조치
}

/**
 * 검증 단계 데이터
 */
export interface VerificationData {
  verificationMethod: string;
  effectivenessScore?: number; // 0-100
  isEffective: boolean;
  monitoringPeriod?: string;
  recurrenceCheck: boolean;
  verifiedBy: string;
  verifiedAt: Date | Timestamp;
  verificationNotes: string;
}

/**
 * 종료 단계 데이터
 */
export interface ClosureData {
  finalReview: string;
  lessonsLearned?: string;
  documentationComplete: boolean;
  knowledgeShared: boolean;
  closedBy: string;
  closedAt: Date | Timestamp;
  closureNotes?: string;
}

// ========== Main CAPA Interface ==========

export interface CAPA {
  id: string;
  capaNumber: string; // e.g., "CAPA-2024-001"
  title: string;
  description: string;
  type: CAPAType;
  status: CAPAStatus;
  severity: CAPASeverity;
  priority: CAPAPriority;
  source: CAPASource;

  // 단계별 데이터
  discovery: DiscoveryData;
  investigation?: InvestigationData;
  action?: ActionData;
  verification?: VerificationData;
  closure?: ClosureData;

  // 품질 이슈 확장
  qualityContext?: QualityIssueContext;
  communications?: CAPACommunication[];
  fieldInvestigations?: FieldInvestigation[];

  // 관련 정보
  relatedCAPAs?: string[];
  relatedTrainingPrograms?: string[];

  // 메타데이터
  createdBy: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  dueDate?: Date | Timestamp;

  // 담당자 정보
  owner: string; // Primary responsible person
  team?: string[]; // Team members involved
}

// ========== CAPA Input/Update Types ==========

export interface CAPAInput {
  title: string;
  description: string;
  type: CAPAType;
  severity: CAPASeverity;
  priority: CAPAPriority;
  source: CAPASource;
  discovery: Omit<DiscoveryData, 'discoveredAt'>;
  qualityContext?: QualityIssueContext;
  dueDate?: Date;
  owner: string;
  team?: string[];
  relatedTrainingPrograms?: string[];
}

export interface CAPAUpdate {
  title?: string;
  description?: string;
  severity?: CAPASeverity;
  priority?: CAPAPriority;
  dueDate?: Date;
  owner?: string;
  team?: string[];
}

export interface CAPAStageUpdate {
  status: CAPAStatus;
  investigation?: Omit<InvestigationData, 'investigatedAt'>;
  action?: Omit<ActionData, 'plannedAt'>;
  verification?: Omit<VerificationData, 'verifiedAt'>;
  closure?: Omit<ClosureData, 'closedAt'>;
  rejectionReason?: string;
}

// ========== CAPA Filter & Search Types ==========

export interface CAPAFilters {
  status?: CAPAStatus[];
  type?: CAPAType;
  severity?: CAPASeverity[];
  priority?: CAPAPriority[];
  source?: CAPASource[];
  owner?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

// ========== CAPA Dashboard Types ==========

export interface CAPADashboardStats {
  total: number;
  byStatus: Record<CAPAStatus, number>;
  bySeverity: Record<CAPASeverity, number>;
  byType: Record<CAPAType, number>;
  overdue: number;
  closedThisMonth: number;
  averageResolutionDays: number;
  effectivenessRate: number; // Percentage of verified effective CAPAs
}

export interface CAPATrendData {
  month: string;
  created: number;
  closed: number;
  overdue: number;
}

// ========== CAPA Workflow Constants ==========

export const CAPA_STATUS_ORDER: CAPAStatus[] = [
  'discovery',
  'investigation',
  'action',
  'verification',
  'closed',
];

export const CAPA_STATUS_LABELS: Record<CAPAStatus, string> = {
  discovery: '발견',
  investigation: '조사',
  action: '조치',
  verification: '검증',
  closed: '종료',
  rejected: '반려',
};

export const CAPA_SEVERITY_LABELS: Record<CAPASeverity, string> = {
  critical: '심각',
  major: '중대',
  minor: '경미',
};

export const CAPA_PRIORITY_LABELS: Record<CAPAPriority, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};

export const CAPA_SOURCE_LABELS: Record<CAPASource, string> = {
  audit: '감사',
  customer: '고객 불만',
  internal: '내부 발견',
  supplier: '공급업체',
  process: '공정 이상',
  training: '교육 관련',
};

export const CAPA_TYPE_LABELS: Record<CAPAType, string> = {
  corrective: '시정조치',
  preventive: '예방조치',
};
