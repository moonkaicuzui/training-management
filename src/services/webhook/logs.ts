import {
  db,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from '@/services/firebase';
import { logger } from '@/utils/logger';
import type { WebhookLog } from './types';
import { WEBHOOK_LOGS_COLLECTION, docToWebhookLog } from './helpers';

export const getWebhookLogs = async (
  webhookId?: string,
  maxResults: number = 100
): Promise<WebhookLog[]> => {
  try {
    const constraints = [];

    if (webhookId) {
      constraints.push(where('webhook_id', '==', webhookId));
    }

    constraints.push(orderBy('triggered_at', 'desc'));
    constraints.push(limit(maxResults));

    const q = query(collection(db, WEBHOOK_LOGS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) =>
      docToWebhookLog(d.id, d.data() as Record<string, unknown>)
    );
  } catch (error) {
    logger.error('[webhookService] getWebhookLogs failed:', error);
    throw error;
  }
};
