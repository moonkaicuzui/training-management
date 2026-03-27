/**
 * 온도-습도 모니터링 장치 — 헬퍼 함수 & 상수
 */

import { Timestamp } from 'firebase/firestore';
import type { HMDevice, HMInspection, HMCheckResult, HMDeviceStatus, HMBuilding } from '@/types/humidityMonitor';

// ─── Firestore 컬렉션명 ──────────────────────────────────────

export const DEVICES_COLLECTION = 'humidity_monitor_devices';
export const INSPECTIONS_COLLECTION = 'humidity_monitor_inspections';

// ─── Timestamp 변환 ──────────────────────────────────────────

export function convertTimestamp(ts: Timestamp | string | null | undefined): string {
  if (!ts) return '';
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === 'string') return ts;
  return '';
}

// ─── Document → 타입 변환 ────────────────────────────────────

export function docToDevice(docId: string, data: Record<string, unknown>): HMDevice {
  return {
    id: docId,
    number: (data.number as number) ?? 0,
    area: (data.area as string) ?? '',
    building: (data.building as HMBuilding) ?? 'OTHER',
    targetQuantity: (data.targetQuantity as number) ?? 1,
    isActive: (data.isActive as boolean) ?? true,
    createdAt: convertTimestamp(data.createdAt as Timestamp | string | null),
    updatedAt: convertTimestamp(data.updatedAt as Timestamp | string | null),
  };
}

export function docToInspection(docId: string, data: Record<string, unknown>): HMInspection {
  const results = (data.results as HMCheckResult[]) ?? [];
  const summary = (data.summary as HMInspection['summary']) ?? {
    totalTarget: 0, totalOk: 0, totalNoOk: 0, totalHave: 0, totalMissing: 0, okRate: 0,
  };

  return {
    id: docId,
    inspectionDate: (data.inspectionDate as string) ?? '',
    inspector: (data.inspector as string) ?? '',
    results,
    summary,
    createdAt: convertTimestamp(data.createdAt as Timestamp | string | null),
    updatedAt: convertTimestamp(data.updatedAt as Timestamp | string | null),
  };
}

// ─── 자동 계산 ───────────────────────────────────────────────

export function calculateCheckResult(
  okCount: number,
  noOkCount: number,
  targetQuantity: number,
): { totalHave: number; missing: number; status: HMDeviceStatus } {
  const totalHave = okCount + noOkCount;
  const missing = totalHave - targetQuantity;
  let status: HMDeviceStatus = 'OK';
  if (noOkCount > 0) status = 'NO_OK';
  else if (missing < 0) status = 'MISSING';
  return { totalHave, missing, status };
}

export function calculateSummary(results: HMCheckResult[]) {
  const totalTarget = results.reduce((sum, r) => sum + r.targetQuantity, 0);
  const totalOk = results.reduce((sum, r) => sum + r.okCount, 0);
  const totalNoOk = results.reduce((sum, r) => sum + r.noOkCount, 0);
  const totalHave = totalOk + totalNoOk;
  const totalMissing = totalHave - totalTarget;
  const okRate = totalTarget > 0 ? Math.round((totalOk / totalTarget) * 1000) / 10 : 0;

  return { totalTarget, totalOk, totalNoOk, totalHave, totalMissing, okRate };
}

// ─── 빌딩 자동 분류 ──────────────────────────────────────────

export function detectBuilding(area: string): HMBuilding {
  const upper = area.toUpperCase();
  if (upper.includes(' A') || upper.endsWith(' A') || upper.includes('A1') || upper.includes('A2') || upper.includes('A(HOT)')) return 'A';
  if (upper.includes(' B') || upper.endsWith(' B') || upper.includes('B2') || upper.includes('B3')) return 'B';
  if (upper.includes(' C') || upper.endsWith(' C')) return 'C';
  if (upper.includes(' D') || upper.endsWith(' D')) return 'D';
  if (upper.includes(' E') || upper.endsWith(' E')) return 'E';
  return 'OTHER';
}
