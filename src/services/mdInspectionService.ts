/**
 * Metal Detector Inspection Firebase Service
 *
 * Firestore CRUD operations for 'md_inspections' and 'md_failures' collections.
 */

import {
  db,
  doc,
  collection,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  Timestamp,
} from '@/services/firebase';
import { logger } from '@/utils/logger';
import type {
  MDInspection,
  MDFailure,
  MDFilters,
  MDDashboardKPI,
  MDWeeklyTrend,
  MDWeeklyComparison,
  MDRepeatedIssueSummary,
  MDRepeatedIssue,
  MDEmailRecipient,
  FactoryCode,
  CAStatus,
  ImprovementStatus,
} from '@/types/metalDetector';

// ============================================================
// Collection Names
// ============================================================

const INSPECTIONS_COLLECTION = 'md_inspections';
const FAILURES_COLLECTION = 'md_failures';

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

/** Firestore 문서를 MDInspection으로 변환 */
function docToInspection(docId: string, data: Record<string, unknown>): MDInspection {
  const sensitivity = data.sensitivity as Record<string, number> | undefined;
  return {
    id: docId,
    factory: (data.factory as FactoryCode) || 'A',
    line: (data.line as string) || '',
    machineId: (data.machineId as string) || undefined,
    inspectionDate: (data.inspectionDate as string) || '',
    weekNumber: (data.weekNumber as number) || 0,
    year: (data.year as number) || 0,
    result: (data.result as MDInspection['result']) || 'PASS',
    inspectorName: (data.inspectorName as string) || '',
    inspectorId: (data.inspectorId as string) || undefined,
    sensitivity: sensitivity ? {
      fe: sensitivity.fe ?? 0,
      sus: sensitivity.sus ?? 0,
      nonFe: sensitivity.nonFe ?? 0,
    } : undefined,
    checklist: (data.checklist as MDInspection['checklist']) || undefined,
    hasPhoto: (data.hasPhoto as boolean) || undefined,
    productName: (data.productName as string) || undefined,
    remarks: (data.remarks as string) || undefined,
    createdAt: convertTimestamp(data.createdAt as Timestamp | string),
    updatedAt: convertTimestamp(data.updatedAt as Timestamp | string),
  };
}

/** Firestore 문서를 MDFailure로 변환 */
function docToFailure(docId: string, data: Record<string, unknown>): MDFailure {
  return {
    id: docId,
    inspectionId: (data.inspectionId as string) || '',
    factory: (data.factory as FactoryCode) || 'A',
    line: (data.line as string) || '',
    failureDate: (data.failureDate as string) || '',
    failureType: (data.failureType as string) || '',
    description: (data.description as string) || '',
    caStatus: (data.caStatus as CAStatus) || 'pending',
    caDescription: (data.caDescription as string) || undefined,
    caCompletedAt: convertTimestamp(data.caCompletedAt as Timestamp | string) || undefined,
    caVerifiedBy: (data.caVerifiedBy as string) || undefined,
    createdAt: convertTimestamp(data.createdAt as Timestamp | string),
    updatedAt: convertTimestamp(data.updatedAt as Timestamp | string),
  };
}

// ============================================================
// Inspection CRUD
// ============================================================

/** 점검 목록 조회 (필터 적용) */
export async function getInspections(filters?: MDFilters): Promise<MDInspection[]> {
  try {
    const constraints: Parameters<typeof query>[1][] = [];

    if (filters?.factory) {
      constraints.push(where('factory', '==', filters.factory));
    }
    if (filters?.result) {
      constraints.push(where('result', '==', filters.result));
    }
    if (filters?.year) {
      constraints.push(where('year', '==', filters.year));
    }
    if (filters?.weekNumber) {
      constraints.push(where('weekNumber', '==', filters.weekNumber));
    }
    if (filters?.dateFrom) {
      constraints.push(where('inspectionDate', '>=', filters.dateFrom));
    }
    if (filters?.dateTo) {
      constraints.push(where('inspectionDate', '<=', filters.dateTo));
    }

    constraints.push(orderBy('inspectionDate', 'desc'));

    const q = query(collection(db, INSPECTIONS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) =>
      docToInspection(d.id, d.data() as Record<string, unknown>)
    );
  } catch (error) {
    logger.error('[MDInspectionService] getInspections failed', error);
    throw error;
  }
}

