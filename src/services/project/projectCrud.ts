import {
  db,
  doc,
  collection,
  getDoc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  where,
  getDocs,
  serverTimestamp,
  onSnapshot,
} from '@/services/firebase';
import type { Project } from '@/types/project';
import { COLLECTIONS, generateId, convertDocumentDates } from './common';
import { logger } from '@/utils/logger';

export const getProjects = async (): Promise<Project[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.PROJECTS),
      where('status', '!=', 'archived'),
      orderBy('status'),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) =>
      convertDocumentDates({ id: doc.id, ...doc.data() }) as Project
    );
  } catch (error) {
    logger.error('[projectCrud] getProjects failed:', error);
    throw error;
  }
};

export const getProject = async (projectId: string): Promise<Project | null> => {
  try {
    const docRef = doc(db, COLLECTIONS.PROJECTS, projectId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return convertDocumentDates({ id: docSnap.id, ...docSnap.data() }) as Project;
  } catch (error) {
    logger.error('[projectCrud] getProject failed:', error);
    throw error;
  }
};

export const createProject = async (
  name: string,
  description: string,
  ownerId: string,
  members: string[] = []
): Promise<Project> => {
  try {
    const projectId = generateId('project');
    const now = serverTimestamp();

    const projectData = {
      name,
      description,
      ownerId,
      members: [...new Set([ownerId, ...members])],
      status: 'active' as const,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, COLLECTIONS.PROJECTS, projectId), projectData);

    return {
      id: projectId,
      ...projectData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as Project;
  } catch (error) {
    logger.error('[projectCrud] createProject failed:', error);
    throw error;
  }
};

export const updateProject = async (
  projectId: string,
  data: Partial<Pick<Project, 'name' | 'description' | 'members' | 'status' | 'color' | 'icon'>>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.PROJECTS, projectId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error('[projectCrud] updateProject failed:', error);
    throw error;
  }
};

export const subscribeProjectsRealtime = (
  callback: (projects: Project[]) => void
): (() => void) => {
  const q = query(
    collection(db, COLLECTIONS.PROJECTS),
    orderBy('updatedAt', 'desc'),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const projects = snapshot.docs.map((doc) =>
      convertDocumentDates({ id: doc.id, ...doc.data() }) as Project
    );
    callback(projects);
  });
};
