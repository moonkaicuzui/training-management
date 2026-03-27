/**
 * 24/7 온도-습도 모니터링 장치 관리 타입 정의
 * 35개 구역, 38대 장치의 정기 점검 관리
 */

import type { Timestamp } from 'firebase/firestore';

// ─── 구역 마스터 (설정) ─────────────────────────────────────

export interface HMDevice {
  id: string;
  number: number;              // 순번 1~35
  area: string;                // STITCHING A1, Cutting A 등
  building: string;            // A, B, C, D, E, OTHER
  targetQuantity: number;      // T.O (보유 타겟 수량)
  isActive: boolean;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

export type HMBuilding = 'A' | 'B' | 'C' | 'D' | 'E' | 'OTHER';

// ─── 장치별 점검 결과 ────────────────────────────────────────

export type HMDeviceStatus = 'OK' | 'NO_OK' | 'MISSING';

export interface HMCheckResult {
  deviceId: string;            // humidity_monitor_devices 참조
  area: string;                // 구역명 (중복 저장 for 편의)
  targetQuantity: number;      // T.O
  okCount: number;             // 사용자 입력: 정상 장치 수
  noOkCount: number;           // 사용자 입력: 비정상 장치 수
  totalHave: number;           // 자동: okCount + noOkCount
  missing: number;             // 자동: totalHave - targetQuantity
  status: HMDeviceStatus;      // 자동 판정
  remark?: string;             // NO_OK 또는 MISSING 시 사유
}

// ─── 점검 레코드 (일자별) ────────────────────────────────────

export interface HMInspectionSummary {
  totalTarget: number;         // 전체 T.O 합계
  totalOk: number;
  totalNoOk: number;
  totalHave: number;           // totalOk + totalNoOk
  totalMissing: number;        // totalHave - totalTarget
  okRate: number;              // (totalOk / totalTarget) * 100
}

export interface HMInspection {
  id: string;
  inspectionDate: string;      // YYYY-MM-DD
  inspector: string;           // 점검자 이름
  results: HMCheckResult[];    // 각 장치별 결과
  summary: HMInspectionSummary;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
}

// ─── 분석 타입 ───────────────────────────────────────────────

export interface HMTrendItem {
  inspectionDate: string;      // YYYY-MM-DD
  totalTarget: number;
  totalOk: number;
  totalNoOk: number;
  totalMissing: number;
  okRate: number;
}

export interface HMBuildingStats {
  building: HMBuilding;
  totalTarget: number;
  totalOk: number;
  totalNoOk: number;
  totalMissing: number;
  okRate: number;
}

export interface HMRepeatedIssue {
  area: string;
  deviceId: string;
  consecutiveNoOk: number;     // 연속 NO_OK 횟수
  lastInspections: {
    date: string;
    status: HMDeviceStatus;
    remark?: string;
  }[];
}

export interface HMDashboardKPI {
  totalTarget: number;
  totalOk: number;
  totalNoOk: number;
  totalMissing: number;
  okRate: number;
  lastInspectionDate: string | null;
  inspectionCount: number;     // 총 점검 횟수
}

// ─── 필터 ────────────────────────────────────────────────────

export interface HMFilters {
  dateFrom?: string;
  dateTo?: string;
  building?: HMBuilding;
}

// ─── 초기 시드 데이터 ────────────────────────────────────────

export const HM_SEED_DEVICES: Omit<HMDevice, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { number: 1, area: 'STITCHING A1', building: 'A', targetQuantity: 1, isActive: true },
  { number: 2, area: 'Cutting A', building: 'A', targetQuantity: 1, isActive: true },
  { number: 3, area: 'CDC Cutting A', building: 'A', targetQuantity: 1, isActive: true },
  { number: 4, area: 'Leather A', building: 'A', targetQuantity: 1, isActive: true },
  { number: 5, area: 'ASSEMBLY A2', building: 'A', targetQuantity: 1, isActive: true },
  { number: 6, area: 'STITCHING A2', building: 'A', targetQuantity: 1, isActive: true },
  { number: 7, area: 'Super market A2', building: 'A', targetQuantity: 1, isActive: true },
  { number: 8, area: 'ASSEMBLY B2', building: 'B', targetQuantity: 1, isActive: true },
  { number: 9, area: 'Super market B', building: 'B', targetQuantity: 1, isActive: true },
  { number: 10, area: 'Cutting B', building: 'B', targetQuantity: 1, isActive: true },
  { number: 11, area: 'CDC-Cutting B', building: 'B', targetQuantity: 1, isActive: true },
  { number: 12, area: 'Leather B', building: 'B', targetQuantity: 1, isActive: true },
  { number: 13, area: 'FGWH', building: 'OTHER', targetQuantity: 3, isActive: true },
  { number: 14, area: 'AQL', building: 'OTHER', targetQuantity: 1, isActive: true },
  { number: 15, area: 'STOCKFIT B3', building: 'B', targetQuantity: 1, isActive: true },
  { number: 16, area: 'B grade wh', building: 'B', targetQuantity: 1, isActive: true },
  { number: 17, area: 'ASSEMBLY D', building: 'D', targetQuantity: 1, isActive: true },
  { number: 18, area: 'STITCHING D', building: 'D', targetQuantity: 1, isActive: true },
  { number: 19, area: 'Super market D', building: 'D', targetQuantity: 1, isActive: true },
  { number: 20, area: 'ASSEMBLY C', building: 'C', targetQuantity: 1, isActive: true },
  { number: 21, area: 'STITCHING C', building: 'C', targetQuantity: 1, isActive: true },
  { number: 22, area: 'Super market C', building: 'C', targetQuantity: 1, isActive: true },
  { number: 23, area: 'STITCHING E', building: 'E', targetQuantity: 1, isActive: true },
  { number: 24, area: 'Cutting E', building: 'E', targetQuantity: 1, isActive: true },
  { number: 25, area: 'Chemical wh (cooling)', building: 'OTHER', targetQuantity: 1, isActive: true },
  { number: 26, area: 'Chemical wh B', building: 'B', targetQuantity: 1, isActive: true },
  { number: 27, area: 'Mixing room A', building: 'A', targetQuantity: 1, isActive: true },
  { number: 28, area: 'Mixing room D', building: 'D', targetQuantity: 1, isActive: true },
  { number: 29, area: 'Chemical wh A(Hot)', building: 'A', targetQuantity: 2, isActive: true },
  { number: 30, area: 'Leather room', building: 'OTHER', targetQuantity: 1, isActive: true },
  { number: 31, area: 'Leather wh', building: 'OTHER', targetQuantity: 1, isActive: true },
  { number: 32, area: 'Material warehouse', building: 'OTHER', targetQuantity: 1, isActive: true },
  { number: 33, area: 'Setting WH', building: 'OTHER', targetQuantity: 1, isActive: true },
  { number: 34, area: 'MCS room in MTL wh', building: 'OTHER', targetQuantity: 1, isActive: true },
  { number: 35, area: 'Subshi', building: 'OTHER', targetQuantity: 1, isActive: true },
];
