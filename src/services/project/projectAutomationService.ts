/**
 * 프로젝트 자동화 규칙 서비스
 *
 * 자동화 규칙 CRUD
 */

import {
  db,
  doc,
  collection,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
} from '@/services/firebase';
import type { Automation } from '@/types/project';
import { COLLECTIONS, generateId, convertDocumentDates } from './common';
import { logger } from '@/utils/logger';

// ============================================================
// Automation Service
// ============================================================

/** 프로젝트의 자동화 규칙 조회 */
export const getAutomationsByProject = async (projectId: string): Promise<Automation[]> => {
  try {
    const q = query(
      collection(db, COLLECTIONS.AUTOMATIONS),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) =>
      convertDocumentDates({ id: doc.id, ...doc.data() }) as Automation
    );
  } catch (error) {
    logger.error('[projectAutomationService] getAutomationsByProject failed:', error);
    throw error;
  }
};

/** 자동화 규칙 생성 */
export const createAutomation = async (
  data: Omit<Automation, 'id' | 'createdAt' | 'updatedAt' | 'lastRunAt' | 'runCount'>
): Promise<Automation> => {
  try {
    const automationId = generateId('auto');
    const now = serverTimestamp();

    const automationData = {
      ...data,
      runCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, COLLECTIONS.AUTOMATIONS, automationId), automationData);

    return {
      id: automationId,
      ...data,
      runCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } as Automation;
  } catch (error) {
    logger.error('[projectAutomationService] createAutomation failed:', error);
    throw error;
  }
};

/** 자동화 규칙 수정 */
export const updateAutomation = async (
  automationId: string,
  data: Partial<Automation>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.AUTOMATIONS, automationId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error('[projectAutomationService] updateAutomation failed:', error);
    throw error;
  }
};

/** 자동화 규칙 삭제 */
export const deleteAutomation = async (automationId: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTIONS.AUTOMATIONS, automationId);
    await deleteDoc(docRef);
  } catch (error) {
    logger.error('[projectAutomationService] deleteAutomation failed:', error);
    throw error;
  }
};
