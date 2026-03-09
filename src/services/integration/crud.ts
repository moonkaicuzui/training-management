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
  serverTimestamp,
} from '@/services/firebase';
import { logger } from '@/utils/logger';
import type { IntegrationConfig } from './types';
import { INTEGRATIONS_COLLECTION, docToIntegrationConfig, generateId } from './helpers';

export const getIntegrations = async (): Promise<IntegrationConfig[]> => {
  try {
    const q = query(collection(db, INTEGRATIONS_COLLECTION));
    const snapshot = await getDocs(q);

    const results = snapshot.docs.map((d) =>
      docToIntegrationConfig(d.id, d.data() as Record<string, unknown>)
    );

    results.sort((a, b) => {
      return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
    });

    return results;
  } catch (error) {
    logger.error('[integrationService] getIntegrations failed:', error);
    throw error;
  }
};

export const createIntegration = async (
  config: Omit<IntegrationConfig, 'id' | 'created_at' | 'updated_at'>
): Promise<IntegrationConfig> => {
  try {
    const id = generateId('INT');
    const now = new Date().toISOString();
    const docRef = doc(db, INTEGRATIONS_COLLECTION, id);

    const integrationData = {
      ...config,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    await setDoc(docRef, integrationData);

    logger.info(`[integrationService] Created integration: ${id} (${config.name}, type: ${config.type})`);

    return {
      ...config,
      id,
      created_at: now,
      updated_at: now,
    };
  } catch (error) {
    logger.error(`[integrationService] createIntegration failed for "${config.name}":`, error);
    throw error;
  }
};

export const updateIntegration = async (
  id: string,
  updates: Partial<Omit<IntegrationConfig, 'id' | 'created_at'>>
): Promise<void> => {
  try {
    const docRef = doc(db, INTEGRATIONS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error(`Integration ${id} not found`);
    }

    await updateDoc(docRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });

    logger.info(`[integrationService] Updated integration: ${id}`);
  } catch (error) {
    logger.error(`[integrationService] updateIntegration failed for ${id}:`, error);
    throw error;
  }
};

export const deleteIntegration = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, INTEGRATIONS_COLLECTION, id);
    await deleteDoc(docRef);

    logger.info(`[integrationService] Deleted integration: ${id}`);
  } catch (error) {
    logger.error(`[integrationService] deleteIntegration failed for ${id}:`, error);
    throw error;
  }
};
