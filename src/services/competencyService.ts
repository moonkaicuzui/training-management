/**
 * Competency & Skill Gap Firebase Service
 *
 * Firestore CRUD operations for competency management collections:
 * - competencies
 * - employee_competencies
 * - learning_paths
 * - employee_learning_paths
 * - development_plans
 */

import {
  db,
  doc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  getDoc,
} from '@/services/firebase';
import type {
  Competency,
  CompetencyCategory,
  EmployeeCompetency,
  LearningPath,
  EmployeeLearningPath,
  IndividualDevelopmentPlan,
} from '@/types/curriculum';
import { logger } from '@/utils/logger';

// ============================================================
// Collection Names (snake_case per convention)
// ============================================================

const COMPETENCIES = 'competencies';
const EMPLOYEE_COMPETENCIES = 'employee_competencies';
const LEARNING_PATHS = 'learning_paths';
const EMPLOYEE_LEARNING_PATHS = 'employee_learning_paths';
const DEVELOPMENT_PLANS = 'development_plans';

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

// ============================================================
// Competency CRUD
// ============================================================

export async function getCompetencies(
  category?: CompetencyCategory
): Promise<Competency[]> {
  try {
    const constraints = [];
    if (category) {
      constraints.push(where('category', '==', category));
    }
    constraints.push(orderBy('competency_code'));

    const q = query(collection(db, COMPETENCIES), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        competency_id: docSnap.id,
        competency_code: data.competency_code || '',
        name: data.name || '',
        name_vn: data.name_vn || '',
        name_kr: data.name_kr || '',
        description: data.description || '',
        category: data.category || 'TECHNICAL',
        is_core: data.is_core || false,
        is_active: data.is_active !== false,
        created_at: convertTimestampToString(data.created_at),
        updated_at: convertTimestampToString(data.updated_at),
      } as Competency;
    });
  } catch (error) {
    logger.error('[competencyService] getCompetencies error:', error);
    throw error;
  }
}

export async function createCompetency(
  data: Omit<Competency, 'competency_id' | 'created_at' | 'updated_at'>
): Promise<Competency> {
  try {
    const docRef = await addDoc(collection(db, COMPETENCIES), {
      ...data,
      is_active: data.is_active !== false,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    return {
      ...data,
      competency_id: docRef.id,
      is_active: data.is_active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('[competencyService] createCompetency error:', error);
    throw error;
  }
}

export async function updateCompetency(
  id: string,
  updates: Partial<Competency>
): Promise<void> {
  try {
    const docRef = doc(db, COMPETENCIES, id);
    await updateDoc(docRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    logger.error('[competencyService] updateCompetency error:', error);
    throw error;
  }
}

export async function deleteCompetency(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COMPETENCIES, id));
  } catch (error) {
    logger.error('[competencyService] deleteCompetency error:', error);
    throw error;
  }
}

// ============================================================
// Employee Competency CRUD
// ============================================================

export async function getEmployeeCompetencies(
  employeeId?: string
): Promise<EmployeeCompetency[]> {
  try {
    const constraints = [];
    if (employeeId) {
      constraints.push(where('employee_id', '==', employeeId));
    }

    const q = query(collection(db, EMPLOYEE_COMPETENCIES), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        employee_id: data.employee_id || '',
        competency_id: data.competency_id || '',
        current_level: data.current_level || 'NOVICE',
        target_level: data.target_level || 'COMPETENT',
        last_assessed_at: convertTimestampToString(data.last_assessed_at),
        assessed_by: data.assessed_by || '',
        evidence: data.evidence || [],
      } as EmployeeCompetency;
    });
  } catch (error) {
    logger.error('[competencyService] getEmployeeCompetencies error:', error);
    throw error;
  }
}

export async function updateEmployeeCompetency(
  data: EmployeeCompetency
): Promise<void> {
  try {
    // Use composite key: employee_id + competency_id
    const docId = `${data.employee_id}_${data.competency_id}`;
    const docRef = doc(db, EMPLOYEE_COMPETENCIES, docId);
    const existing = await getDoc(docRef);

    if (existing.exists()) {
      await updateDoc(docRef, {
        ...data,
        last_assessed_at: serverTimestamp(),
      });
    } else {
      const { ...docData } = data;
      await addDoc(collection(db, EMPLOYEE_COMPETENCIES), {
        ...docData,
        last_assessed_at: serverTimestamp(),
      });
    }
  } catch (error) {
    logger.error('[competencyService] updateEmployeeCompetency error:', error);
    throw error;
  }
}

// ============================================================
// Learning Path CRUD
// ============================================================

