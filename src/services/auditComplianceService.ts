/**
 * Audit Compliance Firebase Service
 * Firestore CRUD operations for audit compliance collections.
 */

import {
  db,
  doc,
  collection,
  getDoc,
  setDoc,
  updateDoc,
  query,
  getDocs,
  orderBy,
  serverTimestamp,
  Timestamp,
} from '@/services/firebase';
import type {
  AuditComplianceMetric,
  AuditFinding,
  CorrectiveAction,
} from '@/types/executive';
import { logger } from '@/utils/logger';

const METRICS_COLLECTION = 'auditMetrics';
const FINDINGS_COLLECTION = 'auditFindings';
const ACTIONS_COLLECTION = 'correctiveActions';

function convertTimestamp(ts: unknown): string {
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === 'string') return ts;
  return new Date().toISOString();
}

// ========== Metrics ==========

export async function getAuditMetrics(): Promise<AuditComplianceMetric[]> {
  const q = query(collection(db, METRICS_COLLECTION), orderBy('category'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({
    ...d.data(),
    id: d.id,
    lastChecked: convertTimestamp(d.data().lastChecked),
  })) as AuditComplianceMetric[];
}

export async function updateAuditMetric(
  id: string,
  updates: Partial<AuditComplianceMetric>
): Promise<void> {
  try {
    await updateDoc(doc(db, METRICS_COLLECTION, id), {
      ...updates,
      lastChecked: serverTimestamp(),
    });
  } catch (error) {
    logger.error(`[auditComplianceService] updateAuditMetric failed for ${id}:`, error);
    throw error;
  }
}

export async function createAuditMetric(
  data: Omit<AuditComplianceMetric, 'id'>
): Promise<AuditComplianceMetric> {
  try {
    const docRef = doc(collection(db, METRICS_COLLECTION));
    await setDoc(docRef, {
      ...data,
      lastChecked: serverTimestamp(),
    });
    return { ...data, id: docRef.id };
  } catch (error) {
    logger.error(`[auditComplianceService] createAuditMetric failed:`, error);
    throw error;
  }
}

// ========== Findings ==========

export async function getAuditFindings(): Promise<AuditFinding[]> {
  const q = query(collection(db, FINDINGS_COLLECTION), orderBy('severity'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({
    ...d.data(),
    id: d.id,
  })) as AuditFinding[];
}

export async function createAuditFinding(
  data: Omit<AuditFinding, 'id'>
): Promise<AuditFinding> {
  try {
    const docRef = doc(collection(db, FINDINGS_COLLECTION));
    await setDoc(docRef, data);
    return { ...data, id: docRef.id };
  } catch (error) {
    logger.error(`[auditComplianceService] createAuditFinding failed:`, error);
    throw error;
  }
}

// ========== Corrective Actions ==========

export async function getCorrectiveActions(): Promise<CorrectiveAction[]> {
  const q = query(collection(db, ACTIONS_COLLECTION), orderBy('targetDate'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({
    ...d.data(),
    id: d.id,
  })) as CorrectiveAction[];
}

export async function createCorrectiveAction(
  data: Omit<CorrectiveAction, 'id'>
): Promise<CorrectiveAction> {
  try {
    const docRef = doc(collection(db, ACTIONS_COLLECTION));
    await setDoc(docRef, data);
    return { ...data, id: docRef.id };
  } catch (error) {
    logger.error(`[auditComplianceService] createCorrectiveAction failed:`, error);
    throw error;
  }
}

export async function updateCorrectiveAction(
  id: string,
  updates: Partial<CorrectiveAction>
): Promise<void> {
  try {
    await updateDoc(doc(db, ACTIONS_COLLECTION, id), updates);
  } catch (error) {
    logger.error(`[auditComplianceService] updateCorrectiveAction failed for ${id}:`, error);
    throw error;
  }
}

export async function getCorrectiveAction(id: string): Promise<CorrectiveAction | null> {
  const snapshot = await getDoc(doc(db, ACTIONS_COLLECTION, id));
  if (!snapshot.exists()) return null;
  return { ...snapshot.data(), id: snapshot.id } as CorrectiveAction;
}
