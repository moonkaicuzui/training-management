import {
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from '@/services/firebase';
import type {
  ProjectSettings,
  DefaultViewType,
  NotificationPreferences,
} from '@/types/project';
import { COLLECTIONS, convertDocumentDates } from './common';
import { logger } from '@/utils/logger';

const DEFAULT_SETTINGS: Omit<ProjectSettings, 'projectId' | 'updatedAt'> = {
  projectName: '',
  projectDescription: '',
  defaultView: 'list' as DefaultViewType,
  notifications: {
    taskAssigned: true,
    taskDue: true,
    taskOverdue: true,
    comments: true,
  } as NotificationPreferences,
};

export const getProjectSettings = async (projectId: string): Promise<ProjectSettings> => {
  try {
    const docRef = doc(db, COLLECTIONS.SETTINGS, projectId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        ...DEFAULT_SETTINGS,
        projectId,
        updatedAt: new Date(),
      } as ProjectSettings;
    }

    return convertDocumentDates({ projectId, ...docSnap.data() }) as ProjectSettings;
  } catch (error) {
    logger.error('[projectSettingsService] getProjectSettings failed:', error);
    throw error;
  }
};

export const updateProjectSettings = async (
  projectId: string,
  data: Partial<Pick<ProjectSettings, 'projectName' | 'projectDescription' | 'defaultView' | 'notifications'>>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.SETTINGS, projectId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(docRef, {
        ...DEFAULT_SETTINGS,
        ...data,
        projectId,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    logger.error('[projectSettingsService] updateProjectSettings failed:', error);
    throw error;
  }
};
