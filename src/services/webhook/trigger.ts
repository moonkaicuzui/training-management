import {
  db,
  doc,
  collection,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from '@/services/firebase';
import { logger } from '@/utils/logger';
import type { WebhookPayload, WebhookLog } from './types';
import {
  WEBHOOKS_COLLECTION,
  docToWebhookConfig,
  sendWebhookRequest,
  saveWebhookLog,
} from './helpers';

export const triggerWebhooks = async (
  event: string,
  data: Record<string, unknown>
): Promise<WebhookLog[]> => {
  const logs: WebhookLog[] = [];

  try {
    const q = query(
      collection(db, WEBHOOKS_COLLECTION),
      where('enabled', '==', true)
    );
    const snapshot = await getDocs(q);

    const matchingWebhooks = snapshot.docs
      .map((d) => docToWebhookConfig(d.id, d.data() as Record<string, unknown>))
      .filter((wh) => wh.events.includes(event));

    if (matchingWebhooks.length === 0) {
      logger.debug(`[webhookService] No webhooks registered for event: ${event}`);
      return logs;
    }

    logger.info(`[webhookService] Triggering ${matchingWebhooks.length} webhook(s) for event: ${event}`);

    const triggerPromises = matchingWebhooks.map(async (webhook) => {
      const payload: WebhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data,
        webhook_id: webhook.id || '',
      };

      let lastLog: WebhookLog | null = null;
      const maxAttempts = Math.max(1, webhook.retry_count);

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        lastLog = await sendWebhookRequest(webhook, payload, attempt);
        logs.push(lastLog);
        await saveWebhookLog(lastLog);

        if (lastLog.success) {
          break;
        }

        if (attempt < maxAttempts) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      if (lastLog && webhook.id) {
        try {
          await updateDoc(doc(db, WEBHOOKS_COLLECTION, webhook.id), {
            last_triggered_at: serverTimestamp(),
            last_status: lastLog.success ? 'success' : 'failed',
            updated_at: serverTimestamp(),
          });
        } catch {
          logger.warn(`[webhookService] Failed to update last_triggered_at for webhook ${webhook.id}`);
        }
      }
    });

    await Promise.allSettled(triggerPromises);

    return logs;
  } catch (error) {
    logger.error(`[webhookService] triggerWebhooks failed for event "${event}":`, error);
    throw error;
  }
};
