/**
 * CAPA Root Cause Knowledge Base Service
 *
 * Manages the capa_root_cause_kb Firestore collection.
 * Supports adoption/rejection feedback to adjust confidence scores.
 */

import {
  db,
  doc,
  collection,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
} from '@/services/firebase';

const COLLECTION = 'capa_root_cause_kb';

export interface CAPARootCauseKB {
  kb_id: string;
  problem_category: string;
  problem_area: string;
  root_cause: string;
  corrective_actions: string[];
  preventive_actions: string[];
  source: 'ai' | 'manual' | 'historical';
  adoption_count: number;
  rejection_count: number;
  confidence_score: number;
  related_capa_ids: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

export async function getKBEntries(problemArea?: string): Promise<CAPARootCauseKB[]> {
  let q;
  if (problemArea) {
    q = query(
      collection(db, COLLECTION),
      where('problem_area', '==', problemArea),
      orderBy('confidence_score', 'desc')
    );
  } else {
    q = query(collection(db, COLLECTION), orderBy('confidence_score', 'desc'));
  }

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ kb_id: d.id, ...d.data() } as CAPARootCauseKB));
}

export async function getKBEntry(kbId: string): Promise<CAPARootCauseKB | null> {
  const docRef = doc(db, COLLECTION, kbId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { kb_id: snap.id, ...snap.data() } as CAPARootCauseKB;
}

export async function createKBEntry(
  data: Omit<CAPARootCauseKB, 'kb_id' | 'created_at' | 'updated_at'>
): Promise<CAPARootCauseKB> {
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    created_at: now,
    updated_at: now,
  });
  return { kb_id: docRef.id, ...data, created_at: now, updated_at: now };
}

export async function adoptSuggestion(kbId: string): Promise<void> {
  const entry = await getKBEntry(kbId);
  if (!entry) return;

  const newAdoption = entry.adoption_count + 1;
  const total = newAdoption + entry.rejection_count;
  const newConfidence = Math.round((newAdoption / total) * 100);

  await updateDoc(doc(db, COLLECTION, kbId), {
    adoption_count: newAdoption,
    confidence_score: newConfidence,
    updated_at: new Date().toISOString(),
  });
}

export async function rejectSuggestion(kbId: string): Promise<void> {
  const entry = await getKBEntry(kbId);
  if (!entry) return;

  const newRejection = entry.rejection_count + 1;
  const total = entry.adoption_count + newRejection;
  const newConfidence = Math.round((entry.adoption_count / total) * 100);

  await updateDoc(doc(db, COLLECTION, kbId), {
    rejection_count: newRejection,
    confidence_score: newConfidence,
    updated_at: new Date().toISOString(),
  });
}

export async function addRelatedCAPA(kbId: string, capaId: string): Promise<void> {
  const entry = await getKBEntry(kbId);
  if (!entry) return;

  const relatedIds = [...(entry.related_capa_ids || []), capaId];
  await updateDoc(doc(db, COLLECTION, kbId), {
    related_capa_ids: relatedIds,
    updated_at: new Date().toISOString(),
  });
}