export async function getLearningPaths(): Promise<LearningPath[]> {
  try {
    const q = query(
      collection(db, LEARNING_PATHS),
      orderBy('path_code')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        path_id: docSnap.id,
        path_code: data.path_code || '',
        name: data.name || '',
        name_vn: data.name_vn || '',
        name_kr: data.name_kr || '',
        description: data.description || '',
        type: data.type || 'ONBOARDING',
        target_positions: data.target_positions || [],
        target_departments: data.target_departments || [],
        required_competencies: data.required_competencies || [],
        programs: data.programs || [],
        estimated_duration_hours: data.estimated_duration_hours || 0,
        validity_months: data.validity_months || null,
        is_mandatory: data.is_mandatory || false,
        is_active: data.is_active !== false,
        created_at: convertTimestampToString(data.created_at),
        updated_at: convertTimestampToString(data.updated_at),
      } as LearningPath;
    });
  } catch (error) {
    logger.error('[competencyService] getLearningPaths error:', error);
    throw error;
  }
}

export async function createLearningPath(
  data: Omit<LearningPath, 'path_id' | 'created_at' | 'updated_at'>
): Promise<LearningPath> {
  try {
    const docRef = await addDoc(collection(db, LEARNING_PATHS), {
      ...data,
      is_active: data.is_active !== false,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    return {
      ...data,
      path_id: docRef.id,
      is_active: data.is_active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('[competencyService] createLearningPath error:', error);
    throw error;
  }
}

export async function updateLearningPath(
  id: string,
  updates: Partial<LearningPath>
): Promise<void> {
  try {
    const docRef = doc(db, LEARNING_PATHS, id);
    await updateDoc(docRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    logger.error('[competencyService] updateLearningPath error:', error);
    throw error;
  }
}

// ============================================================
// Employee Learning Path CRUD
// ============================================================

export async function getEmployeeLearningPaths(
  employeeId?: string
): Promise<EmployeeLearningPath[]> {
  try {
    const constraints = [];
    if (employeeId) {
      constraints.push(where('employee_id', '==', employeeId));
    }

    const q = query(collection(db, EMPLOYEE_LEARNING_PATHS), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        employee_id: data.employee_id || '',
        path_id: data.path_id || '',
        status: data.status || 'NOT_STARTED',
        started_at: convertTimestampToString(data.started_at),
        completed_at: data.completed_at
          ? convertTimestampToString(data.completed_at)
          : undefined,
        expires_at: data.expires_at
          ? convertTimestampToString(data.expires_at)
          : undefined,
        program_progress: data.program_progress || [],
        overall_progress_percent: data.overall_progress_percent || 0,
      } as EmployeeLearningPath;
    });
  } catch (error) {
    logger.error('[competencyService] getEmployeeLearningPaths error:', error);
    throw error;
  }
}

export async function updateEmployeeLearningPath(
  data: EmployeeLearningPath
): Promise<void> {
  try {
    const docId = `${data.employee_id}_${data.path_id}`;
    const docRef = doc(db, EMPLOYEE_LEARNING_PATHS, docId);
    const existing = await getDoc(docRef);

    if (existing.exists()) {
      await updateDoc(docRef, { ...data });
    } else {
      await addDoc(collection(db, EMPLOYEE_LEARNING_PATHS), { ...data });
    }
  } catch (error) {
    logger.error(
      '[competencyService] updateEmployeeLearningPath error:',
      error
    );
    throw error;
  }
}

// ============================================================
// Development Plan CRUD
// ============================================================

export async function getDevelopmentPlans(
  employeeId?: string
): Promise<IndividualDevelopmentPlan[]> {
  try {
    const constraints = [];
    if (employeeId) {
      constraints.push(where('employee_id', '==', employeeId));
    }

    const q = query(collection(db, DEVELOPMENT_PLANS), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        plan_id: docSnap.id,
        employee_id: data.employee_id || '',
        created_at: convertTimestampToString(data.created_at),
        updated_at: convertTimestampToString(data.updated_at),
        created_by: data.created_by || '',
        target_position: data.target_position,
        target_date: data.target_date,
        competency_goals: data.competency_goals || [],
        assigned_paths: data.assigned_paths || [],
        status: data.status || 'DRAFT',
        progress_percent: data.progress_percent || 0,
        manager_notes: data.manager_notes,
        employee_notes: data.employee_notes,
      } as IndividualDevelopmentPlan;
    });
  } catch (error) {
    logger.error('[competencyService] getDevelopmentPlans error:', error);
    throw error;
  }
}

export async function createDevelopmentPlan(
  data: Omit<IndividualDevelopmentPlan, 'plan_id' | 'created_at' | 'updated_at'>
): Promise<IndividualDevelopmentPlan> {
  try {
    const docRef = await addDoc(collection(db, DEVELOPMENT_PLANS), {
      ...data,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    return {
      ...data,
      plan_id: docRef.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('[competencyService] createDevelopmentPlan error:', error);
    throw error;
  }
}

export async function updateDevelopmentPlan(
  id: string,
  updates: Partial<IndividualDevelopmentPlan>
): Promise<void> {
  try {
    const docRef = doc(db, DEVELOPMENT_PLANS, id);
    await updateDoc(docRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    logger.error('[competencyService] updateDevelopmentPlan error:', error);
    throw error;
  }
}
