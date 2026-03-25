/**
 * Cross-System Query Service
 * QOS Cloud Function을 호출하여 OSC/AQL 크로스 데이터 조회
 * 이슈 등록일 기준 Before/After 분리
 */

import { logger } from '@/utils/logger';

// ─── Types ────────────────────────────────────────

export interface CrossQueryInput {
  model: string;
  defectKey?: string;
  supplierId?: string;
  process?: string;
  issueDate: string;        // YYYY-MM-DD (이슈 등록일)
  beforeDays?: number;      // Before 기간 (기본 30)
  afterDays?: number;       // After 기간 (기본 30)
}

export interface DailyTrendItem {
  date: string;
  inspectionQty: number;
  rejectQty: number;
  defectRate: number;
  specificDefectCount: number;
  period: 'before' | 'after';   // Before/After 구분
}

export interface AqlDailyTrendItem {
  date: string;
  passCount: number;
  failCount: number;
  passRate: number;
  period: 'before' | 'after';
}

export interface PeriodSummary {
  totalInspections: number;
  totalInspectionQty: number;
  totalRejectQty: number;
  defectRate: number;
  specificDefectCount: number;
  specificDefectRate: number;
}

export interface AqlPeriodSummary {
  totalInspections: number;
  passCount: number;
  failCount: number;
  passRate: number;
}

export interface OscInspectionRecord {
  date: string;
  supplierId: string;
  part: string;
  process: string;
  inspectionQty: number;
  rejectQty: number;
  result: string;
  defectRate: number;
  specificDefectCount: number;
  photos: string[];
  period: 'before' | 'after';
}

export interface AqlRejectRecord {
  date: string;
  building: string;
  line: string;
  orderQty: number;
  rejectQty: number;
  rejectRate: number;
  defectItems: { defectName: string; defectCategory: string; qty: number }[];
  status: string;
  period: 'before' | 'after';
}

export interface CrossSystemData {
  osc: {
    before: PeriodSummary;
    after: PeriodSummary;
    dailyTrend: DailyTrendItem[];
    inspections: OscInspectionRecord[];
  };
  aql: {
    before: AqlPeriodSummary;
    after: AqlPeriodSummary;
    dailyTrend: AqlDailyTrendItem[];
    rejects: AqlRejectRecord[];
  };
  issueDate: string;
  improvement: {
    oscDefectRateChange: number;    // 불량률 변화 (음수 = 개선)
    oscDefectRateChangePercent: number; // 변화율 (%)
    aqlPassRateChange: number;      // 합격률 변화 (양수 = 개선)
  };
}

// ─── Service ──────────────────────────────────────

/**
 * QOS getCrossSystemData Cloud Function 호출
 * Phase 0 배포 전에는 모의 데이터 반환
 */
export async function fetchCrossSystemData(input: CrossQueryInput): Promise<CrossSystemData | null> {
  try {
    // TODO: Phase 0 완료 후 실제 QOS Cloud Function 호출로 교체
    // const functions = getFunctions(getApp(), 'asia-northeast3');
    // const getCrossSystemData = httpsCallable<CrossQueryInput, CrossSystemData>(functions, 'getCrossSystemData');
    // const result = await getCrossSystemData(input);
    // return result.data;

    logger.info('[crossSystemService] fetchCrossSystemData called', {
      model: input.model,
      defectKey: input.defectKey,
      issueDate: input.issueDate,
    });

    // Phase 0 미배포 시 null 반환 (UI에서 "연동 대기중" 표시)
    return null;
  } catch (error) {
    logger.error('[crossSystemService] fetchCrossSystemData failed:', error);
    return null;
  }
}

/**
 * Before/After 개선 효과 계산
 */
export function calculateImprovement(data: CrossSystemData): CrossSystemData['improvement'] {
  const oscBefore = data.osc.before.defectRate;
  const oscAfter = data.osc.after.defectRate;
  const aqlBefore = data.aql.before.passRate;
  const aqlAfter = data.aql.after.passRate;

  return {
    oscDefectRateChange: oscAfter - oscBefore,
    oscDefectRateChangePercent: oscBefore > 0
      ? ((oscAfter - oscBefore) / oscBefore) * 100
      : 0,
    aqlPassRateChange: aqlAfter - aqlBefore,
  };
}
