/**
 * Inspection & Failure CRUD operations
 */

import { db, doc, collection, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, getDocs, serverTimestamp, writeBatch } from '@/services/firebase';
import { logger } from '@/utils/logger';
import type { MDInspection, MDFailure, MDFilters, MDEmailRecipient } from '@/types/metalDetector';
import { INSPECTIONS_COLLECTION, FAILURES_COLLECTION, EMAIL_RECIPIENTS_COLLECTION, getISOWeekNumber, docToInspection, docToFailure, docToEmailRecipient } from './helpers';

// ============== Inspection CRUD ==============

export async function getInspections(filters?: MDFilters): Promise<MDInspection[]> {
  try {
    const constraints: Parameters<typeof query>[1][] = [];
    if (filters?.factory) constraints.push(where('factory', '==', filters.factory));
    if (filters?.result) constraints.push(where('result', '==', filters.result));
    if (filters?.year) constraints.push(where('year', '==', filters.year));
    if (filters?.weekNumber) constraints.push(where('weekNumber', '==', filters.weekNumber));
    if (filters?.dateFrom) constraints.push(where('inspectionDate', '>=', filters.dateFrom));
    if (filters?.dateTo) constraints.push(where('inspectionDate', '<=', filters.dateTo));
    constraints.push(orderBy('inspectionDate', 'desc'));
    const q = query(collection(db, INSPECTIONS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => docToInspection(d.id, d.data() as Record<string, unknown>));
  } catch (error) {
    logger.error('[MDInspectionService] getInspections failed', error);
    throw error;
  }
}

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

export async function createInspection(data: Omit<MDInspection, 'id' | 'weekNumber' | 'year' | 'createdAt' | 'updatedAt'>): Promise<MDInspection> {
  try {
    // UTC 안전 파싱: YYYY-MM-DD 형식일 경우 로컬 타임존으로 해석하여 날짜 밀림 방지
    const dateStr = data.inspectionDate;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
      ? new Date(dateStr + 'T00:00:00')
      : new Date(dateStr);
    const weekNumber = getISOWeekNumber(date);
    const year = date.getFullYear();
    const docData = { ...data, weekNumber, year, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    const docRef = await addDoc(collection(db, INSPECTIONS_COLLECTION), docData);
    logger.info('[MDInspectionService] Created inspection', { id: docRef.id });
    return { ...data, id: docRef.id, weekNumber, year, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  } catch (error) {
    logger.error('[MDInspectionService] createInspection failed', error);
    throw error;
  }
}

export async function updateInspection(id: string, data: Partial<Omit<MDInspection, 'id' | 'createdAt'>>): Promise<void> {
  try {
    const docRef = doc(db, INSPECTIONS_COLLECTION, id);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
    logger.info('[MDInspectionService] Updated inspection', { id });
  } catch (error) {
    logger.error('[MDInspectionService] updateInspection failed', error);
    throw error;
  }
}

// ============== Failure CRUD ==============

export async function getFailures(inspectionId?: string): Promise<MDFailure[]> {
  try {
    const constraints: Parameters<typeof query>[1][] = [];
    if (inspectionId) constraints.push(where('inspectionId', '==', inspectionId));
    constraints.push(orderBy('failureDate', 'desc'));
    const q = query(collection(db, FAILURES_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => docToFailure(d.id, d.data() as Record<string, unknown>));
  } catch (error) {
    logger.error('[MDInspectionService] getFailures failed', error);
    throw error;
  }
}

export async function createFailure(data: Omit<MDFailure, 'id' | 'createdAt' | 'updatedAt'>): Promise<MDFailure> {
  try {
    const docData = { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    const docRef = await addDoc(collection(db, FAILURES_COLLECTION), docData);
    logger.info('[MDInspectionService] Created failure', { id: docRef.id });
    return { ...data, id: docRef.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  } catch (error) {
    logger.error('[MDInspectionService] createFailure failed', error);
    throw error;
  }
}

/**
 * Atomic: inspection + failure 를 writeBatch 로 한 번에 저장
 * FAIL 결과일 때 inspection 만 저장되고 failure 가 누락되는 문제 방지
 */
export async function createInspectionWithFailure(
  inspectionInput: Omit<MDInspection, 'id' | 'weekNumber' | 'year' | 'createdAt' | 'updatedAt'>,
  failureInput?: Omit<MDFailure, 'id' | 'inspectionId' | 'createdAt' | 'updatedAt'>,
): Promise<{ inspection: MDInspection; failure?: MDFailure }> {
  try {
    // UTC 안전 파싱: YYYY-MM-DD 형식일 경우 로컬 타임존으로 해석하여 날짜 밀림 방지
    const dateStr = inspectionInput.inspectionDate;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
      ? new Date(dateStr + 'T00:00:00')
      : new Date(dateStr);
    const weekNumber = getISOWeekNumber(date);
    const year = date.getFullYear();

    const batch = writeBatch(db);

    // Inspection document
    const inspectionRef = doc(collection(db, INSPECTIONS_COLLECTION));
    const inspectionData = {
      ...inspectionInput,
      weekNumber,
      year,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    batch.set(inspectionRef, inspectionData);

    // Failure document (only when FAIL)
    let failureRef: ReturnType<typeof doc> | null = null;
    let failureData: Record<string, unknown> | null = null;
    if (failureInput) {
      failureRef = doc(collection(db, FAILURES_COLLECTION));
      failureData = {
        ...failureInput,
        inspectionId: inspectionRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      batch.set(failureRef, failureData);
    }

    await batch.commit(); // Atomic!

    const now = new Date().toISOString();
    const inspection: MDInspection = {
      ...inspectionInput,
      id: inspectionRef.id,
      weekNumber,
      year,
      createdAt: now,
      updatedAt: now,
    };

    let failure: MDFailure | undefined;
    if (failureRef && failureInput) {
      failure = {
        ...failureInput,
        id: failureRef.id,
        inspectionId: inspectionRef.id,
        createdAt: now,
        updatedAt: now,
      };
    }

    logger.info('[MDInspectionService] Created inspection+failure atomically', {
      inspectionId: inspectionRef.id,
      failureId: failureRef?.id,
    });

    return { inspection, failure };
  } catch (error) {
    logger.error('[MDInspectionService] createInspectionWithFailure failed', error);
    throw error;
  }
}

// M-7: MD CA 상태 전환 유효성 맵
const VALID_CA_TRANSITIONS: Record<string, string[]> = {
  'pending': ['in_progress'],
  'in_progress': ['completed', 'overdue'],
  'overdue': ['in_progress', 'completed'],
  'completed': [],
};

export async function updateFailure(id: string, data: Partial<Omit<MDFailure, 'id' | 'createdAt'>>): Promise<void> {
  try {
    const docRef = doc(db, FAILURES_COLLECTION, id);

    // M-7: CA 상태 전환 검증
    if (data.caStatus) {
      const existingSnap = await getDoc(docRef);
      if (existingSnap.exists()) {
        const currentStatus = existingSnap.data().caStatus as string;
        const allowed = VALID_CA_TRANSITIONS[currentStatus];
        if (allowed && !allowed.includes(data.caStatus)) {
          throw new Error(
            `Invalid CA status transition: ${currentStatus} → ${data.caStatus}. Allowed: [${allowed.join(', ') || 'none'}]`
          );
        }
      }
    }

    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
    logger.info('[MDInspectionService] Updated failure', { id });
  } catch (error) {
    logger.error('[MDInspectionService] updateFailure failed', error);
    throw error;
  }
}

export async function deleteInspection(id: string): Promise<void> {
  try {
    // 관련 failure 기록도 함께 삭제
    const failures = await getFailures(id);
    const batch = writeBatch(db);
    for (const f of failures) {
      batch.delete(doc(db, FAILURES_COLLECTION, f.id));
    }
    batch.delete(doc(db, INSPECTIONS_COLLECTION, id));
    await batch.commit();
    logger.info('[MDInspectionService] Deleted inspection and related failures', { id, failureCount: failures.length });
  } catch (error) {
    logger.error('[MDInspectionService] deleteInspection failed', error);
    throw error;
  }
}

export async function deleteFailure(id: string): Promise<void> {
  try {
    const docRef = doc(db, FAILURES_COLLECTION, id);
    await deleteDoc(docRef);
    logger.info('[MDInspectionService] Deleted failure', { id });
  } catch (error) {
    logger.error('[MDInspectionService] deleteFailure failed', error);
    throw error;
  }
}

// ============== Email Recipients CRUD ==============

export async function getEmailRecipients(): Promise<MDEmailRecipient[]> {
  try {
    const q = query(collection(db, EMAIL_RECIPIENTS_COLLECTION), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => docToEmailRecipient(d.id, d.data() as Record<string, unknown>));
  } catch (error) {
    logger.error('[MDInspectionService] getEmailRecipients failed', error);
    throw error;
  }
}

export async function addEmailRecipient(data: Omit<MDEmailRecipient, 'id' | 'createdAt' | 'updatedAt'>): Promise<MDEmailRecipient> {
  try {
    const docData = { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    const docRef = await addDoc(collection(db, EMAIL_RECIPIENTS_COLLECTION), docData);
    logger.info('[MDInspectionService] Added email recipient', { id: docRef.id });
    return { ...data, id: docRef.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  } catch (error) {
    logger.error('[MDInspectionService] addEmailRecipient failed', error);
    throw error;
  }
}

export async function updateEmailRecipient(id: string, data: Partial<Omit<MDEmailRecipient, 'id' | 'createdAt'>>): Promise<void> {
  try {
    const docRef = doc(db, EMAIL_RECIPIENTS_COLLECTION, id);
    await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
    logger.info('[MDInspectionService] Updated email recipient', { id });
  } catch (error) {
    logger.error('[MDInspectionService] updateEmailRecipient failed', error);
    throw error;
  }
}

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

export async function getRecipientsForNotification(type: 'weeklyReport' | 'failAlert' | 'caOverdue'): Promise<MDEmailRecipient[]> {
  try {
    const q = query(collection(db, EMAIL_RECIPIENTS_COLLECTION), where('isActive', '==', true), where(`notifications.${type}`, '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => docToEmailRecipient(d.id, d.data() as Record<string, unknown>));
  } catch (error) {
    logger.error('[MDInspectionService] getRecipientsForNotification failed', error);
    throw error;
  }
}
