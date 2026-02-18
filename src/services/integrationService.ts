/**
 * Integration Firebase Service
 *
 * Firestore CRUD operations for the 'integrations' collection.
 * Manages external system integrations (Slack, Teams, Email, Custom API)
 * and dispatches notifications to matching integrations.
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
  serverTimestamp,
  Timestamp,
} from '@/services/firebase';
import { logger } from '@/utils/logger';

// ============================================================
// Collection Names
// ============================================================

const INTEGRATIONS_COLLECTION = 'integrations';

// ============================================================
// Types
// ============================================================

export type IntegrationType = 'slack' | 'teams' | 'email' | 'custom_api';

export interface IntegrationConfig {
  id?: string;
  type: IntegrationType;
  name: string;
  config: Record<string, string>; // type-specific config (webhook_url, api_key, etc.)
  events: string[];
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface IntegrationNotifyResult {
  integration_id: string;
  integration_name: string;
  type: IntegrationType;
  success: boolean;
  error?: string;
}

// ============================================================
// Helper Functions
// ============================================================

/** Timestamp -> ISO string */
const convertTimestampToString = (
  timestamp: Timestamp | string | undefined
): string => {
  if (!timestamp) return '';
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

/** Firestore document -> IntegrationConfig */
const docToIntegrationConfig = (
  docId: string,
  data: Record<string, unknown>
): IntegrationConfig => {
  return {
    id: docId,
    type: (data.type as IntegrationType) || 'custom_api',
    name: (data.name as string) || '',
    config: (data.config as Record<string, string>) || {},
    events: (data.events as string[]) || [],
    enabled: (data.enabled as boolean) ?? false,
    created_at: convertTimestampToString(data.created_at as Timestamp | string | undefined),
    updated_at: convertTimestampToString(data.updated_at as Timestamp | string | undefined),
  };
};

/** Generate unique ID */
const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
};

// ============================================================
// Integration CRUD Operations
// ============================================================

/**
 * Get all integration configurations.
 * Returns all integrations sorted by created_at descending (client-side).
 */
export const getIntegrations = async (): Promise<IntegrationConfig[]> => {
  try {
    const q = query(collection(db, INTEGRATIONS_COLLECTION));
    const snapshot = await getDocs(q);

    const results = snapshot.docs.map((d) =>
      docToIntegrationConfig(d.id, d.data() as Record<string, unknown>)
    );

    // Client-side sort by created_at descending
    results.sort((a, b) => {
      return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
    });

    return results;
  } catch (error) {
    logger.error('[integrationService] getIntegrations failed:', error);
    throw error;
  }
};

/**
 * Create a new integration configuration.
 */
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

/**
 * Update an existing integration configuration.
 */
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

/**
 * Delete an integration configuration.
 */
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

// ============================================================
// Notification Dispatchers
// ============================================================

/**
 * Send a notification to a Slack channel via incoming webhook.
 * Uses Slack Block Kit for rich message formatting.
 *
 * @see https://api.slack.com/messaging/webhooks
 */
