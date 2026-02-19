/**
 * Recommendation Service
 *
 * Firestore CRUD operations for 5PRS training recommendation collections:
 * - defect_training_mappings
 * - recommendation_thresholds (singleton)
 * - tqc_employee_links
 * - five_prs_enrollment_logs (APPEND-ONLY)
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
  limit,
  Timestamp,
} from '@/services/firebase';
import type {
  DefectTrainingMapping,
  RecommendationThreshold,
  TqcEmployeeLink,
  FivePrsEnrollmentLog,
} from '@/types/recommendation';
import { DEFAULT_THRESHOLDS } from '@/types/recommendation';
import { logger } from '@/utils/logger';

// ============================================================
// Collection Names (snake_case per project convention)
// ============================================================

const COLLECTIONS = {
  MAPPINGS: 'defect_training_mappings',
  THRESHOLDS: 'recommendation_thresholds',
  LINKS: 'tqc_employee_links',
  ENROLLMENT_LOGS: 'five_prs_enrollment_logs',
} as const;

const THRESHOLD_DOC_ID = 'default';

// ============================================================
// Helpers
// ============================================================

const convertTimestamp = (
  timestamp: Timestamp | string | undefined | null
): string => {
  if (!timestamp) return '';
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

// ============================================================
// Defect-Training Mappings
// ============================================================

export const getMappings = async (): Promise<DefectTrainingMapping[]> => {
  const q = query(
    collection(db, COLLECTIONS.MAPPINGS),
    orderBy('defect_type', 'asc'),
    limit(200)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      mapping_id: d.id,
      defect_type: data.defect_type || '',
      program_codes: data.program_codes || [],
      description: data.description,
      is_active: data.is_active !== false,
      created_at: convertTimestamp(data.created_at),
      updated_at: convertTimestamp(data.updated_at),
    };
  });
};

export const createMapping = async (
  input: Omit<DefectTrainingMapping, 'mapping_id' | 'created_at' | 'updated_at'>
): Promise<DefectTrainingMapping> => {
  try {
    const mappingId = `MAP-${Date.now()}`;
    const docRef = doc(db, COLLECTIONS.MAPPINGS, mappingId);
    const now = serverTimestamp();

    await setDoc(docRef, {
      ...input,
      mapping_id: mappingId,
      created_at: now,
      updated_at: now,
    });

    return {
      ...input,
      mapping_id: mappingId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('[recommendationService] createMapping failed:', error);
    throw error;
  }
};

export const updateMapping = async (
  mappingId: string,
  updates: Partial<DefectTrainingMapping>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.MAPPINGS, mappingId);
    await updateDoc(docRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    logger.error(`[recommendationService] updateMapping failed for ${mappingId}:`, error);
    throw error;
  }
};

export const deleteMapping = async (mappingId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.MAPPINGS, mappingId);
    await deleteDoc(docRef);
  } catch (error) {
    logger.error(`[recommendationService] deleteMapping failed for ${mappingId}:`, error);
    throw error;
  }
};

// ============================================================
// Recommendation Thresholds (singleton)
// ============================================================

export const getThresholds = async (): Promise<RecommendationThreshold> => {
  const docRef = doc(db, COLLECTIONS.THRESHOLDS, THRESHOLD_DOC_ID);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    // Return defaults if no document exists
    return {
      threshold_id: THRESHOLD_DOC_ID,
      ...DEFAULT_THRESHOLDS,
      updated_at: '',
      updated_by: '',
    };
  }

  const data = docSnap.data();
  return {
    threshold_id: THRESHOLD_DOC_ID,
    immediate_rate: data.immediate_rate ?? DEFAULT_THRESHOLDS.immediate_rate,
    preventive_rate_min: data.preventive_rate_min ?? DEFAULT_THRESHOLDS.preventive_rate_min,
    preventive_rate_max: data.preventive_rate_max ?? DEFAULT_THRESHOLDS.preventive_rate_max,
    min_validation_count: data.min_validation_count ?? DEFAULT_THRESHOLDS.min_validation_count,
    surge_multiplier: data.surge_multiplier ?? DEFAULT_THRESHOLDS.surge_multiplier,
    surge_min_rate: data.surge_min_rate ?? DEFAULT_THRESHOLDS.surge_min_rate,
    surge_recent_days: data.surge_recent_days ?? DEFAULT_THRESHOLDS.surge_recent_days,
    surge_past_days: data.surge_past_days ?? DEFAULT_THRESHOLDS.surge_past_days,
    updated_at: convertTimestamp(data.updated_at),
    updated_by: data.updated_by || '',
  };
};

export const updateThresholds = async (
  updates: Partial<RecommendationThreshold>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.THRESHOLDS, THRESHOLD_DOC_ID);
    const { threshold_id: _, ...cleanUpdates } = updates;
    await setDoc(docRef, {
      ...cleanUpdates,
      threshold_id: THRESHOLD_DOC_ID,
      updated_at: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    logger.error('[recommendationService] updateThresholds failed:', error);
    throw error;
  }
};

// ============================================================
// TQC-Employee Links
// ============================================================

export const getLinks = async (): Promise<TqcEmployeeLink[]> => {
  const q = query(
    collection(db, COLLECTIONS.LINKS),
    orderBy('tqc_name', 'asc'),
    limit(500)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      link_id: d.id,
      tqc_id: data.tqc_id || '',
      tqc_name: data.tqc_name || '',
      employee_id: data.employee_id || '',
      employee_name: data.employee_name || '',
      created_at: convertTimestamp(data.created_at),
    };
  });
};

export const createLink = async (
  input: Omit<TqcEmployeeLink, 'link_id' | 'created_at'>
): Promise<TqcEmployeeLink> => {
  try {
    const linkId = `LINK-${input.tqc_id}-${input.employee_id}`;
    const docRef = doc(db, COLLECTIONS.LINKS, linkId);

    await setDoc(docRef, {
      ...input,
      link_id: linkId,
      created_at: serverTimestamp(),
    });

    return {
      ...input,
      link_id: linkId,
      created_at: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('[recommendationService] createLink failed:', error);
    throw error;
  }
};

export const deleteLink = async (linkId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.LINKS, linkId);
    await deleteDoc(docRef);
  } catch (error) {
    logger.error(`[recommendationService] deleteLink failed for ${linkId}:`, error);
    throw error;
  }
};

// ============================================================
// Enrollment Logs (APPEND-ONLY)
// ============================================================

export const getEnrollmentLogs = async (): Promise<FivePrsEnrollmentLog[]> => {
  const q = query(
    collection(db, COLLECTIONS.ENROLLMENT_LOGS),
    orderBy('enrolled_at', 'desc'),
    limit(500)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data();
    return {
      log_id: d.id,
      tqc_id: data.tqc_id || '',
      tqc_name: data.tqc_name || '',
      employee_id: data.employee_id || '',
      employee_name: data.employee_name || '',
      program_code: data.program_code || '',
      program_name: data.program_name || '',
      session_id: data.session_id,
      priority: data.priority || 'IMMEDIATE',
      priority_score: data.priority_score || 0,
      defect_types: data.defect_types || [],
      reject_rate: data.reject_rate || 0,
      enrolled_by: data.enrolled_by || '',
      enrolled_at: convertTimestamp(data.enrolled_at),
      year_month: data.year_month || '',
    };
  });
};

export const createEnrollmentLog = async (
  input: Omit<FivePrsEnrollmentLog, 'log_id' | 'enrolled_at'>
): Promise<FivePrsEnrollmentLog> => {
  try {
    const logId = `ENROLL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const docRef = doc(db, COLLECTIONS.ENROLLMENT_LOGS, logId);

    await setDoc(docRef, {
      ...input,
      log_id: logId,
      enrolled_at: serverTimestamp(),
    });

    return {
      ...input,
      log_id: logId,
      enrolled_at: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('[recommendationService] createEnrollmentLog failed:', error);
    throw error;
  }
};
