/**
 * Metal Shoe Case Types
 * 금속 발견 신발 보고서 시스템 타입 정의
 */

export type MetalShoeComponent = 'BOTTOM' | 'UPPER';
export type MetalShoeSide = 'RIGHT' | 'LEFT';
export type XraySentStatus = 'NOT_SENT' | 'OK' | 'N/A';
export type MetalConfirm = 'YES' | 'NO' | 'NOT_YET';
export type MetalShoeStatus = 'registered' | 'xray_sent' | 'confirmed' | 'action_requested' | 'action_received' | 'closed';
export type ActionStatus = 'WAITING' | 'DONE' | 'NOT_DONE' | 'OVERDUE';

export interface MetalShoeCase {
  id: string;
  // 발견 정보
  year: number;
  month: number;
  week: string;
  weekNumber: number;
  detectionDate: string;
  // 위치
  factory: string;
  line: string;
  // 제품
  model: string;
  pgsc: string;
  poNumber: string;
  destination: string;
  orderQty: number;
  size: string;
  // 금속 상세
  supplierId: string;
  supplierName: string;
  component: MetalShoeComponent;
  side: MetalShoeSide;
  piecesQty: number;
  cGradePairs: number;
  // X-Ray
  xraySentDate?: string;
  xraySentStatus: XraySentStatus;
  xrayReceivedDate?: string;
  metalConfirm: MetalConfirm;
  // 비고
  remark?: string;
  isInternalOperation: boolean;
  // Return Dashboard 연동
  returnDashboardIssueId?: string;
  // 액션플랜
  actionPlanDeadline?: string;   // ISO date (등록일 + 7일)
  actionPlanStatus?: 'pending' | 'submitted' | 'overdue';
  actionPlanActions?: MetalShoeAction[];
  actionPlanLastSyncedAt?: string;
  // 상태
  status: MetalShoeStatus;
  createdAt: string;
  createdBy: { uid: string; email: string; displayName: string };
  updatedAt: string;
}

export interface MetalShoeAction {
  supplierId: string;
  supplierName: string;
  category: string;
  dateSent: string;
  actionSubmittedDate?: string;
  timeTarget: string;
  actionStatus: ActionStatus;
  remark?: string;
  // 액션플랜 증거
  actionContent?: string;        // 액션 내용 (RCA, corrective, preventive)
  evidencePhotos?: string[];     // Firebase Storage URL 배열
  submittedBy?: string;          // 액션 제출자
}

export interface MetalShoeActionTracking {
  id: string;
  batchWeek: string;
  batchYear: number;
  supplierActions: Array<{
    supplierId: string;
    supplierName: string;
    category: string;
    dateSent: string;
    actionSubmittedDate?: string;
    timeTarget: string;
    actionStatus: ActionStatus;
    relatedCaseIds: string[];
    remark?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface MetalShoeDashboardKPI {
  totalCases: number;
  bottomCases: number;
  upperCases: number;
  xrayPending: number;
  actionPending: number;
  closedCases: number;
  bySupplier: Record<string, { total: number; bottom: number; upper: number }>;
  byFactory: Record<string, { total: number; bottom: number; upper: number }>;
  weeklyTrend: Array<{ week: string; weekNumber: number; total: number; bottom: number; upper: number }>;
}

export interface MetalShoeFilters {
  year: number;
  month?: number;
  weekNumber?: number;
  factory?: string;
  supplierId?: string;
  component?: MetalShoeComponent;
  status?: MetalShoeStatus;
}
