import {
  db,
  collection,
  query,
  where,
  getDocs,
} from '@/services/firebase';
import { logger } from '@/utils/logger';
import type { IntegrationNotifyResult } from './types';
import { INTEGRATIONS_COLLECTION, docToIntegrationConfig } from './helpers';
import {
  sendSlackNotification,
  sendTeamsNotification,
  sendCustomApiNotification,
  buildNotificationMessage,
} from './notifiers';

export const notifyIntegrations = async (
  event: string,
  data: Record<string, unknown>
): Promise<IntegrationNotifyResult[]> => {
  const results: IntegrationNotifyResult[] = [];

  try {
    const q = query(
      collection(db, INTEGRATIONS_COLLECTION),
      where('enabled', '==', true)
    );
    const snapshot = await getDocs(q);

    const matchingIntegrations = snapshot.docs
      .map((d) => docToIntegrationConfig(d.id, d.data() as Record<string, unknown>))
      .filter((integration) => integration.events.includes(event));

    if (matchingIntegrations.length === 0) {
      logger.debug(`[integrationService] No integrations registered for event: ${event}`);
      return results;
    }

    logger.info(
      `[integrationService] Notifying ${matchingIntegrations.length} integration(s) for event: ${event}`
    );

    const message = buildNotificationMessage(event, data);

    const notifyPromises = matchingIntegrations.map(async (integration) => {
      const result: IntegrationNotifyResult = {
        integration_id: integration.id || '',
        integration_name: integration.name,
        type: integration.type,
        success: false,
      };

      try {
        switch (integration.type) {
          case 'slack': {
            const webhookUrl = integration.config.webhook_url;
            if (!webhookUrl) {
              throw new Error('Slack integration missing "webhook_url" in config');
            }
            await sendSlackNotification(webhookUrl, {
              title: message.title,
              text: message.text,
              fields: message.fields.map((f) => ({ ...f, short: true })),
            });
            break;
          }

          case 'teams': {
            const webhookUrl = integration.config.webhook_url;
            if (!webhookUrl) {
              throw new Error('Teams integration missing "webhook_url" in config');
            }
            await sendTeamsNotification(webhookUrl, {
              title: message.title,
              text: message.text,
              facts: message.fields.map((f) => ({ name: f.title, value: f.value })),
            });
            break;
          }

          case 'email': {
            logger.warn(
              `[integrationService] Email integration "${integration.name}" triggered but email dispatch requires server-side implementation`
            );
            result.error = 'Email dispatch not yet implemented (requires Cloud Function)';
            return result;
          }

          case 'custom_api': {
            await sendCustomApiNotification(integration.config, event, data);
            break;
          }

          default: {
            throw new Error(`Unknown integration type: ${integration.type}`);
          }
        }

        result.success = true;
      } catch (error) {
        result.error = error instanceof Error ? error.message : String(error);
        logger.error(
          `[integrationService] Failed to notify integration "${integration.name}" (${integration.type}):`,
          error
        );
      }

      return result;
    });

    const settled = await Promise.allSettled(notifyPromises);
    for (const outcome of settled) {
      if (outcome.status === 'fulfilled' && outcome.value) {
        results.push(outcome.value);
      }
    }

    return results;
  } catch (error) {
    logger.error(`[integrationService] notifyIntegrations failed for event "${event}":`, error);
    throw error;
  }
};
