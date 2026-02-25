/**
 * Metal Detector Inspection Types
 * 금속 탐지기 일일 점검 관련 타입 정의
 */

// 공장 코드
export type FactoryCode = 'A' | 'B' | 'C' | 'D';

// 점검 결과
export type InspectionResult = 'PASS' | 'FAIL';

// CA 상태
export type CAStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

// 금속 탐지기 일일 점검 레코드
export interface MDInspection {
  id: string;
  factory: FactoryCode;
  line: string;              // e.g. "A-1", "B-3"
  inspectionDate: string;    // YYYY-MM-DD
  weekNumber: number;        // ISO week number
  year: number;
  result: InspectionResult;
  inspectorName: string;
  inspectorId?: string;
  sensitivity: {
    fe: number;    // mm (철 감도)
    sus: number;   // mm (스테인리스 감도)
    nonFe: number; // mm (비철 감도)
  };
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
