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
// Validation Helpers
// ============================================================

export class CAPAValidationError extends Error {
  field?: string;
  constructor(message: string, field?: string) {
    super(message);
    this.name = 'CAPAValidationError';
    this.field = field;
  }
}

function validateCAPAInput(input: CAPAInput): void {
  if (!input.title?.trim()) {
    throw new CAPAValidationError('Title is required', 'title');
  }
  if (!input.description?.trim()) {
    throw new CAPAValidationError('Description is required', 'description');
  }
  if (!input.type) {
    throw new CAPAValidationError('Type is required', 'type');
  }
  if (!input.severity) {
    throw new CAPAValidationError('Severity is required', 'severity');
  }
  if (!input.source) {
    throw new CAPAValidationError('Source is required', 'source');
  }
  if (!input.owner?.trim()) {
    throw new CAPAValidationError('Reporter/owner is required', 'owner');
  }
  if (!input.discovery?.problemDescription?.trim()) {
    throw new CAPAValidationError('Problem description is required', 'problemDescription');
  }
  if (!input.discovery?.affectedArea?.trim()) {
    throw new CAPAValidationError('Affected area is required', 'affectedArea');
  }
}

function validateStageTransitionData(
  currentStatus: CAPAStatus,
  stageUpdate: CAPAStageUpdate,
  existingData: Record<string, unknown>,
): void {
  switch (currentStatus) {
    case 'discovery': {
      // discovery → investigation: immediate_action 필수
      const discovery = existingData.discovery as Record<string, unknown> | undefined;
      if (!discovery?.immediateActions || !(discovery.immediateActions as string).trim()) {
        throw new CAPAValidationError(
          'Immediate action is required before advancing to investigation',
          'immediateActions',
        );
      }
      // investigation data validation
      if (stageUpdate.investigation) {
        if (!stageUpdate.investigation.rootCauseAnalysis?.trim()) {
          throw new CAPAValidationError('Root cause analysis is required', 'rootCauseAnalysis');
        }
      }
      break;
    }
    case 'investigation': {
      // investigation → action: root_cause 필수 (from investigation data)
      const investigation = existingData.investigation as Record<string, unknown> | undefined;
      if (!investigation?.rootCauseAnalysis || !(investigation.rootCauseAnalysis as string).trim()) {
        // Check if it's being provided in the update
        if (!stageUpdate.investigation?.rootCauseAnalysis?.trim()) {
          throw new CAPAValidationError(
            'Root cause analysis is required before advancing to action',
            'rootCauseAnalysis',
          );
        }
      }
      break;
    }
    case 'action': {
      // action → verification: 최소 1개 조치 항목 필수
      const action = existingData.action as Record<string, unknown> | undefined;
      const correctiveActions = (action?.correctiveActions as unknown[]) || [];
      const preventiveActions = (action?.preventiveActions as unknown[]) || [];
      const totalActions = correctiveActions.length + preventiveActions.length;
      if (totalActions === 0) {
        throw new CAPAValidationError(
          'At least one action item is required before advancing to verification',
          'actionItems',
        );
      }
      break;
    }
    case 'verification': {
      // verification → closed: effectiveness_score 필수
      const verification = existingData.verification as Record<string, unknown> | undefined;
      const score = verification?.effectivenessScore as number | undefined;
      // Check in existing data or in update
      const updateScore = stageUpdate.verification?.effectivenessScore;
      const finalScore = updateScore ?? score;
      if (finalScore === undefined || finalScore === null) {
        throw new CAPAValidationError(
          'Effectiveness score is required before closing',
          'effectivenessScore',
        );
      }
      if (finalScore < 0 || finalScore > 100) {
        throw new CAPAValidationError(
          'Effectiveness score must be between 0 and 100',
          'effectivenessScore',
        );
      }
      break;
    }
  }
}

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
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `CAPA-${year}-${timestamp}-${random}`;
}

/**
 * CAPA 번호 유니크 보장: 생성 후 Firestore에서 중복 체크, 중복 시 재생성 (최대 5회)
 */
async function generateUniqueCAPANumber(): Promise<string> {
  const MAX_ATTEMPTS = 5;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const capaNumber = generateCAPANumber();
    const q = query(collection(db, COLLECTION), where('capaNumber', '==', capaNumber));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return capaNumber;
    }
    logger.warn(`[capaService] CAPA number collision: ${capaNumber}, retrying...`);
  }
  throw new Error('Failed to generate unique CAPA number after maximum attempts');
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
    validateCAPAInput(input);
    const capaNumber = await generateUniqueCAPANumber();
    const capaData = {
      capaNumber,
      title: input.title,
      description: input.description,
      type: input.type,
      status: 'discovery' as CAPAStatus,
      severity: input.severity,
      priority: input.priority,
      source: input.source,
      discovery: {
        ...input.discovery,
        discoveredAt: serverTimestamp(),
      },
      qualityContext: input.qualityContext || null,
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

    // Validate stage-specific required data (skip for rejection)
    if (stageUpdate.status !== 'rejected') {
      const existingData = snapshot.data() as Record<string, unknown>;
      validateStageTransitionData(currentStatus, stageUpdate, existingData);
    }

    const existingDoc = snapshot.data() as Record<string, unknown>;
    const updateData: Record<string, unknown> = {
      status: stageUpdate.status,
      updatedAt: serverTimestamp(),
    };

    // H-5: 기존 단계 데이터와 merge하여 데이터 손실 방지
    if (stageUpdate.investigation) {
      updateData.investigation = {
        ...(existingDoc.investigation as Record<string, unknown> || {}),
        ...stageUpdate.investigation,
        investigatedAt: serverTimestamp(),
      };
    }

    if (stageUpdate.action) {
      updateData.action = {
        ...(existingDoc.action as Record<string, unknown> || {}),
        ...stageUpdate.action,
        plannedAt: serverTimestamp(),
      };
    }

    if (stageUpdate.verification) {
      updateData.verification = {
        ...(existingDoc.verification as Record<string, unknown> || {}),
        ...stageUpdate.verification,
        verifiedAt: serverTimestamp(),
      };
    }

    if (stageUpdate.closure) {
      updateData.closure = {
        ...(existingDoc.closure as Record<string, unknown> || {}),
        ...stageUpdate.closure,
        closedAt: serverTimestamp(),
      };
    }

    // M-3: rejection 사유 저장
    if (stageUpdate.status === 'rejected' && stageUpdate.rejectionReason) {
      updateData.rejectionReason = stageUpdate.rejectionReason;
      updateData.rejectedAt = serverTimestamp();
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
