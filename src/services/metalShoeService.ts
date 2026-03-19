/**
 * Metal Shoe Case Firebase Service
 *
 * Firestore CRUD operations for 'metal_shoe_cases' and 'metal_shoe_action_tracking' collections.
 * 금속 발견 신발 보고서 관리 서비스
 */

import {
  db,
  doc,
  collection,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  Timestamp,
} from '@/services/firebase';
import { logger } from '@/utils/logger';
import { createAuditLog } from './auditLogService';
import type {
  MetalShoeCase,
  MetalShoeActionTracking,
  MetalShoeDashboardKPI,
  MetalShoeFilters,
} from '@/types/metalShoe';

// ============================================================
// Collection Constants
// ============================================================

const CASES_BASE = 'metal_shoe_cases';
const ACTION_TRACKING = 'metal_shoe_action_tracking';

function getCasesCollection(year: number): string {
  return `${CASES_BASE}/${year}/cases`;
}

// ============================================================
// Helper Functions
// ============================================================

const convertTimestamp = (
  ts: Timestamp | string | null | undefined
): string => {
  if (!ts) return '';
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  return ts;
};

/** ISO week number 계산 */
function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Firestore 문서를 MetalShoeCase로 변환 */
function docToCase(docId: string, data: Record<string, unknown>): MetalShoeCase {
  const createdBy = (data.createdBy as Record<string, string>) || {};
  return {
    id: docId,
    year: (data.year as number) ?? 0,
    month: (data.month as number) ?? 0,
    week: (data.week as string) ?? '',
    weekNumber: (data.weekNumber as number) ?? 0,
    detectionDate: (data.detectionDate as string) ?? '',
    factory: (data.factory as string) ?? '',
    line: (data.line as string) ?? '',
    model: (data.model as string) ?? '',
    pgsc: (data.pgsc as string) ?? '',
    poNumber: (data.poNumber as string) ?? '',
    destination: (data.destination as string) ?? '',
    orderQty: (data.orderQty as number) ?? 0,
    size: (data.size as string) ?? '',
    supplierId: (data.supplierId as string) ?? '',
    supplierName: (data.supplierName as string) ?? '',
    component: (data.component as MetalShoeCase['component']) ?? 'BOTTOM',
    side: (data.side as MetalShoeCase['side']) ?? 'RIGHT',
    piecesQty: (data.piecesQty as number) ?? 1,
    cGradePairs: (data.cGradePairs as number) ?? 0,
    xraySentDate: (data.xraySentDate as string) || undefined,
    xraySentStatus: (data.xraySentStatus as MetalShoeCase['xraySentStatus']) ?? 'NOT_SENT',
    xrayReceivedDate: (data.xrayReceivedDate as string) || undefined,
    metalConfirm: (data.metalConfirm as MetalShoeCase['metalConfirm']) ?? 'NOT_YET',
    remark: (data.remark as string) || undefined,
    isInternalOperation: (data.isInternalOperation as boolean) ?? false,
    returnDashboardIssueId: (data.returnDashboardIssueId as string) || undefined,
    actionPlanStatus: (data.actionPlanStatus as MetalShoeCase['actionPlanStatus']) || undefined,
    actionPlanActions: (data.actionPlanActions as MetalShoeCase['actionPlanActions']) || undefined,
    actionPlanLastSyncedAt: (data.actionPlanLastSyncedAt as string) || undefined,
    status: (data.status as MetalShoeCase['status']) ?? 'registered',
    createdAt: convertTimestamp(data.createdAt as Timestamp | string),
    createdBy: {
      uid: createdBy.uid ?? '',
      email: createdBy.email ?? '',
      displayName: createdBy.displayName ?? '',
    },
    updatedAt: convertTimestamp(data.updatedAt as Timestamp | string),
  };
}

/** Firestore 문서를 MetalShoeActionTracking으로 변환 */
function docToActionTracking(docId: string, data: Record<string, unknown>): MetalShoeActionTracking {
  return {
    id: docId,
    batchWeek: (data.batchWeek as string) ?? '',
    batchYear: (data.batchYear as number) ?? 0,
    supplierActions: (data.supplierActions as MetalShoeActionTracking['supplierActions']) ?? [],
    createdAt: convertTimestamp(data.createdAt as Timestamp | string),
    updatedAt: convertTimestamp(data.updatedAt as Timestamp | string),
  };
}

// ============================================================
// CRUD: Cases
// ============================================================

