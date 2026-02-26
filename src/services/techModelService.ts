/**
 * TECH / NEW MODEL Firebase Service
 *
 * Firestore CRUD operations for 'tech_models' and 'tech_review_guidelines' collections.
 */

import {
  db,
  doc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  Timestamp,
} from '@/services/firebase';
import { deleteFile } from '@/services/storageService';
import { logger } from '@/utils/logger';
import type {
  TechModel,
  TechReviewGuideline,
  TechModelFilters,
  MaterialPoint,
  ProcessPoint,
  StandardInfo,
  ReferencePhoto,
} from '@/types/techModel';

// ============================================================
// Collection Names
// ============================================================

const MODELS_COLLECTION = 'tech_models';
const GUIDELINES_COLLECTION = 'tech_review_guidelines';

// ============================================================
// Helper Functions
// ============================================================

const convertTimestamp = (
  ts: Timestamp | string | null | undefined
): string => {
  if (!ts) return '';
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  return ts;
};

function docToModel(docId: string, data: Record<string, unknown>): TechModel {
  return {
    id: docId,
    season: (data.season as string) || '',
    modelName: (data.modelName as string) || '',
    createdAt: convertTimestamp(data.createdAt as Timestamp | string),
    updatedAt: convertTimestamp(data.updatedAt as Timestamp | string),
    createdBy: (data.createdBy as string) || '',
  };
}

function docToGuideline(docId: string, data: Record<string, unknown>): TechReviewGuideline {
  return {
    id: docId,
    modelId: (data.modelId as string) || '',
    materialPoint: (data.materialPoint as MaterialPoint) || 'Upper',
    processPoint: (data.processPoint as ProcessPoint) || 'Cutting',
    standardInfo: (data.standardInfo as StandardInfo) || 'Dimension',
    processName: (data.processName as string) || '',
    details: (data.details as string) || '',
    referencePhotos: (data.referencePhotos as ReferencePhoto[]) || [],
    createdAt: convertTimestamp(data.createdAt as Timestamp | string),
    updatedAt: convertTimestamp(data.updatedAt as Timestamp | string),
    createdBy: (data.createdBy as string) || '',
  };
}

// ============================================================
// Model CRUD
// ============================================================

/** 모델 목록 조회 */
export async function getModels(filters?: TechModelFilters): Promise<TechModel[]> {
  try {
    const constraints: Parameters<typeof query>[1][] = [];

    if (filters?.season) {
      constraints.push(where('season', '==', filters.season));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    const q = query(collection(db, MODELS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) =>
      docToModel(d.id, d.data() as Record<string, unknown>)
    );
  } catch (error) {
    logger.error('[TechModelService] getModels failed', error);
    throw error;
  }
}

/** 모델 생성 */
export async function createModel(
  data: Omit<TechModel, 'id' | 'createdAt' | 'updatedAt'>
): Promise<TechModel> {
  try {
    const docData = {
      season: data.season,
      modelName: data.modelName,
      createdBy: data.createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, MODELS_COLLECTION), docData);
    logger.info('[TechModelService] Created model', { id: docRef.id });

    return {
      id: docRef.id,
      season: data.season,
      modelName: data.modelName,
      createdBy: data.createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('[TechModelService] createModel failed', error);
    throw error;
  }
}

/** 모델 수정 */
export async function updateModel(
  id: string,
  data: Partial<Omit<TechModel, 'id' | 'createdAt' | 'createdBy'>>
): Promise<void> {
  try {
    const docRef = doc(db, MODELS_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    logger.info('[TechModelService] Updated model', { id });
  } catch (error) {
    logger.error('[TechModelService] updateModel failed', error);
    throw error;
  }
}

/** 모델 삭제 */
export async function deleteModel(id: string): Promise<void> {
  try {
    // 해당 모델의 리뷰지침도 모두 삭제
    const guidelines = await getGuidelines(id);
    for (const g of guidelines) {
      await deleteGuideline(g.id);
    }

    const docRef = doc(db, MODELS_COLLECTION, id);
    await deleteDoc(docRef);
    logger.info('[TechModelService] Deleted model', { id });
  } catch (error) {
    logger.error('[TechModelService] deleteModel failed', error);
    throw error;
  }
}

// ============================================================
// Guideline CRUD
// ============================================================

/** 지침 목록 조회 */
export async function getGuidelines(modelId?: string): Promise<TechReviewGuideline[]> {
  try {
    const constraints: Parameters<typeof query>[1][] = [];

    if (modelId) {
      constraints.push(where('modelId', '==', modelId));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    const q = query(collection(db, GUIDELINES_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) =>
      docToGuideline(d.id, d.data() as Record<string, unknown>)
    );
  } catch (error) {
    logger.error('[TechModelService] getGuidelines failed', error);
    throw error;
  }
}

/** 지침 생성 */
export async function createGuideline(
  data: Omit<TechReviewGuideline, 'id' | 'createdAt' | 'updatedAt'>
): Promise<TechReviewGuideline> {
  try {
    const docData = {
      modelId: data.modelId,
      materialPoint: data.materialPoint,
      processPoint: data.processPoint,
      standardInfo: data.standardInfo,
      processName: data.processName,
      details: data.details,
      referencePhotos: data.referencePhotos,
      createdBy: data.createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, GUIDELINES_COLLECTION), docData);
    logger.info('[TechModelService] Created guideline', { id: docRef.id });

    return {
      ...data,
      id: docRef.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('[TechModelService] createGuideline failed', error);
    throw error;
  }
}

/** 지침 수정 */
export async function updateGuideline(
  id: string,
  data: Partial<Omit<TechReviewGuideline, 'id' | 'createdAt' | 'createdBy'>>
): Promise<void> {
  try {
    const docRef = doc(db, GUIDELINES_COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    logger.info('[TechModelService] Updated guideline', { id });
  } catch (error) {
    logger.error('[TechModelService] updateGuideline failed', error);
    throw error;
  }
}

/** 지침 삭제 (참조 사진 Storage 삭제 포함) */
export async function deleteGuideline(id: string): Promise<void> {
  try {
    // 먼저 지침 데이터를 조회하여 사진 경로 확인
    const constraints = [where('__name__', '==', id)];
    const q = query(collection(db, GUIDELINES_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const data = snapshot.docs[0].data() as Record<string, unknown>;
      const photos = (data.referencePhotos as ReferencePhoto[]) || [];

      // Storage에서 사진 삭제
      for (const photo of photos) {
        try {
          await deleteFile(photo.storagePath);
        } catch (err) {
          logger.warn('[TechModelService] Failed to delete photo', { path: photo.storagePath, err });
        }
      }
    }

    const docRef = doc(db, GUIDELINES_COLLECTION, id);
    await deleteDoc(docRef);
    logger.info('[TechModelService] Deleted guideline', { id });
  } catch (error) {
    logger.error('[TechModelService] deleteGuideline failed', error);
    throw error;
  }
}
