/**
 * 온도-습도 모니터링 장치 — 분석 서비스
 */

import type {
  HMTrendItem, HMBuildingStats,
  HMRepeatedIssue, HMDashboardKPI, HMBuilding, HMFilters,
} from '@/types/humidityMonitor';
import { getInspections } from './crud';
import { logger } from '@/utils/logger';

// ─── 대시보드 KPI ────────────────────────────────────────────

export async function getDashboardKPI(filters?: HMFilters): Promise<HMDashboardKPI> {
  try {
    const inspections = await getInspections(filters);

    if (inspections.length === 0) {
      return {
        totalTarget: 0, totalOk: 0, totalNoOk: 0, totalMissing: 0,
        okRate: 0, lastInspectionDate: null, inspectionCount: 0,
      };
    }

    // 가장 최근 점검 데이터 사용
    const latest = inspections[0];

    return {
      totalTarget: latest.summary.totalTarget,
      totalOk: latest.summary.totalOk,
      totalNoOk: latest.summary.totalNoOk,
      totalMissing: latest.summary.totalMissing,
      okRate: latest.summary.okRate,
      lastInspectionDate: latest.inspectionDate,
      inspectionCount: inspections.length,
    };
  } catch (error) {
    logger.error('[HMAnalytics] getDashboardKPI failed', error);
    throw error;
  }
}

// ─── 정상률 추이 ─────────────────────────────────────────────

export async function getTrend(count: number = 12): Promise<HMTrendItem[]> {
  try {
    const inspections = await getInspections();
    const sorted = inspections
      .sort((a, b) => a.inspectionDate.localeCompare(b.inspectionDate))
      .slice(-count);

    return sorted.map((insp) => ({
      inspectionDate: insp.inspectionDate,
      totalTarget: insp.summary.totalTarget,
      totalOk: insp.summary.totalOk,
      totalNoOk: insp.summary.totalNoOk,
      totalMissing: insp.summary.totalMissing,
      okRate: insp.summary.okRate,
    }));
  } catch (error) {
    logger.error('[HMAnalytics] getTrend failed', error);
    throw error;
  }
}

// ─── 빌딩별 비교 ─────────────────────────────────────────────

export async function getBuildingComparison(): Promise<HMBuildingStats[]> {
  try {
    const inspections = await getInspections();
    if (inspections.length === 0) return [];

    const latest = inspections[0];
    const buildingMap = new Map<HMBuilding, { target: number; ok: number; noOk: number; missing: number }>();

    // 각 장치별 결과를 빌딩별로 집계
    for (const result of latest.results) {
      // deviceId에서 빌딩 추출 (결과에 building 정보가 없으므로 area에서 유추)
      const building = detectBuildingFromArea(result.area);
      const current = buildingMap.get(building) ?? { target: 0, ok: 0, noOk: 0, missing: 0 };
      current.target += result.targetQuantity;
      current.ok += result.okCount;
      current.noOk += result.noOkCount;
      current.missing += result.missing;
      buildingMap.set(building, current);
    }

    return Array.from(buildingMap.entries())
      .map(([building, stats]) => ({
        building,
        totalTarget: stats.target,
        totalOk: stats.ok,
        totalNoOk: stats.noOk,
        totalMissing: stats.missing,
        okRate: stats.target > 0 ? Math.round((stats.ok / stats.target) * 1000) / 10 : 0,
      }))
      .sort((a, b) => a.building.localeCompare(b.building));
  } catch (error) {
    logger.error('[HMAnalytics] getBuildingComparison failed', error);
    throw error;
  }
}

// ─── 반복 이슈 구역 ─────────────────────────────────────────

export async function getRepeatedIssues(minConsecutive: number = 3): Promise<HMRepeatedIssue[]> {
  try {
    const inspections = await getInspections();
    if (inspections.length < 2) return [];

    // 날짜 오름차순 정렬
    const sorted = [...inspections].sort((a, b) => a.inspectionDate.localeCompare(b.inspectionDate));
    const recent = sorted.slice(-Math.max(minConsecutive + 2, 5));

    // 구역별 연속 NO_OK/MISSING 추적
    const areaHistory = new Map<string, { deviceId: string; history: { date: string; status: string; remark?: string }[] }>();

    for (const insp of recent) {
      for (const result of insp.results) {
        if (!areaHistory.has(result.area)) {
          areaHistory.set(result.area, { deviceId: result.deviceId, history: [] });
        }
        areaHistory.get(result.area)!.history.push({
          date: insp.inspectionDate,
          status: result.status,
          remark: result.remark,
        });
      }
    }

    const issues: HMRepeatedIssue[] = [];

    for (const [area, { deviceId, history }] of areaHistory) {
      // 최근부터 역순으로 연속 NO_OK/MISSING 카운트
      let consecutive = 0;
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].status !== 'OK') {
          consecutive++;
        } else {
          break;
        }
      }

      if (consecutive >= minConsecutive) {
        issues.push({
          area,
          deviceId,
          consecutiveNoOk: consecutive,
          lastInspections: history.slice(-consecutive).map((h) => ({
            date: h.date,
            status: h.status as HMRepeatedIssue['lastInspections'][0]['status'],
            remark: h.remark,
          })),
        });
      }
    }

    return issues.sort((a, b) => b.consecutiveNoOk - a.consecutiveNoOk);
  } catch (error) {
    logger.error('[HMAnalytics] getRepeatedIssues failed', error);
    throw error;
  }
}

// ─── 내부 헬퍼 ───────────────────────────────────────────────

function detectBuildingFromArea(area: string): HMBuilding {
  const upper = area.toUpperCase();
  if (upper.includes(' A') || upper.endsWith(' A') || upper.includes('A1') || upper.includes('A2') || upper.includes('A(HOT)')) return 'A';
  if (upper.includes(' B') || upper.endsWith(' B') || upper.includes('B2') || upper.includes('B3')) return 'B';
  if (upper.includes(' C') || upper.endsWith(' C')) return 'C';
  if (upper.includes(' D') || upper.endsWith(' D')) return 'D';
  if (upper.includes(' E') || upper.endsWith(' E')) return 'E';
  return 'OTHER';
}
