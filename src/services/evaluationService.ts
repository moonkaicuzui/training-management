/**
 * Evaluation Firebase Service
 *
 * Firestore CRUD operations for the 'evaluations' collection.
 * 교육 효과성 평가 (Kirkpatrick 4단계 모델)
 */

import {
  db,
  doc,
  collection,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  Timestamp,
} from '@/services/firebase';

// ============================================================
// Local Types (Kirkpatrick evaluation - page-specific)
// ============================================================

export type KirkpatrickType = 'reaction' | 'learning' | 'behavior' | 'results';
export type EvalStatus = 'pending' | 'submitted' | 'reviewed';

export interface EvaluationResponseItem {
  criteriaId: string;
  score: number;
  comment?: string;
}

export interface TrainingEvaluation {
  id: string;
  programId: string;
  programName: string;
  sessionId: string;
  sessionDate: string;
  employeeId: string;
  employeeName: string;
  department: string;
  evaluationType: KirkpatrickType;
  responses: EvaluationResponseItem[];
  overallScore: number;
  feedback: string;
  submittedAt: string;
  status: EvalStatus;
}

export interface EvaluationFilters {
  programId?: string;
  evaluationType?: KirkpatrickType;
  status?: EvalStatus;
  search?: string;
}

// ============================================================
// Collection Name
// ============================================================

const COLLECTION = 'evaluations';

// ============================================================
// Helper Functions
// ============================================================

const convertTimestampToString = (
  timestamp: Timestamp | string | undefined
): string => {
  if (!timestamp) return '';
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

const docToEvaluation = (docId: string, data: Record<string, unknown>): TrainingEvaluation => {
  return {
    id: (data.id as string) || docId,
    programId: (data.programId as string) || '',
    programName: (data.programName as string) || '',
    sessionId: (data.sessionId as string) || '',
    sessionDate: (data.sessionDate as string) || '',
    employeeId: (data.employeeId as string) || '',
    employeeName: (data.employeeName as string) || '',
    department: (data.department as string) || '',
    evaluationType: (data.evaluationType as KirkpatrickType) || 'reaction',
    responses: (data.responses as EvaluationResponseItem[]) || [],
    overallScore: (data.overallScore as number) || 0,
    feedback: (data.feedback as string) || '',
    submittedAt: convertTimestampToString(data.submittedAt as Timestamp | string | undefined),
    status: (data.status as EvalStatus) || 'pending',
  };
};

// ============================================================
// Read Operations
// ============================================================

export const getEvaluations = async (
  filters?: EvaluationFilters
): Promise<TrainingEvaluation[]> => {
  const constraints = [];

  if (filters?.programId) {
    constraints.push(where('programId', '==', filters.programId));
  }
  if (filters?.evaluationType) {
    constraints.push(where('evaluationType', '==', filters.evaluationType));
  }
  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }

  constraints.push(orderBy('submittedAt', 'desc'));

  const q = query(collection(db, COLLECTION), ...constraints);
  const snapshot = await getDocs(q);

  let results = snapshot.docs.map((d) =>
    docToEvaluation(d.id, d.data() as Record<string, unknown>)
  );

  // Client-side search filter
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    results = results.filter(
      (e) =>
        e.programName.toLowerCase().includes(searchLower) ||
        e.employeeName.toLowerCase().includes(searchLower) ||
        e.department.toLowerCase().includes(searchLower)
    );
  }

  return results;
};

export const getEvaluation = async (
  id: string
): Promise<TrainingEvaluation | null> => {
  const docRef = doc(db, COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docToEvaluation(docSnap.id, docSnap.data() as Record<string, unknown>);
};

export const getEvaluationsByProgram = async (
  programId: string
): Promise<TrainingEvaluation[]> => {
  return getEvaluations({ programId });
};

// ============================================================
// Write Operations
// ============================================================

export const createEvaluation = async (
  data: Omit<TrainingEvaluation, 'submittedAt'>
): Promise<TrainingEvaluation> => {
  const docRef = doc(db, COLLECTION, data.id);
  const now = serverTimestamp();

  await setDoc(docRef, {
    ...data,
    submittedAt: now,
  });

  return {
    ...data,
    submittedAt: new Date().toISOString(),
  };
};

export const updateEvaluation = async (
  id: string,
  updates: Partial<TrainingEvaluation>
): Promise<void> => {
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};
