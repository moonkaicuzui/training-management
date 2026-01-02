/**
 * Executive Dashboard Types
 * 경영진 대시보드 전용 타입 정의
 */

// 핵심 KPI 데이터
export interface ExecutiveKPI {
  id: string;
  title: string;
  value: number;
  target: number;
  unit: string;
  trend: number; // 전월 대비 변화율
  status: 'achieved' | 'on-track' | 'at-risk' | 'missed';
  inverseTrend?: boolean; // true면 낮을수록 좋음 (예: 이직률)
}

// 경영진 대시보드 통계
export interface ExecutiveDashboardStats {
  // 교육 현황
  totalEmployees: number;
  trainingCompletionRate: number;
  qualificationRate: number;
  firstTimePassRate: number;
  retrainingRate: number;

  // 신입 교육 (New TQC)
  newHireCount: number;
  newHireCompletionRate: number;
  newHireTurnoverRate: number;
  averageOnboardingDays: number;

  // ROI 관련
  trainingBudget: number;
  budgetUtilization: number;
  trainingROI: number;
  costPerEmployee: number;

  // 비교 데이터
  vsLastMonth: number;
  vsLastYear: number;
  vsTarget: number;
}

// ROI 분석 데이터
export interface TrainingROIData {
  period: string;
  trainingCost: number;
  productivityGain: number;
  qualityImprovement: number;
  turnoverSavings: number;
  roi: number;
}

// 이직률-교육 상관관계 데이터
export interface TurnoverCorrelationData {
  category: string;
  trained: number;
  untrained: number;
  difference: number;
}

// 벤치마킹 데이터
export interface BenchmarkMetric {
  metric: string;
  metricKr: string;
  current: number;
  target: number;
  industryAvg: number;
  hwkGroupAvg: number;
  unit: string;
  lowerIsBetter?: boolean;
}

// 본사 보고서 타입
export interface HeadquartersReportData {
  reportId: string;
  reportType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  period: string;
  generatedAt: string;
  summary: {
    headline: string;
    totalEmployees: number;
    trainingCompletionRate: number;
    vsLastPeriod: number;
    roi: number;
  };
  kpis: {
    name: string;
    value: number;
    target: number;
    status: 'achieved' | 'on-track' | 'at-risk' | 'missed';
    trend: number;
  }[];
  riskItems: {
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    action: string;
  }[];
  achievements: string[];
  nextPeriodPlans: string[];
}

// KPI 임계값 설정
export interface KPIThreshold {
  metricId: string;
  warningThreshold: number;
  criticalThreshold: number;
  targetValue: number;
}

// 감사 대응 메트릭 (아디다스 감사용)
export interface AuditComplianceMetric {
  id: string;
  category: AuditCategory;
  requirement: string;
  description: string;
  currentStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL' | 'NOT_APPLICABLE';
  currentValue?: number;
  targetValue?: number;
  unit?: string;
  evidence: string[];
  lastChecked: string;
  dueDate?: string;
  responsiblePerson?: string;
  actionRequired?: string;
}

// 감사 카테고리
export type AuditCategory =
  | 'TRAINING_COVERAGE'      // 교육 적용 범위
  | 'CERTIFICATION'          // 자격 인증
  | 'DOCUMENTATION'          // 문서화
  | 'COMPETENCY'             // 역량 평가
  | 'RETRAINING'             // 재교육
  | 'RECORDS_RETENTION';     // 기록 보관

// 아디다스 감사 리포트
export interface AdidasAuditReport {
  reportId: string;
  auditDate: string;
  auditorName?: string;
  overallScore: number;
  overallStatus: 'PASS' | 'CONDITIONAL_PASS' | 'FAIL';
  categories: AuditCategorySummary[];
  metrics: AuditComplianceMetric[];
  findings: AuditFinding[];
  correctiveActions: CorrectiveAction[];
}

// 카테고리별 요약
export interface AuditCategorySummary {
  category: AuditCategory;
  categoryName: string;
  compliantCount: number;
  nonCompliantCount: number;
  partialCount: number;
  totalCount: number;
  score: number;
  status: 'PASS' | 'ATTENTION' | 'FAIL';
}

// 감사 발견사항
export interface AuditFinding {
  id: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'OBSERVATION';
  category: AuditCategory;
  description: string;
  requirement: string;
  evidence: string;
  recommendation: string;
}

// 시정 조치
export interface CorrectiveAction {
  id: string;
  findingId: string;
  action: string;
  responsiblePerson: string;
  targetDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  completedDate?: string;
  verificationNotes?: string;
}
