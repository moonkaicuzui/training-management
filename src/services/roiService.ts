/**
 * ROI (Return on Investment) Firebase Service
 *
 * Firestore CRUD operations for the 'training_costs' collection.
 * Manages training cost data for ROI analysis.
 */

import {
  db,
  doc,
  collection,
  getDocs,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from '@/services/firebase';
import { logger } from '@/utils/logger';

// ============================================================
// Collection Name
// ============================================================

const COLLECTION = 'training_costs';

// ============================================================
// Types
// ============================================================

export interface TrainingCost {
  id: string;
  period: string; // YYYY-MM
  instructor_fee: number;
  material_cost: number;
  facility_cost: number;
  other_cost: number;
  total: number;
  created_at: string;
  updated_at: string;
}

export interface TrainingCostInput {
  period: string;
  instructor_fee: number;
  material_cost: number;
  facility_cost: number;
  other_cost: number;
}

// ============================================================
// Helper Functions
// ============================================================

function toTrainingCost(id: string, data: Record<string, unknown>): TrainingCost {
  return {
    id,
    period: (data.period as string) || '',
    instructor_fee: (data.instructor_fee as number) || 0,
    material_cost: (data.material_cost as number) || 0,
    facility_cost: (data.facility_cost as number) || 0,
    other_cost: (data.other_cost as number) || 0,
    total: (data.total as number) || 0,
    created_at: data.created_at instanceof Timestamp
      ? data.created_at.toDate().toISOString()
      : (data.created_at as string) || '',
    updated_at: data.updated_at instanceof Timestamp
      ? data.updated_at.toDate().toISOString()
      : (data.updated_at as string) || '',
  };
}

// ============================================================
// CRUD Operations
// ============================================================

/**
 * Get all training costs, optionally filtered by year
 */
export async function getTrainingCosts(year?: number): Promise<TrainingCost[]> {
  try {
    const q = query(collection(db, COLLECTION), orderBy('period', 'desc'));
    const snapshot = await getDocs(q);

    let costs = snapshot.docs.map((doc) => toTrainingCost(doc.id, doc.data()));

    if (year) {
      const yearStr = String(year);
      costs = costs.filter((c) => c.period.startsWith(yearStr));
    }

    return costs;
  } catch (error) {
    logger.error('[roiService] Failed to get training costs:', error);
    throw error;
  }
}

/**
 * Save or update a training cost entry
 * Uses period (YYYY-MM) as the document ID for upsert behavior
 */
export async function saveTrainingCost(input: TrainingCostInput): Promise<TrainingCost> {
  try {
    const total =
      input.instructor_fee +
      input.material_cost +
      input.facility_cost +
      input.other_cost;

    const docId = `cost-${input.period}`;
    const docRef = doc(db, COLLECTION, docId);

    const data = {
      period: input.period,
      instructor_fee: input.instructor_fee,
      material_cost: input.material_cost,
      facility_cost: input.facility_cost,
      other_cost: input.other_cost,
      total,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    await setDoc(docRef, data, { merge: true });

    logger.log('[roiService] Training cost saved for period:', input.period);

    return {
      id: docId,
      period: input.period,
      instructor_fee: input.instructor_fee,
      material_cost: input.material_cost,
      facility_cost: input.facility_cost,
      other_cost: input.other_cost,
      total,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('[roiService] Failed to save training cost:', error);
    throw error;
  }
}