/** 케이스 목록 조회 (필터 적용) */
export async function getCases(filters: MetalShoeFilters): Promise<MetalShoeCase[]> {
  try {
    const collPath = getCasesCollection(filters.year);
    const constraints: Parameters<typeof query>[1][] = [];

    if (filters.factory) constraints.push(where('factory', '==', filters.factory));
    if (filters.supplierId) constraints.push(where('supplierId', '==', filters.supplierId));
    if (filters.component) constraints.push(where('component', '==', filters.component));
    if (filters.status) constraints.push(where('status', '==', filters.status));
    if (filters.weekNumber) constraints.push(where('weekNumber', '==', filters.weekNumber));
    if (filters.month) constraints.push(where('month', '==', filters.month));

    constraints.push(orderBy('detectionDate', 'desc'));

    const q = query(collection(db, collPath), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) =>
      docToCase(d.id, d.data() as Record<string, unknown>)
    );
  } catch (error) {
    logger.error('[MetalShoeService] getCases failed', error);
    throw error;
  }
}

/** 케이스 ID로 조회 */
export async function getCaseById(year: number, id: string): Promise<MetalShoeCase | null> {
  try {
    const docRef = doc(db, getCasesCollection(year), id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return docToCase(snap.id, snap.data() as Record<string, unknown>);
  } catch (error) {
    logger.error('[MetalShoeService] getCaseById failed', error);
    throw error;
  }
}

/** 케이스 생성 (week/year 자동 계산) */
export async function createCase(
  data: Omit<MetalShoeCase, 'id' | 'createdAt' | 'updatedAt'>,
  user: { uid: string; email: string; displayName: string }
): Promise<MetalShoeCase> {
  try {
    // UTC로 파싱하여 시간대 변환에 의한 날짜 밀림 방지
    const [yy, mm, dd] = data.detectionDate.split('-').map(Number);
    const detectionDate = new Date(Date.UTC(yy, mm - 1, dd));
    const year = detectionDate.getUTCFullYear();
    const month = detectionDate.getUTCMonth() + 1;
    const weekNumber = getISOWeekNumber(detectionDate);
    const monthNames = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const weekStr = `W${String(weekNumber).padStart(2, '0')}_${monthNames[month - 1]}`;

    const docData = {
      ...data,
      year,
      month,
      week: weekStr,
      weekNumber,
      createdBy: user,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const collPath = getCasesCollection(year);
    const docRef = await addDoc(collection(db, collPath), docData);
    logger.info('[MetalShoeService] Created case', { id: docRef.id });

    // 감사 로그 기록 (실패해도 케이스 생성에 영향 없음)
    createAuditLog({
      log_id: `METAL-SHOE-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action: 'CREATE',
      entity_type: 'METAL_SHOE_CASE',
      entity_id: docRef.id,
      changed_by: user.email || user.uid,
      after_data: docData as unknown as Record<string, unknown>,
    }).catch(() => {});

    // Ensure year document exists
    const yearDocRef = doc(db, CASES_BASE, String(year));
    const yearSnap = await getDoc(yearDocRef);
    if (!yearSnap.exists()) {
      await setDoc(yearDocRef, { year, createdAt: serverTimestamp() });
    }

    return {
      ...data,
      id: docRef.id,
      year,
      month,
      week: weekStr,
      weekNumber,
      createdBy: user,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('[MetalShoeService] createCase failed', error);
    throw error;
  }
}

// ─── Status Transition Validation ────────────────────────────
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  registered: ['xray_sent', 'confirmed', 'closed'],
  xray_sent: ['confirmed', 'closed'],
  confirmed: ['action_requested', 'closed'],
  action_requested: ['action_received', 'closed'],
  action_received: ['closed'],
  closed: [],
};

/** 케이스 수정 */
export async function updateCase(year: number, id: string, data: Partial<MetalShoeCase>): Promise<void> {
  try {
    // 상태 전환 검증 (상태 변경 시)
    if (data.status) {
      const docRef = doc(db, getCasesCollection(year), id);
      const existing = await getDoc(docRef);
      if (existing.exists()) {
        const currentStatus = existing.data().status as string;
        const allowed = VALID_STATUS_TRANSITIONS[currentStatus] || [];
        if (currentStatus !== data.status && !allowed.includes(data.status)) {
          throw new Error(`Invalid status transition: ${currentStatus} → ${data.status}`);
        }
      }
    }

    const docRef = doc(db, getCasesCollection(year), id);
    const { id: _, createdAt, createdBy, ...updateData } = data;
    await updateDoc(docRef, { ...updateData, updatedAt: serverTimestamp() });
    logger.info('[MetalShoeService] Updated case', { id });

    // 감사 로그 기록 (실패해도 케이스 수정에 영향 없음)
    createAuditLog({
      log_id: `METAL-SHOE-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action: 'UPDATE',
      entity_type: 'METAL_SHOE_CASE',
      entity_id: id,
      changed_by: '',
      after_data: updateData as unknown as Record<string, unknown>,
    }).catch(() => {});
  } catch (error) {
    logger.error('[MetalShoeService] updateCase failed', error);
    throw error;
  }
}

/** 일괄 케이스 생성 */
export async function createBulkCases(
  cases: Array<Omit<MetalShoeCase, 'id' | 'createdAt' | 'updatedAt'>>,
  user: { uid: string; email: string; displayName: string }
): Promise<number> {
  let count = 0;
  for (const caseData of cases) {
    try {
      await createCase(caseData, user);
      count++;
    } catch (error) {
      logger.error('[MetalShoeService] Bulk create error for case:', error);
    }
  }
  logger.info('[MetalShoeService] Bulk created cases', { total: cases.length, success: count });
  return count;
}

// ============================================================
// CRUD: Action Tracking
// ============================================================

/** 액션 추적 목록 조회 */
export async function getActionTrackings(year?: number): Promise<MetalShoeActionTracking[]> {
  try {
    const constraints: Parameters<typeof query>[1][] = [];
    if (year) constraints.push(where('batchYear', '==', year));
    constraints.push(orderBy('batchWeek', 'desc'));

    const q = query(collection(db, ACTION_TRACKING), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) =>
      docToActionTracking(d.id, d.data() as Record<string, unknown>)
    );
  } catch (error) {
    logger.error('[MetalShoeService] getActionTrackings failed', error);
    throw error;
  }
}

/** 액션 추적 생성 */
export async function createActionTracking(
  data: Omit<MetalShoeActionTracking, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, ACTION_TRACKING), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    logger.info('[MetalShoeService] Created action tracking', { id: docRef.id });
    return docRef.id;
  } catch (error) {
    logger.error('[MetalShoeService] createActionTracking failed', error);
    throw error;
  }
}

