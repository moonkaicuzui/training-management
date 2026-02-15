/**
 * Training Plan Firebase Service
 * Firestore CRUD operations for the 'trainingPlans' collection.
 */

import {
  db,
  doc,
  collection,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  getDocs,
  orderBy,
  serverTimestamp,
  Timestamp,
} from '@/services/firebase';

export interface PlannedProgram {
  program_code: string;
  program_name: string;
  planned_sessions: number;
  target_participants: number;
  scheduled_months: number[];
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  budget?: number;
  actual_sessions: number;
  actual_participants: number;
  completion_rate: number;
}

export interface AnnualPlan {
  plan_id: string;
  plan_name: string;
  year: number;
  period: 'YEARLY' | 'QUARTERLY' | 'MONTHLY';
  status: 'DRAFT' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED';
  planned_programs: PlannedProgram[];
  total_budget?: number;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

const COLLECTION = 'trainingPlans';

function convertTimestamp(ts: unknown): string {
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === 'string') return ts;
  return new Date().toISOString();
}

function docToPlan(data: Record<string, unknown>, id: string): AnnualPlan {
  return {
    plan_id: id,
    plan_name: (data.plan_name as string) || '',
    year: (data.year as number) || new Date().getFullYear(),
    period: (data.period as AnnualPlan['period']) || 'YEARLY',
    status: (data.status as AnnualPlan['status']) || 'DRAFT',
    planned_programs: (data.planned_programs as PlannedProgram[]) || [],
    total_budget: data.total_budget as number | undefined,
    created_by: (data.created_by as string) || '',
    created_at: convertTimestamp(data.created_at),
    updated_at: data.updated_at ? convertTimestamp(data.updated_at) : undefined,
  };
}

export async function getTrainingPlans(): Promise<AnnualPlan[]> {
  const q = query(collection(db, COLLECTION), orderBy('year', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => docToPlan(d.data(), d.id));
}

export async function getTrainingPlan(id: string): Promise<AnnualPlan | null> {
  const snapshot = await getDoc(doc(db, COLLECTION, id));
  if (!snapshot.exists()) return null;
  return docToPlan(snapshot.data(), snapshot.id);
}

export async function createTrainingPlan(
  data: Omit<AnnualPlan, 'plan_id' | 'created_at' | 'updated_at'>
): Promise<AnnualPlan> {
  const docRef = doc(collection(db, COLLECTION));
  await setDoc(docRef, {
    ...data,
    plan_id: docRef.id,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return {
    ...data,
    plan_id: docRef.id,
    created_at: new Date().toISOString(),
  };
}

export async function updateTrainingPlan(
  id: string,
  updates: Partial<AnnualPlan>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    ...updates,
    updated_at: serverTimestamp(),
  });
}

export async function deleteTrainingPlan(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
