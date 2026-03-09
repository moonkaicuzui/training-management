import {
  db,
  doc,
  getDoc,
} from '@/services/firebase';
import { logger } from '@/utils/logger';
import type { WebhookPayload, WebhookLog } from './types';
import {
  WEBHOOKS_COLLECTION,
  docToWebhookConfig,
  sendWebhookRequest,
  saveWebhookLog,
} from './helpers';

export const testWebhook = async (id: string): Promise<WebhookLog> => {
  try {
    const docRef = doc(db, WEBHOOKS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error(`Webhook ${id} not found`);
    }

    const webhook = docToWebhookConfig(docSnap.id, docSnap.data() as Record<string, unknown>);

    const testPayload: WebhookPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook payload from Q-TRAIN',
        webhook_name: webhook.name,
        webhook_id: id,
        test: true,
      },
      webhook_id: id,
    };

    const logEntry = await sendWebhookRequest(webhook, testPayload, 1);
    await saveWebhookLog(logEntry);

    logger.info(`[webhookService] Test webhook ${id}: ${logEntry.success ? 'SUCCESS' : 'FAILED'}`);

    return logEntry;
  } catch (error) {
    logger.error(`[webhookService] testWebhook failed for ${id}:`, error);
    throw error;
  }
};
