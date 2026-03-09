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
import type { WebhookConfig } from './types';
import { WEBHOOKS_COLLECTION, docToWebhookConfig, generateId } from './helpers';

export const getWebhooks = async (): Promise<WebhookConfig[]> => {
  try {
    const q = query(collection(db, WEBHOOKS_COLLECTION));
    const snapshot = await getDocs(q);

    const results = snapshot.docs.map((d) =>
      docToWebhookConfig(d.id, d.data() as Record<string, unknown>)
    );

    results.sort((a, b) => {
      return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
    });

    return results;
  } catch (error) {
    logger.error('[webhookService] getWebhooks failed:', error);
    throw error;
  }
};

export const createWebhook = async (
  config: Omit<WebhookConfig, 'id' | 'created_at' | 'updated_at'>
): Promise<WebhookConfig> => {
  try {
    const id = generateId('WH');
    const now = new Date().toISOString();
    const docRef = doc(db, WEBHOOKS_COLLECTION, id);

    const webhookData = {
      ...config,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    await setDoc(docRef, webhookData);

    logger.info(`[webhookService] Created webhook: ${id} (${config.name})`);

    return {
      ...config,
      id,
      created_at: now,
      updated_at: now,
    };
  } catch (error) {
    logger.error(`[webhookService] createWebhook failed for "${config.name}":`, error);
    throw error;
  }
};

export const updateWebhook = async (
  id: string,
  updates: Partial<Omit<WebhookConfig, 'id' | 'created_at'>>
): Promise<void> => {
  try {
    const docRef = doc(db, WEBHOOKS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error(`Webhook ${id} not found`);
    }

    await updateDoc(docRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });

    logger.info(`[webhookService] Updated webhook: ${id}`);
  } catch (error) {
    logger.error(`[webhookService] updateWebhook failed for ${id}:`, error);
    throw error;
  }
};

export const deleteWebhook = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, WEBHOOKS_COLLECTION, id);
    await deleteDoc(docRef);

    logger.info(`[webhookService] Deleted webhook: ${id}`);
  } catch (error) {
    logger.error(`[webhookService] deleteWebhook failed for ${id}:`, error);
    throw error;
  }
};
