/**
 * Trainer Directive Firebase Service
 *
 * Firestore CRUD operations for 'trainer_directives' and 'training_effectiveness' collections.
 */

import {
  db,
  doc,
  collection,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  onSnapshot,
} from '@/services/firebase';
import type {
  TrainerDirective,
  DirectiveStatus,
  TrainingEffectiveness,
} from '@/types/trainerDirective';
import { logger } from '@/utils/logger';

// ============================================================
// Collection Names
// ============================================================

const DIRECTIVES_COLLECTION = 'trainer_directives';
const EFFECTIVENESS_COLLECTION = 'training_effectiveness';

// ============================================================
// Helper Functions
// ============================================================

const convertTimestampToString = (
  timestamp: Timestamp | string | null | undefined
): string | null => {
  if (!timestamp) return null;
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

const docToDirective = (
  docId: string,
  data: Record<string, unknown>
): TrainerDirective => {
  return {
    directive_id: (data.directive_id as string) || docId,
    date: (data.date as string) || '',
    generated_at: convertTimestampToString(
      data.generated_at as Timestamp | string | undefined
    ) || '',
    immediate_actions: (data.immediate_actions as TrainerDirective['immediate_actions']) || [],
    preventive_actions: (data.preventive_actions as TrainerDirective['preventive_actions']) || [],
    ongoing_sessions: (data.ongoing_sessions as TrainerDirective['ongoing_sessions']) || {
      planned: 0,
      overdue: 0,
      completed_this_week: 0,
      avg_score: 0,
    },
    ai_recommendations: (data.ai_recommendations as string[]) || [],
    status: (data.status as DirectiveStatus) || 'generated',
    read_at: convertTimestampToString(data.read_at as Timestamp | string | null),
    acknowledged_at: convertTimestampToString(
      data.acknowledged_at as Timestamp | string | null
    ),
  };
};

const docToEffectiveness = (
  docId: string,
  data: Record<string, unknown>
): TrainingEffectiveness => {
  return {
    effectiveness_id: (data.effectiveness_id as string) || docId,
    year_month: (data.year_month as string) || '',
    generated_at: convertTimestampToString(
      data.generated_at as Timestamp | string | undefined
    ) || '',
    total_trained_employees: (data.total_trained_employees as number) || 0,
    average_improvement_rate: (data.average_improvement_rate as number) || 0,
    improved_count: (data.improved_count as number) || 0,
    unchanged_count: (data.unchanged_count as number) || 0,
    employee_metrics: (data.employee_metrics as TrainingEffectiveness['employee_metrics']) || [],
  };
};

// ============================================================
// Directive Read Operations
// ============================================================

/**
 * Get today's directive
 */
export const getTodayDirective = async (): Promise<TrainerDirective | null> => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const directiveId = `directive-${today}`;
    const docRef = doc(db, DIRECTIVES_COLLECTION, directiveId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;
    return docToDirective(docSnap.id, docSnap.data() as Record<string, unknown>);
  } catch (error) {
    logger.error('[trainerDirectiveService] getTodayDirective failed:', error);
    return null;
  }
};

/**
 * Get directive by date
 */
export const getDirectiveByDate = async (
  date: string
): Promise<TrainerDirective | null> => {
  try {
    const directiveId = `directive-${date}`;
    const docRef = doc(db, DIRECTIVES_COLLECTION, directiveId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;
    return docToDirective(docSnap.id, docSnap.data() as Record<string, unknown>);
  } catch (error) {
    logger.error(`[trainerDirectiveService] getDirectiveByDate failed for ${date}:`, error);
    return null;
  }
};

/**
 * Get recent directives
 */
export const getRecentDirectives = async (
  count: number = 30
): Promise<TrainerDirective[]> => {
  try {
    const q = query(
      collection(db, DIRECTIVES_COLLECTION),
      orderBy('date', 'desc'),
      limit(count)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) =>
      docToDirective(d.id, d.data() as Record<string, unknown>)
    );
  } catch (error) {
    logger.error('[trainerDirectiveService] getRecentDirectives failed:', error);
    return [];
  }
};

/**
 * Get directives by status
 */
export const getDirectivesByStatus = async (
  status: DirectiveStatus
): Promise<TrainerDirective[]> => {
  try {
    const q = query(
      collection(db, DIRECTIVES_COLLECTION),
      where('status', '==', status),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) =>
      docToDirective(d.id, d.data() as Record<string, unknown>)
    );
  } catch (error) {
    logger.error(
      `[trainerDirectiveService] getDirectivesByStatus failed for ${status}:`,
      error
    );
    return [];
  }
};

// ============================================================
// Directive Write Operations
// ============================================================

/**
 * Mark directive as read
 */
export const markDirectiveAsRead = async (
  directiveId: string
): Promise<void> => {
  try {
    const docRef = doc(db, DIRECTIVES_COLLECTION, directiveId);
    await updateDoc(docRef, {
      status: 'read',
      read_at: serverTimestamp(),
    });
  } catch (error) {
    logger.error(
      `[trainerDirectiveService] markDirectiveAsRead failed for ${directiveId}:`,
      error
    );
    throw error;
  }
};

/**
 * Acknowledge directive
 */
export const acknowledgeDirective = async (
  directiveId: string
): Promise<void> => {
  try {
    const docRef = doc(db, DIRECTIVES_COLLECTION, directiveId);
    await updateDoc(docRef, {
      status: 'acknowledged',
      acknowledged_at: serverTimestamp(),
    });
  } catch (error) {
    logger.error(
      `[trainerDirectiveService] acknowledgeDirective failed for ${directiveId}:`,
      error
    );
    throw error;
  }
};

// ============================================================
// Real-time Subscription
// ============================================================

/**
 * Subscribe to today's directive in real-time
 */
export const subscribeToTodayDirective = (
  callback: (directive: TrainerDirective | null) => void
): (() => void) => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const directiveId = `directive-${today}`;
  const docRef = doc(db, DIRECTIVES_COLLECTION, directiveId);

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (!docSnap.exists()) {
        callback(null);
        return;
      }
      callback(
        docToDirective(docSnap.id, docSnap.data() as Record<string, unknown>)
      );
    },
    (error) => {
      logger.error(
        '[trainerDirectiveService] subscribeToTodayDirective failed:',
        error
      );
      callback(null);
    }
  );
};

// ============================================================
// Training Effectiveness Operations
// ============================================================

/**
 * Get recent effectiveness reports
 */
export const getEffectivenessReports = async (
  count: number = 12
): Promise<TrainingEffectiveness[]> => {
  try {
    const q = query(
      collection(db, EFFECTIVENESS_COLLECTION),
      orderBy('generated_at', 'desc'),
      limit(count)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) =>
      docToEffectiveness(d.id, d.data() as Record<string, unknown>)
    );
  } catch (error) {
    logger.error(
      '[trainerDirectiveService] getEffectivenessReports failed:',
      error
    );
    return [];
  }
};

/**
 * Get effectiveness by month
 */
export const getEffectivenessByMonth = async (
  yearMonth: string
): Promise<TrainingEffectiveness | null> => {
  try {
    const q = query(
      collection(db, EFFECTIVENESS_COLLECTION),
      where('year_month', '==', yearMonth),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const firstDoc = snapshot.docs[0];
    return docToEffectiveness(
      firstDoc.id,
      firstDoc.data() as Record<string, unknown>
    );
  } catch (error) {
    logger.error(
      `[trainerDirectiveService] getEffectivenessByMonth failed for ${yearMonth}:`,
      error
    );
    return null;
  }
};
