/**
 * Metal Detector Inspection Types
 * 금속 탐지기 일일 점검 관련 타입 정의
 */

// 점검 구역 코드
export type FactoryCode = 'A' | 'B' | 'B3' | 'C' | 'D' | 'FGWH' | 'SCANPACK_AB' | 'SCANPACK_C' | 'SCANPACK_D';

// 점검 결과
export type InspectionResult = 'PASS' | 'FAIL';

// CA 상태
export type CAStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

// 모바일 체크리스트 (일일 점검 5항목)
export interface MDChecklist {
  power: 'ON' | 'OFF' | '';
  sensitivity: 'PASS' | 'FAIL' | '';
  testPiece: 'PASS' | 'FAIL' | '';
  belt: 'OK' | 'NG' | '';
  exterior: 'OK' | 'NG' | '';
}

// 금속 탐지기 일일 점검 레코드
export interface MDInspection {
  id: string;
  factory: FactoryCode;
  line: string;              // e.g. "L1-1", "L5-2"
  machineId?: string;        // 장비 고유 ID (e.g. "D210103")
  inspectionDate: string;    // YYYY-MM-DD
  weekNumber: number;        // ISO week number
  year: number;
  result: InspectionResult;
  inspectorName: string;
  inspectorId?: string;      // employee_id (Q-TRAIN employees)
  sensitivity?: {
    fe: number;    // mm (철 감도) - deprecated
    sus: number;   // mm (스테인리스 감도) - deprecated
    nonFe: number; // mm (비철 감도) - deprecated
  };
  checklist?: MDChecklist;   // 모바일 체크리스트 (5항목)
  hasPhoto?: boolean;        // 모바일 사진 촬영 여부
  productName?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

// 불합격 시 상세 기록
export interface MDFailure {
  id: string;
  inspectionId: string;       // MDInspection 참조
  factory: FactoryCode;
  line: string;
  failureDate: string;
  failureType: string;        // 불합격 유형
  description: string;        // 상세 설명
  caStatus: CAStatus;
  caDescription?: string;     // 시정조치 내용
  caCompletedAt?: string;
  caVerifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// 대시보드 KPI
export interface MDDashboardKPI {
  totalInspections: number;
  passCount: number;
  failCount: number;
  passRate: number;           // percentage
  byFactory: Record<FactoryCode, {
    total: number;
    pass: number;
    fail: number;
    passRate: number;
  }>;
  openCAs: number;
  overdueCAs: number;
}

// 필터
export interface MDFilters {
  factory?: FactoryCode;
  dateFrom?: string;
  dateTo?: string;
  weekNumber?: number;
  year?: number;
  result?: InspectionResult;
}

// 주차별 추세 데이터
export interface MDWeeklyTrend {
  weekNumber: number;
  year: number;
  total: number;
  pass: number;
  fail: number;
  passRate: number;
}

// 개선 상태
export type ImprovementStatus = 'improved' | 'no_change' | 'increased';

// 주간 비교 (이번주 vs 지난주)
export interface MDWeeklyComparison {
  thisWeek: {
    weekNumber: number;
    totalChecked: number;
    failCount: number;
    passRate: number;
    byFactory: Record<FactoryCode, { total: number; pass: number; fail: number; passRate: number }>;
  };
  lastWeek: {
    weekNumber: number;
    totalChecked: number;
    failCount: number;
    passRate: number;
    byFactory: Record<FactoryCode, { total: number; pass: number; fail: number; passRate: number }>;
  };
  factoryComparison: Record<FactoryCode, {
    failedLastWeek: number;
    failedThisWeek: number;
    improvement: ImprovementStatus;
  }>;
  maintenanceFixRate: number;  // 지난주 FAIL 중 CA 완료된 비율 (%)
  machinesFixedOnTime: number; // 수리 완료 장비 수
  machinesFailedLastWeek: number; // 지난주 불합격 장비 수
}

// 반복 이슈 장비
export interface MDRepeatedIssue {
  machineId: string;
  factory: FactoryCode;
  line: string;
  keyIssue: string;       // failureType 또는 description
  weeksFailed: number[];  // 불합격된 주차 목록
  status: 'repeated';
}

// 반복 이슈 요약
export interface MDRepeatedIssueSummary {
  machines: MDRepeatedIssue[];
  totalInspected: number;   // 전체 검사 장비 수 (unique machineId)
  repeatedCount: number;    // 반복 이슈 장비 수
  repeatedRate: number;     // 반복 이슈율 (%)
}

// 이메일 수신자 설정
export interface MDEmailRecipient {
  id: string;
  email: string;
  name: string;
  role: 'manager' | 'maintenance' | 'auditor';  // 역할별 수신 구분
  factory?: FactoryCode;  // 특정 공장 담당자 (없으면 전체)
  notifications: {
    weeklyReport: boolean;   // 주간 리포트 수신
    failAlert: boolean;      // FAIL 발생 시 알림
    caOverdue: boolean;      // CA 기한 초과 알림
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
