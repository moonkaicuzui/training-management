/**
 * Material Firebase Service
 *
 * Firestore CRUD operations for 'materials' and 'materialFolders' collections.
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
import type { TrainingMaterial, MaterialFolder, MaterialFilters } from '@/types/material';
import { logger } from '@/utils/logger';

// ============================================================
// Collection Names
// ============================================================

const MATERIALS_COLLECTION = 'materials';
const FOLDERS_COLLECTION = 'materialFolders';

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

const docToMaterial = (docId: string, data: Record<string, unknown>): TrainingMaterial => {
  return {
    id: (data.id as string) || docId,
    name: (data.name as string) || '',
    type: (data.type as TrainingMaterial['type']) || 'other',
    mimeType: (data.mimeType as string) || '',
    size: (data.size as number) || 0,
    folderId: (data.folderId as string) || null,
    programId: (data.programId as string) || null,
    programName: (data.programName as string) || null,
    description: (data.description as string) || '',
    tags: (data.tags as string[]) || [],
    version: (data.version as string) || 'v1.0',
    uploadedBy: (data.uploadedBy as string) || '',
    uploadedAt: convertTimestampToString(data.uploadedAt as Timestamp | string | undefined),
    updatedAt: convertTimestampToString(data.updatedAt as Timestamp | string | undefined),
    downloadCount: (data.downloadCount as number) || 0,
    isStarred: (data.isStarred as boolean) || false,
    isPublic: (data.isPublic as boolean) || false,
    url: (data.url as string) || '',
  };
};

const docToFolder = (docId: string, data: Record<string, unknown>): MaterialFolder => {
  return {
    id: (data.id as string) || docId,
    name: (data.name as string) || '',
    parentId: (data.parentId as string) || null,
    createdAt: convertTimestampToString(data.createdAt as Timestamp | string | undefined),
    updatedAt: convertTimestampToString(data.updatedAt as Timestamp | string | undefined),
    itemCount: (data.itemCount as number) || 0,
  };
};

// ============================================================
// Material Read Operations
// ============================================================

export const getMaterials = async (
  filters?: MaterialFilters
): Promise<TrainingMaterial[]> => {
  const constraints = [];

  if (filters?.folderId !== undefined) {
    constraints.push(where('folderId', '==', filters.folderId));
  }

  constraints.push(orderBy('updatedAt', 'desc'));

  const q = query(collection(db, MATERIALS_COLLECTION), ...constraints);
  const snapshot = await getDocs(q);

  let results = snapshot.docs.map((d) =>
    docToMaterial(d.id, d.data() as Record<string, unknown>)
  );

  // Client-side filters
  if (filters?.type) {
    results = results.filter((m) => m.type === filters.type);
  }
  if (filters?.isStarred) {
    results = results.filter((m) => m.isStarred);
  }
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    results = results.filter(
      (m) =>
        m.name.toLowerCase().includes(searchLower) ||
        m.tags.some((t) => t.toLowerCase().includes(searchLower))
    );
  }

  return results;
};

export const getMaterial = async (
  id: string
): Promise<TrainingMaterial | null> => {
  const docRef = doc(db, MATERIALS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docToMaterial(docSnap.id, docSnap.data() as Record<string, unknown>);
};

// ============================================================
// Material Write Operations
// ============================================================

export const createMaterial = async (
  data: Omit<TrainingMaterial, 'updatedAt'>
): Promise<TrainingMaterial> => {
  try {
    const docRef = doc(db, MATERIALS_COLLECTION, data.id);
    const now = serverTimestamp();

    await setDoc(docRef, {
      ...data,
      updatedAt: now,
    });

    return {
      ...data,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error(`[materialService] createMaterial failed for ${data.id}:`, error);
    throw error;
  }
};

export const updateMaterial = async (
  id: string,
  updates: Partial<TrainingMaterial>
): Promise<void> => {
  try {
    const docRef = doc(db, MATERIALS_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error(`[materialService] updateMaterial failed for ${id}:`, error);
    throw error;
  }
};

export const deleteMaterial = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, MATERIALS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    logger.error(`[materialService] deleteMaterial failed for ${id}:`, error);
    throw error;
  }
};

// ============================================================
// Folder Read Operations
// ============================================================

export const getFolders = async (
  parentId?: string | null
): Promise<MaterialFolder[]> => {
  const constraints = [];

  if (parentId !== undefined) {
    constraints.push(where('parentId', '==', parentId));
  }

  constraints.push(orderBy('name', 'asc'));

  const q = query(collection(db, FOLDERS_COLLECTION), ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) =>
    docToFolder(d.id, d.data() as Record<string, unknown>)
  );
};

// ============================================================
// Folder Write Operations
// ============================================================

export const createFolder = async (
  data: Omit<MaterialFolder, 'createdAt' | 'updatedAt'>
): Promise<MaterialFolder> => {
  try {
    const docRef = doc(db, FOLDERS_COLLECTION, data.id);
    const now = serverTimestamp();

    await setDoc(docRef, {
      ...data,
      createdAt: now,
      updatedAt: now,
    });

    const nowStr = new Date().toISOString();
    return {
      ...data,
      createdAt: nowStr,
      updatedAt: nowStr,
    };
  } catch (error) {
    logger.error(`[materialService] createFolder failed for ${data.id}:`, error);
    throw error;
  }
};

export const updateFolder = async (
  id: string,
  updates: Partial<MaterialFolder>
): Promise<void> => {
  try {
    const docRef = doc(db, FOLDERS_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error(`[materialService] updateFolder failed for ${id}:`, error);
    throw error;
  }
};

export const deleteFolder = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, FOLDERS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    logger.error(`[materialService] deleteFolder failed for ${id}:`, error);
    throw error;
  }
};
