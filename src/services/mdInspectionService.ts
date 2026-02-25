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
  FactoryCode,
  CAStatus,
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
  const sensitivity = (data.sensitivity as Record<string, number>) || {};
  return {
    id: docId,
    factory: (data.factory as FactoryCode) || 'A',
    line: (data.line as string) || '',
    inspectionDate: (data.inspectionDate as string) || '',
    weekNumber: (data.weekNumber as number) || 0,
    year: (data.year as number) || 0,
    result: (data.result as MDInspection['result']) || 'PASS',
    inspectorName: (data.inspectorName as string) || '',
    inspectorId: (data.inspectorId as string) || undefined,
    sensitivity: {
      fe: sensitivity.fe ?? 0,
      sus: sensitivity.sus ?? 0,
      nonFe: sensitivity.nonFe ?? 0,
    },
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

    const factories: FactoryCode[] = ['A', 'B', 'C', 'D'];
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