/** 액션 추적 수정 */
export async function updateActionTracking(id: string, data: Partial<MetalShoeActionTracking>): Promise<void> {
  try {
    const docRef = doc(db, ACTION_TRACKING, id);
    const { id: _, createdAt, ...updateData } = data;
    await updateDoc(docRef, { ...updateData, updatedAt: serverTimestamp() });
    logger.info('[MetalShoeService] Updated action tracking', { id });
  } catch (error) {
    logger.error('[MetalShoeService] updateActionTracking failed', error);
    throw error;
  }
}

// ============================================================
// Dashboard & Analytics
// ============================================================

/** 대시보드 KPI 계산 */
export async function getDashboardKPIs(year: number, weekNumber?: number): Promise<MetalShoeDashboardKPI> {
  try {
    const cases = await getCases({ year, weekNumber });

    const kpi: MetalShoeDashboardKPI = {
      totalCases: cases.length,
      bottomCases: cases.filter((c) => c.component === 'BOTTOM').length,
      upperCases: cases.filter((c) => c.component === 'UPPER').length,
      xrayPending: cases.filter((c) => c.xraySentStatus === 'NOT_SENT').length,
      actionPending: cases.filter((c) => c.status === 'action_requested').length,
      closedCases: cases.filter((c) => c.status === 'closed').length,
      bySupplier: {},
      byFactory: {},
      weeklyTrend: [],
    };

    // Aggregate by supplier
    for (const c of cases) {
      if (!kpi.bySupplier[c.supplierId]) {
        kpi.bySupplier[c.supplierId] = { total: 0, bottom: 0, upper: 0 };
      }
      kpi.bySupplier[c.supplierId].total++;
      if (c.component === 'BOTTOM') kpi.bySupplier[c.supplierId].bottom++;
      else kpi.bySupplier[c.supplierId].upper++;
    }

    // Aggregate by factory
    for (const c of cases) {
      if (!kpi.byFactory[c.factory]) {
        kpi.byFactory[c.factory] = { total: 0, bottom: 0, upper: 0 };
      }
      kpi.byFactory[c.factory].total++;
      if (c.component === 'BOTTOM') kpi.byFactory[c.factory].bottom++;
      else kpi.byFactory[c.factory].upper++;
    }

    // Weekly trend
    const weekMap = new Map<number, { week: string; total: number; bottom: number; upper: number }>();
    for (const c of cases) {
      if (!weekMap.has(c.weekNumber)) {
        weekMap.set(c.weekNumber, { week: c.week, total: 0, bottom: 0, upper: 0 });
      }
      const w = weekMap.get(c.weekNumber)!;
      w.total++;
      if (c.component === 'BOTTOM') w.bottom++;
      else w.upper++;
    }
    kpi.weeklyTrend = Array.from(weekMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([weekNumber, data]) => ({ ...data, weekNumber }));

    return kpi;
  } catch (error) {
    logger.error('[MetalShoeService] getDashboardKPIs failed', error);
    throw error;
  }
}

// ============================================================
// Supplier List (from config)
// ============================================================

/** 업체 목록 조회 */
export async function getSupplierList(): Promise<Array<{ id: string; name: string; shortName: string; category: string }>> {
  try {
    const docRef = doc(db, 'config', 'suppliers');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as Record<string, unknown>;
      return ((data.items || []) as Array<{ id: string; name: string; shortName: string; category: string; status: string }>)
        .filter((s) => s.status === 'active');
    }
  } catch (error) {
    logger.error('[MetalShoeService] Failed to load suppliers:', error);
  }
  return [];
}