/** 점검 ID로 조회 */
export async function getInspectionById(id: string): Promise<MDInspection | null> {
  try {
    const docRef = doc(db, INSPECTIONS_COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return docToInspection(snapshot.id, snapshot.data() as Record<string, unknown>);
  } catch (error) {
    logger.error('[MDInspectionService] getInspectionById failed', error);
    throw error;
  }
}

/** 점검 생성 (week/year 자동 계산) */
export async function createInspection(
  data: Omit<MDInspection, 'id' | 'weekNumber' | 'year' | 'createdAt' | 'updatedAt'>
): Promise<MDInspection> {
  try {
    const date = new Date(data.inspectionDate);
    const weekNumber = getISOWeekNumber(date);
    const year = date.getFullYear();

    const docData = {
      ...data,
      weekNumber,
      year,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, INSPECTIONS_COLLECTION), docData);
    logger.info('[MDInspectionService] Created inspection', { id: docRef.id });

    return {
      ...data,
      id: docRef.id,
      weekNumber,
      year,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('[MDInspectionService] createInspection failed', error);
    throw error;
  }
}

/** 점검 수정 */
export async function updateInspection(
  id: string,
  data: Partial<Omit<MDInspection, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, INSPECTIONS_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    logger.info('[MDInspectionService] Updated inspection', { id });
  } catch (error) {
    logger.error('[MDInspectionService] updateInspection failed', error);
    throw error;
  }
}

// ============================================================
// Failure CRUD
// ============================================================

/** 불합격 기록 조회 */
export async function getFailures(inspectionId?: string): Promise<MDFailure[]> {
  try {
    const constraints: Parameters<typeof query>[1][] = [];

    if (inspectionId) {
      constraints.push(where('inspectionId', '==', inspectionId));
    }

    constraints.push(orderBy('failureDate', 'desc'));

    const q = query(collection(db, FAILURES_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) =>
      docToFailure(d.id, d.data() as Record<string, unknown>)
    );
  } catch (error) {
    logger.error('[MDInspectionService] getFailures failed', error);
    throw error;
  }
}

/** 불합격 기록 생성 */
export async function createFailure(
  data: Omit<MDFailure, 'id' | 'createdAt' | 'updatedAt'>
): Promise<MDFailure> {
  try {
    const docData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, FAILURES_COLLECTION), docData);
    logger.info('[MDInspectionService] Created failure', { id: docRef.id });

    return {
      ...data,
      id: docRef.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('[MDInspectionService] createFailure failed', error);
    throw error;
  }
}

/** 불합격 CA 상태 업데이트 */
export async function updateFailure(
  id: string,
  data: Partial<Omit<MDFailure, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, FAILURES_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    logger.info('[MDInspectionService] Updated failure', { id });
  } catch (error) {
    logger.error('[MDInspectionService] updateFailure failed', error);
    throw error;
  }
}

// ============================================================
// Dashboard & Analytics
// ============================================================

