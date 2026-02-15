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
  await updateDoc(doc(db, METRICS_COLLECTION, id), {
    ...updates,
    lastChecked: serverTimestamp(),
  });
}

export async function createAuditMetric(
  data: Omit<AuditComplianceMetric, 'id'>
): Promise<AuditComplianceMetric> {
  const docRef = doc(collection(db, METRICS_COLLECTION));
  await setDoc(docRef, {
    ...data,
    lastChecked: serverTimestamp(),
  });
  return { ...data, id: docRef.id };
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
  const docRef = doc(collection(db, FINDINGS_COLLECTION));
  await setDoc(docRef, data);
  return { ...data, id: docRef.id };
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
  const docRef = doc(collection(db, ACTIONS_COLLECTION));
  await setDoc(docRef, data);
  return { ...data, id: docRef.id };
}

export async function updateCorrectiveAction(
  id: string,
  updates: Partial<CorrectiveAction>
): Promise<void> {
  await updateDoc(doc(db, ACTIONS_COLLECTION, id), updates);
}

export async function getCorrectiveAction(id: string): Promise<CorrectiveAction | null> {
  const snapshot = await getDoc(doc(db, ACTIONS_COLLECTION, id));
  if (!snapshot.exists()) return null;
  return { ...snapshot.data(), id: snapshot.id } as CorrectiveAction;
}
