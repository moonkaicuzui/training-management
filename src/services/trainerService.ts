/**
 * Trainer Firebase Service
 * Firestore CRUD operations for the 'trainers' collection.
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
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  Timestamp,
} from '@/services/firebase';
import type { Trainer } from '@/types';
import { logger } from '@/utils/logger';

const COLLECTION = 'trainers';

function convertTimestamp(ts: unknown): string {
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === 'string') return ts;
  return new Date().toISOString();
}

function docToTrainer(data: Record<string, unknown>, id: string): Trainer {
  return {
    trainer_id: id,
    trainer_name: (data.trainer_name as string) || '',
    trainer_type: (data.trainer_type as Trainer['trainer_type']) || 'INTERNAL',
    department: data.department as string | undefined,
    company: data.company as string | undefined,
    specializations: (data.specializations as string[]) || [],
    email: data.email as string | undefined,
    phone: data.phone as string | undefined,
    certifications: data.certifications as string[] | undefined,
    status: (data.status as Trainer['status']) || 'ACTIVE',
    created_at: convertTimestamp(data.created_at),
    updated_at: convertTimestamp(data.updated_at),
  };
}

export async function getTrainers(status?: string): Promise<Trainer[]> {
  try {
    let q;
    if (status && status !== 'all') {
      q = query(collection(db, COLLECTION), where('status', '==', status), orderBy('trainer_name'));
    } else {
      q = query(collection(db, COLLECTION), orderBy('trainer_name'));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => docToTrainer(d.data(), d.id));
  } catch (error) {
    logger.error('[trainerService] getTrainers failed:', error);
    throw error;
  }
}

export async function getTrainer(id: string): Promise<Trainer | null> {
  try {
    const snapshot = await getDoc(doc(db, COLLECTION, id));
    if (!snapshot.exists()) return null;
    return docToTrainer(snapshot.data(), snapshot.id);
  } catch (error) {
    logger.error('[trainerService] getTrainer failed:', error);
    throw error;
  }
}

export async function createTrainer(
  data: Omit<Trainer, 'trainer_id' | 'created_at' | 'updated_at'>
): Promise<Trainer> {
  try {
    const docRef = doc(collection(db, COLLECTION));
    const trainerData = {
      ...data,
      trainer_id: docRef.id,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };
    await setDoc(docRef, trainerData);
    return {
      ...data,
      trainer_id: docRef.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    logger.error(`[trainerService] createTrainer failed for ${data.trainer_name}:`, error);
    throw error;
  }
}

export async function updateTrainer(
  id: string,
  updates: Partial<Trainer>
): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      ...updates,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    logger.error(`[trainerService] updateTrainer failed for ${id}:`, error);
    throw error;
  }
}

export async function deleteTrainer(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
  } catch (error) {
    logger.error(`[trainerService] deleteTrainer failed for ${id}:`, error);
    throw error;
  }
}
