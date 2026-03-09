/**
 * CAPA Firebase Service
 *
 * Firestore CRUD operations for 'capas' collection.
 * Handles Corrective and Preventive Action management.
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
  serverTimestamp,
  Timestamp,
} from '@/services/firebase';
import { logger } from '@/utils/logger';
import type {
  CAPA,
  CAPAInput,
  CAPAUpdate,
  CAPAStageUpdate,
  CAPAFilters,
  CAPAStatus,
} from '@/types/capa';

// ============================================================
// Stage Transition Validation
// ============================================================

const VALID_TRANSITIONS: Record<CAPAStatus, CAPAStatus[]> = {
  discovery: ['investigation', 'rejected'],
  investigation: ['action', 'rejected'],
  action: ['verification', 'rejected'],
  verification: ['closed', 'action'],
  closed: [],
  rejected: [],
};

// ============================================================
// Collection Name
// ============================================================

const COLLECTION = 'capas';

// ============================================================
// Helper Functions
// ============================================================

function convertTimestampToDate(timestamp: Timestamp | Date): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp;
}

function convertCAPAFromFirestore(docSnap: { id: string; data: () => Record<string, unknown> }): CAPA {
  const data = docSnap.data() as Record<string, unknown>;
  return {
    ...data,
    id: docSnap.id,
    createdAt: data.createdAt ? convertTimestampToDate(data.createdAt as Timestamp) : new Date(),
    updatedAt: data.updatedAt ? convertTimestampToDate(data.updatedAt as Timestamp) : new Date(),
    dueDate: data.dueDate ? convertTimestampToDate(data.dueDate as Timestamp) : undefined,
  } as CAPA;
}

function generateCAPANumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `CAPA-${year}-${random}`;
}

// ============================================================
// Read Operations
// ============================================================

export async function getCAPAs(filters?: CAPAFilters): Promise<CAPA[]> {
  const capaRef = collection(db, COLLECTION);
  let q = query(capaRef, orderBy('createdAt', 'desc'));

  if (filters?.status && filters.status.length > 0) {
    q = query(q, where('status', 'in', filters.status));
  }

  if (filters?.type) {
    q = query(q, where('type', '==', filters.type));
  }

  if (filters?.severity && filters.severity.length > 0) {
    q = query(q, where('severity', 'in', filters.severity));
  }

  const snapshot = await getDocs(q);
  let capas = snapshot.docs.map(convertCAPAFromFirestore);

  // Client-side filtering for complex filters
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    capas = capas.filter(
      (c) =>
        c.title.toLowerCase().includes(searchLower) ||
        c.description.toLowerCase().includes(searchLower) ||
        c.capaNumber.toLowerCase().includes(searchLower)
    );
  }

  if (filters?.owner) {
    capas = capas.filter((c) => c.owner === filters.owner);
  }

  return capas;
}

export async function getCAPA(id: string): Promise<CAPA | null> {
  const docRef = doc(db, COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return convertCAPAFromFirestore({
    id: docSnap.id,
    data: () => docSnap.data(),
  });
}

// ============================================================
// Write Operations
// ============================================================

export async function createCAPA(input: CAPAInput): Promise<string> {
  try {
    const now = Timestamp.now();
    const capaData = {
      capaNumber: generateCAPANumber(),
      title: input.title,
      description: input.description,
      type: input.type,
      status: 'discovery' as CAPAStatus,
      severity: input.severity,
      priority: input.priority,
      source: input.source,
      discovery: {
        ...input.discovery,
        discoveredAt: now,
      },
      owner: input.owner,
      team: input.team || [],
      relatedTrainingPrograms: input.relatedTrainingPrograms || [],
      createdBy: input.owner,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      dueDate: input.dueDate ? Timestamp.fromDate(input.dueDate) : null,
    };

    const docRef = await addDoc(collection(db, COLLECTION), capaData);
    logger.log('[capaService] Created CAPA:', docRef.id);
    return docRef.id;
  } catch (error) {
    logger.error('[capaService] Failed to create CAPA:', error);
    throw error;
  }
}

export async function updateCAPA(id: string, update: CAPAUpdate): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      ...update,
      updatedAt: serverTimestamp(),
      dueDate: update.dueDate ? Timestamp.fromDate(update.dueDate) : undefined,
    });
    logger.log('[capaService] Updated CAPA:', id);
  } catch (error) {
    logger.error('[capaService] Failed to update CAPA:', error);
    throw error;
  }
}

export async function updateCAPAStage(id: string, stageUpdate: CAPAStageUpdate): Promise<void> {
  try {
    // Validate stage transition
    const docRef = doc(db, COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      throw new Error(`CAPA not found: ${id}`);
    }
    const currentStatus = snapshot.data().status as CAPAStatus;
    const allowedNext = VALID_TRANSITIONS[currentStatus];
    if (!allowedNext || !allowedNext.includes(stageUpdate.status)) {
      throw new Error(
        `Invalid CAPA transition: ${currentStatus} → ${stageUpdate.status}. Allowed: [${allowedNext?.join(', ') ?? 'none'}]`
      );
    }

    const now = Timestamp.now();
    const updateData: Record<string, unknown> = {
      status: stageUpdate.status,
      updatedAt: serverTimestamp(),
    };

    if (stageUpdate.investigation) {
      updateData.investigation = {
        ...stageUpdate.investigation,
        investigatedAt: now,
      };
    }

    if (stageUpdate.action) {
      updateData.action = {
        ...stageUpdate.action,
        plannedAt: now,
      };
    }

    if (stageUpdate.verification) {
      updateData.verification = {
        ...stageUpdate.verification,
        verifiedAt: now,
      };
    }

    if (stageUpdate.closure) {
      updateData.closure = {
        ...stageUpdate.closure,
        closedAt: now,
      };
    }

    await updateDoc(docRef, updateData);
    logger.log('[capaService] Updated CAPA stage:', id, stageUpdate.status);
  } catch (error) {
    logger.error('[capaService] Failed to update CAPA stage:', error);
    throw error;
  }
}

// ============================================================
// Dashboard / Stats
// ============================================================

export async function getAllCAPAs(): Promise<CAPA[]> {
  const capaRef = collection(db, COLLECTION);
  const snapshot = await getDocs(capaRef);
  return snapshot.docs.map(convertCAPAFromFirestore);
}