/** 대시보드 KPI 계산 */
export async function getDashboardKPIs(
  year: number,
  weekNumber?: number
): Promise<MDDashboardKPI> {
  try {
    const constraints: Parameters<typeof query>[1][] = [
      where('year', '==', year),
    ];

    if (weekNumber) {
      constraints.push(where('weekNumber', '==', weekNumber));
    }

    const q = query(collection(db, INSPECTIONS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    const inspections = snapshot.docs.map((d) =>
      docToInspection(d.id, d.data() as Record<string, unknown>)
    );

    const factories: FactoryCode[] = ['A', 'B', 'B3', 'C', 'D', 'FGWH', 'SCANPACK_AB', 'SCANPACK_C', 'SCANPACK_D'];
    const byFactory = {} as MDDashboardKPI['byFactory'];

    factories.forEach((f) => {
      const factoryItems = inspections.filter((i) => i.factory === f);
      const pass = factoryItems.filter((i) => i.result === 'PASS').length;
      byFactory[f] = {
        total: factoryItems.length,
        pass,
        fail: factoryItems.length - pass,
        passRate: factoryItems.length > 0 ? (pass / factoryItems.length) * 100 : 0,
      };
    });

    const passCount = inspections.filter((i) => i.result === 'PASS').length;

    // Open/overdue CAs
    const failureQ = query(
      collection(db, FAILURES_COLLECTION),
      where('caStatus', 'in', ['pending', 'in_progress', 'overdue'])
    );
    const failureSnapshot = await getDocs(failureQ);
    const failures = failureSnapshot.docs.map((d) =>
      docToFailure(d.id, d.data() as Record<string, unknown>)
    );

    return {
      totalInspections: inspections.length,
      passCount,
      failCount: inspections.length - passCount,
      passRate: inspections.length > 0 ? (passCount / inspections.length) * 100 : 0,
      byFactory,
      openCAs: failures.filter((f) => f.caStatus !== 'completed').length,
      overdueCAs: failures.filter((f) => f.caStatus === 'overdue').length,
    };
  } catch (error) {
    logger.error('[MDInspectionService] getDashboardKPIs failed', error);
    throw error;
  }
}

/** 주차별 추세 데이터 */
export async function getWeeklyTrend(
  year: number,
  weekCount: number = 12
): Promise<MDWeeklyTrend[]> {
  try {
    const currentWeek = getISOWeekNumber(new Date());
    const startWeek = Math.max(1, currentWeek - weekCount + 1);

    const q = query(
      collection(db, INSPECTIONS_COLLECTION),
      where('year', '==', year),
      where('weekNumber', '>=', startWeek),
      where('weekNumber', '<=', currentWeek)
    );

    const snapshot = await getDocs(q);
    const inspections = snapshot.docs.map((d) =>
      docToInspection(d.id, d.data() as Record<string, unknown>)
    );

    // Group by week
    const weekMap = new Map<number, MDInspection[]>();
    inspections.forEach((i) => {
      const list = weekMap.get(i.weekNumber) || [];
      list.push(i);
      weekMap.set(i.weekNumber, list);
    });

    const trends: MDWeeklyTrend[] = [];
    for (let w = startWeek; w <= currentWeek; w++) {
      const items = weekMap.get(w) || [];
      const pass = items.filter((i) => i.result === 'PASS').length;
      trends.push({
        weekNumber: w,
        year,
        total: items.length,
        pass,
        fail: items.length - pass,
        passRate: items.length > 0 ? (pass / items.length) * 100 : 0,
      });
    }

    return trends;
  } catch (error) {
    logger.error('[MDInspectionService] getWeeklyTrend failed', error);
    throw error;
  }
}

// ============================================================
// Weekly Comparison & Repeated Issues (이메일 리포트 데이터)
// ============================================================

/** 공장별 통계 계산 헬퍼 */
function calcFactoryStats(inspections: MDInspection[]): Record<FactoryCode, { total: number; pass: number; fail: number; passRate: number }> {
  const factories: FactoryCode[] = ['A', 'B', 'B3', 'C', 'D', 'FGWH', 'SCANPACK_AB', 'SCANPACK_C', 'SCANPACK_D'];
  const result = {} as Record<FactoryCode, { total: number; pass: number; fail: number; passRate: number }>;
  factories.forEach((f) => {
    const items = inspections.filter((i) => i.factory === f);
    const pass = items.filter((i) => i.result === 'PASS').length;
    result[f] = {
      total: items.length,
      pass,
      fail: items.length - pass,
      passRate: items.length > 0 ? (pass / items.length) * 100 : 0,
    };
  });
  return result;
}

/** 주간 비교 (이번주 vs 지난주) */
export async function getWeeklyComparison(
  year: number,
  weekNumber: number
): Promise<MDWeeklyComparison> {
  try {
    const lastWeekNumber = weekNumber > 1 ? weekNumber - 1 : 52;
    const lastWeekYear = weekNumber > 1 ? year : year - 1;

    // 이번주 + 지난주 데이터 조회
    const thisWeekQ = query(
      collection(db, INSPECTIONS_COLLECTION),
      where('year', '==', year),
      where('weekNumber', '==', weekNumber)
    );
    const lastWeekQ = query(
      collection(db, INSPECTIONS_COLLECTION),
      where('year', '==', lastWeekYear),
      where('weekNumber', '==', lastWeekNumber)
    );

    const [thisWeekSnap, lastWeekSnap] = await Promise.all([
      getDocs(thisWeekQ),
      getDocs(lastWeekQ),
    ]);

    const thisWeekInspections = thisWeekSnap.docs.map((d) =>
      docToInspection(d.id, d.data() as Record<string, unknown>)
    );
    const lastWeekInspections = lastWeekSnap.docs.map((d) =>
      docToInspection(d.id, d.data() as Record<string, unknown>)
    );

    const thisWeekByFactory = calcFactoryStats(thisWeekInspections);
    const lastWeekByFactory = calcFactoryStats(lastWeekInspections);

    const thisWeekPassCount = thisWeekInspections.filter((i) => i.result === 'PASS').length;
    const lastWeekPassCount = lastWeekInspections.filter((i) => i.result === 'PASS').length;

    // 공장별 비교
    const factories: FactoryCode[] = ['A', 'B', 'B3', 'C', 'D', 'FGWH', 'SCANPACK_AB', 'SCANPACK_C', 'SCANPACK_D'];
    const factoryComparison = {} as MDWeeklyComparison['factoryComparison'];
    factories.forEach((f) => {
      const lw = lastWeekByFactory[f].fail;
      const tw = thisWeekByFactory[f].fail;
      let improvement: ImprovementStatus = 'no_change';
      if (tw < lw) improvement = 'improved';
      else if (tw > lw) improvement = 'increased';
      factoryComparison[f] = { failedLastWeek: lw, failedThisWeek: tw, improvement };
    });

    // 유지보수 완료율: 지난주 FAIL 검사의 inspectionId로 failure 조회
    const lastWeekFailIds = lastWeekInspections
      .filter((i) => i.result === 'FAIL')
      .map((i) => i.id);
    const machinesFailedLastWeek = lastWeekFailIds.length;

    let machinesFixedOnTime = 0;
    if (machinesFailedLastWeek > 0) {
      const failureQ = query(
        collection(db, FAILURES_COLLECTION),
        where('caStatus', '==', 'completed')
      );
      const failureSnap = await getDocs(failureQ);
      const completedFailures = failureSnap.docs.map((d) =>
        docToFailure(d.id, d.data() as Record<string, unknown>)
      );
      machinesFixedOnTime = completedFailures.filter((f) =>
        lastWeekFailIds.includes(f.inspectionId)
      ).length;
    }

    const maintenanceFixRate = machinesFailedLastWeek > 0
      ? (machinesFixedOnTime / machinesFailedLastWeek) * 100
      : 0;

    return {
      thisWeek: {
        weekNumber,
        totalChecked: thisWeekInspections.length,
        failCount: thisWeekInspections.length - thisWeekPassCount,
        passRate: thisWeekInspections.length > 0
          ? (thisWeekPassCount / thisWeekInspections.length) * 100
          : 0,
        byFactory: thisWeekByFactory,
      },
      lastWeek: {
        weekNumber: lastWeekNumber,
        totalChecked: lastWeekInspections.length,
        failCount: lastWeekInspections.length - lastWeekPassCount,
        passRate: lastWeekInspections.length > 0
          ? (lastWeekPassCount / lastWeekInspections.length) * 100
          : 0,
        byFactory: lastWeekByFactory,
      },
      factoryComparison,
      maintenanceFixRate,
      machinesFixedOnTime,
      machinesFailedLastWeek,
    };
  } catch (error) {
    logger.error('[MDInspectionService] getWeeklyComparison failed', error);
    throw error;
  }
}

/** 반복 이슈 장비 감지 (2주 연속 같은 machineId FAIL) */
export async function getRepeatedIssues(
  year: number,
  weekNumber: number
): Promise<MDRepeatedIssueSummary> {
  try {
    const lastWeekNumber = weekNumber > 1 ? weekNumber - 1 : 52;
    const lastWeekYear = weekNumber > 1 ? year : year - 1;

    // 이번주 + 지난주 FAIL 데이터
    const thisWeekQ = query(
      collection(db, INSPECTIONS_COLLECTION),
      where('year', '==', year),
      where('weekNumber', '==', weekNumber),
      where('result', '==', 'FAIL')
    );
    const lastWeekQ = query(
      collection(db, INSPECTIONS_COLLECTION),
      where('year', '==', lastWeekYear),
      where('weekNumber', '==', lastWeekNumber),
      where('result', '==', 'FAIL')
    );

    // 이번주 전체 (unique machineId 계산용)
    const thisWeekAllQ = query(
      collection(db, INSPECTIONS_COLLECTION),
      where('year', '==', year),
      where('weekNumber', '==', weekNumber)
    );

    const [thisWeekFailSnap, lastWeekFailSnap, thisWeekAllSnap] = await Promise.all([
      getDocs(thisWeekQ),
      getDocs(lastWeekQ),
      getDocs(thisWeekAllQ),
    ]);

    const thisWeekFails = thisWeekFailSnap.docs.map((d) =>
      docToInspection(d.id, d.data() as Record<string, unknown>)
    );
    const lastWeekFails = lastWeekFailSnap.docs.map((d) =>
      docToInspection(d.id, d.data() as Record<string, unknown>)
    );
    const thisWeekAll = thisWeekAllSnap.docs.map((d) =>
      docToInspection(d.id, d.data() as Record<string, unknown>)
    );

    // machineId 기반 반복 감지 (machineId가 없으면 factory+line 조합으로 대체)
    const getMachineKey = (i: MDInspection) => i.machineId || `${i.factory}-${i.line}`;

    const lastWeekFailKeys = new Set(lastWeekFails.map(getMachineKey));
    const repeatedMachines: MDRepeatedIssue[] = [];

    // 이번주 FAIL 중 지난주에도 FAIL인 장비
    const seen = new Set<string>();
    thisWeekFails.forEach((i) => {
      const key = getMachineKey(i);
      if (lastWeekFailKeys.has(key) && !seen.has(key)) {
        seen.add(key);

        // 체크리스트/remarks에서 keyIssue 동적 추출
        let keyIssue = i.remarks || '';
        if (!keyIssue && i.checklist) {
          const failed = Object.entries(i.checklist)
            .filter(([, v]) => v === 'FAIL' || v === 'OFF' || v === 'NG')
            .map(([k]) => k);
          keyIssue = failed.length > 0 ? `Checklist fail: ${failed.join(', ')}` : 'Inspection failed';
        }
        if (!keyIssue) keyIssue = 'Inspection failed';

        repeatedMachines.push({
          machineId: i.machineId || `${i.factory}-${i.line}`,
          factory: i.factory,
          line: i.line,
          keyIssue,
          weeksFailed: [lastWeekNumber, weekNumber],
          status: 'repeated',
        });
      }
    });

    // unique 검사 장비 수 (이번주 기준)
    const uniqueMachines = new Set(thisWeekAll.map(getMachineKey));
    const totalInspected = uniqueMachines.size;

    return {
      machines: repeatedMachines,
      totalInspected,
      repeatedCount: repeatedMachines.length,
      repeatedRate: totalInspected > 0
        ? (repeatedMachines.length / totalInspected) * 100
        : 0,
    };
  } catch (error) {
    logger.error('[MDInspectionService] getRepeatedIssues failed', error);
    throw error;
  }
}

// ============================================================
// Email Recipients CRUD
// ============================================================

const EMAIL_RECIPIENTS_COLLECTION = 'md_email_recipients';

/** Firestore 문서를 MDEmailRecipient로 변환 */
function docToEmailRecipient(docId: string, data: Record<string, unknown>): MDEmailRecipient {
  const notifications = (data.notifications as Record<string, boolean>) || {};
  return {
    id: docId,
    email: (data.email as string) || '',
    name: (data.name as string) || '',
    role: (data.role as MDEmailRecipient['role']) || 'manager',
    factory: (data.factory as FactoryCode) || undefined,
    notifications: {
      weeklyReport: notifications.weeklyReport ?? true,
      failAlert: notifications.failAlert ?? true,
      caOverdue: notifications.caOverdue ?? true,
    },
    isActive: (data.isActive as boolean) ?? true,
    createdAt: convertTimestamp(data.createdAt as Timestamp | string),
    updatedAt: convertTimestamp(data.updatedAt as Timestamp | string),
  };
}

/** 전체 수신자 목록 조회 */
export async function getEmailRecipients(): Promise<MDEmailRecipient[]> {
  try {
    const q = query(
      collection(db, EMAIL_RECIPIENTS_COLLECTION),
      orderBy('name', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) =>
      docToEmailRecipient(d.id, d.data() as Record<string, unknown>)
    );
  } catch (error) {
    logger.error('[MDInspectionService] getEmailRecipients failed', error);
    throw error;
  }
}

/** 수신자 추가 */
export async function addEmailRecipient(
  data: Omit<MDEmailRecipient, 'id' | 'createdAt' | 'updatedAt'>
): Promise<MDEmailRecipient> {
  try {
    const docData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, EMAIL_RECIPIENTS_COLLECTION), docData);
    logger.info('[MDInspectionService] Added email recipient', { id: docRef.id });
    return {
      ...data,
      id: docRef.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('[MDInspectionService] addEmailRecipient failed', error);
    throw error;
  }
}

/** 수신자 수정 */
export async function updateEmailRecipient(
  id: string,
  data: Partial<Omit<MDEmailRecipient, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, EMAIL_RECIPIENTS_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    logger.info('[MDInspectionService] Updated email recipient', { id });
  } catch (error) {
    logger.error('[MDInspectionService] updateEmailRecipient failed', error);
    throw error;
  }
}

/** 수신자 삭제 (실제 삭제) */
export async function removeEmailRecipient(id: string): Promise<void> {
  try {
    const docRef = doc(db, EMAIL_RECIPIENTS_COLLECTION, id);
    await deleteDoc(docRef);
    logger.info('[MDInspectionService] Removed email recipient', { id });
  } catch (error) {
    logger.error('[MDInspectionService] removeEmailRecipient failed', error);
    throw error;
  }
}

/** 해당 알림 유형의 활성 수신자만 반환 */
export async function getRecipientsForNotification(
  type: 'weeklyReport' | 'failAlert' | 'caOverdue'
): Promise<MDEmailRecipient[]> {
  try {
    const q = query(
      collection(db, EMAIL_RECIPIENTS_COLLECTION),
      where('isActive', '==', true),
      where(`notifications.${type}`, '==', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) =>
      docToEmailRecipient(d.id, d.data() as Record<string, unknown>)
    );
  } catch (error) {
    logger.error('[MDInspectionService] getRecipientsForNotification failed', error);
    throw error;
  }
}