export const sendSlackNotification = async (
  webhookUrl: string,
  message: {
    title: string;
    text: string;
    color?: string; // hex color for attachment sidebar
    fields?: Array<{ title: string; value: string; short?: boolean }>;
  }
): Promise<void> => {
  try {
    const slackPayload = {
      attachments: [
        {
          color: message.color || '#2563eb', // default: blue
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: message.title,
                emoji: true,
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: message.text,
              },
            },
            ...(message.fields
              ? [
                  {
                    type: 'section',
                    fields: message.fields.map((f) => ({
                      type: 'mrkdwn',
                      text: `*${f.title}*\n${f.value}`,
                    })),
                  },
                ]
              : []),
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `Q-TRAIN | ${new Date().toISOString()}`,
                },
              ],
            },
          ],
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackPayload),
      signal: AbortSignal.timeout(15000), // 15s timeout
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Slack API returned ${response.status}: ${body}`);
    }

    logger.info('[integrationService] Slack notification sent successfully');
  } catch (error) {
    logger.error('[integrationService] sendSlackNotification failed:', error);
    throw error;
  }
};

/**
 * Send a notification to a Microsoft Teams channel via incoming webhook.
 * Uses Adaptive Cards for rich message formatting.
 *
 * @see https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/connectors-using
 */
export const sendTeamsNotification = async (
  webhookUrl: string,
  message: {
    title: string;
    text: string;
    themeColor?: string; // hex color for card accent
    facts?: Array<{ name: string; value: string }>;
  }
): Promise<void> => {
  try {
    const teamsPayload = {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          contentUrl: null,
          content: {
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.4',
            body: [
              {
                type: 'TextBlock',
                text: message.title,
                weight: 'Bolder',
                size: 'Medium',
                color: 'Accent',
              },
              {
                type: 'TextBlock',
                text: message.text,
                wrap: true,
              },
              ...(message.facts
                ? [
                    {
                      type: 'FactSet',
                      facts: message.facts.map((f) => ({
                        title: f.name,
                        value: f.value,
                      })),
                    },
                  ]
                : []),
              {
                type: 'TextBlock',
                text: `Q-TRAIN | ${new Date().toISOString()}`,
                size: 'Small',
                isSubtle: true,
              },
            ],
          },
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teamsPayload),
      signal: AbortSignal.timeout(15000), // 15s timeout
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Teams API returned ${response.status}: ${body}`);
    }

    logger.info('[integrationService] Teams notification sent successfully');
  } catch (error) {
    logger.error('[integrationService] sendTeamsNotification failed:', error);
    throw error;
  }
};

/**
 * Send a notification to a custom API endpoint.
 * Sends a standardized JSON payload via POST.
 */
const sendCustomApiNotification = async (
  config: Record<string, string>,
  event: string,
  data: Record<string, unknown>
): Promise<void> => {
  const url = config.url || config.api_url;
  if (!url) {
    throw new Error('Custom API integration missing "url" or "api_url" in config');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add API key header if configured
  if (config.api_key) {
    headers['Authorization'] = `Bearer ${config.api_key}`;
  }

  // Add custom headers if present (format: "Header-Name:value,Another:value2")
  if (config.custom_headers) {
    config.custom_headers.split(',').forEach((pair) => {
      const [key, ...valueParts] = pair.split(':');
      if (key && valueParts.length > 0) {
        headers[key.trim()] = valueParts.join(':').trim();
      }
    });
  }

  const payload = {
    source: 'q-train',
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Custom API returned ${response.status}: ${body}`);
  }
};

/**
 * Build a human-readable message from an event and its data.
 * Used to format notifications for Slack and Teams.
 */
const buildNotificationMessage = (
  event: string,
  data: Record<string, unknown>
): { title: string; text: string; fields: Array<{ title: string; value: string }> } => {
  const eventParts = event.split('.');
  const domain = eventParts[0] || 'system';
  const action = eventParts.slice(1).join('.') || 'event';

  const title = `[Q-TRAIN] ${domain.charAt(0).toUpperCase() + domain.slice(1)}: ${action.replace(/_/g, ' ')}`;

  const fields: Array<{ title: string; value: string }> = [];
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined && typeof value !== 'object') {
      fields.push({ title: key, value: String(value) });
    }
  }

  const text = data.message
    ? String(data.message)
    : `Event \`${event}\` triggered at ${new Date().toISOString()}`;

  return { title, text, fields: fields.slice(0, 10) }; // Limit to 10 fields
};

// ============================================================
// Notification Dispatch
// ============================================================

/**
 * Notify all enabled integrations matching the given event.
 * Dispatches to Slack, Teams, Email, or Custom API based on integration type.
 * Returns results for each integration attempt.
 */
export const notifyIntegrations = async (
  event: string,
  data: Record<string, unknown>
): Promise<IntegrationNotifyResult[]> => {
  const results: IntegrationNotifyResult[] = [];

  try {
    // Find enabled integrations that listen for this event
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
            // Email integration requires a backend service or Cloud Function.
            // Log and skip for now - can be extended with Firebase Extensions (e.g., Trigger Email).
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
