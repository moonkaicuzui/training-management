/**
 * Webhook Firebase Service
 *
 * Firestore CRUD operations for 'webhooks' and 'webhook_logs' collections.
 * Manages webhook configurations, triggering, and execution logging.
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
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from '@/services/firebase';
import { logger } from '@/utils/logger';

// ============================================================
// Collection Names
// ============================================================

const WEBHOOKS_COLLECTION = 'webhooks';
const WEBHOOK_LOGS_COLLECTION = 'webhook_logs';

// ============================================================
// Types
// ============================================================

export interface WebhookConfig {
  id?: string;
  name: string;
  url: string;
  events: string[]; // e.g., ['training.completed', 'certificate.issued', 'capa.status_changed']
  headers?: Record<string, string>;
  secret?: string; // for signature verification
  enabled: boolean;
  retry_count: number; // max retries on failure
  created_at?: string;
  updated_at?: string;
  last_triggered_at?: string;
  last_status?: 'success' | 'failed';
}

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
  webhook_id: string;
}

export interface WebhookLog {
  id?: string;
  webhook_id: string;
  event: string;
  payload: WebhookPayload;
  response_status?: number;
  response_body?: string;
  success: boolean;
  error?: string;
  attempt: number;
  triggered_at: string;
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

/** Firestore document -> WebhookConfig */
const docToWebhookConfig = (
  docId: string,
  data: Record<string, unknown>
): WebhookConfig => {
  return {
    id: docId,
    name: (data.name as string) || '',
    url: (data.url as string) || '',
    events: (data.events as string[]) || [],
    headers: (data.headers as Record<string, string>) || undefined,
    secret: (data.secret as string) || undefined,
    enabled: (data.enabled as boolean) ?? false,
    retry_count: (data.retry_count as number) ?? 3,
    created_at: convertTimestampToString(data.created_at as Timestamp | string | undefined),
    updated_at: convertTimestampToString(data.updated_at as Timestamp | string | undefined),
    last_triggered_at: convertTimestampToString(data.last_triggered_at as Timestamp | string | undefined),
    last_status: (data.last_status as 'success' | 'failed') || undefined,
  };
};

/** Firestore document -> WebhookLog */
const docToWebhookLog = (
  docId: string,
  data: Record<string, unknown>
): WebhookLog => {
  return {
    id: docId,
    webhook_id: (data.webhook_id as string) || '',
    event: (data.event as string) || '',
    payload: (data.payload as WebhookPayload) || { event: '', timestamp: '', data: {}, webhook_id: '' },
    response_status: (data.response_status as number) || undefined,
    response_body: (data.response_body as string) || undefined,
    success: (data.success as boolean) ?? false,
    error: (data.error as string) || undefined,
    attempt: (data.attempt as number) || 1,
    triggered_at: convertTimestampToString(data.triggered_at as Timestamp | string | undefined),
  };
};

/** Generate unique ID */
const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
};

/**
 * Generate HMAC-like signature for payload verification.
 * Uses a simple hash approach since Web Crypto is async.
 */
const generateSignature = async (
  payload: string,
  secret: string
): Promise<string> => {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

// ============================================================
// Webhook CRUD Operations
// ============================================================

/**
 * Get all webhook configurations.
 * Returns all webhooks sorted by created_at descending (client-side).
 */
export const getWebhooks = async (): Promise<WebhookConfig[]> => {
  try {
    const q = query(collection(db, WEBHOOKS_COLLECTION));
    const snapshot = await getDocs(q);

    const results = snapshot.docs.map((d) =>
      docToWebhookConfig(d.id, d.data() as Record<string, unknown>)
    );

    // Client-side sort by created_at descending
    results.sort((a, b) => {
      return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
    });

    return results;
  } catch (error) {
    logger.error('[webhookService] getWebhooks failed:', error);
    throw error;
  }
};

/**
 * Create a new webhook configuration.
 */
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

/**
 * Update an existing webhook configuration.
 */
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

/**
 * Delete a webhook configuration.
 */
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

// ============================================================
// Webhook Trigger Operations
// ============================================================

/**
 * Send a payload to a single webhook URL with retry logic.
 * Returns the log entry for the execution.
 */
const sendWebhookRequest = async (
  webhook: WebhookConfig,
  payload: WebhookPayload,
  attempt: number = 1
): Promise<WebhookLog> => {
  const triggeredAt = new Date().toISOString();
  const payloadJson = JSON.stringify(payload);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...webhook.headers,
  };

  // Add signature header if secret is configured
  if (webhook.secret) {
    try {
      const signature = await generateSignature(payloadJson, webhook.secret);
      headers['X-Webhook-Signature'] = `sha256=${signature}`;
    } catch {
      logger.warn(`[webhookService] Failed to generate signature for webhook ${webhook.id}`);
    }
  }

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: payloadJson,
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    const responseBody = await response.text().catch(() => '');

    const logEntry: WebhookLog = {
      webhook_id: webhook.id || '',
      event: payload.event,
      payload,
      response_status: response.status,
      response_body: responseBody.substring(0, 1000), // Limit stored response body
      success: response.ok,
      attempt,
      triggered_at: triggeredAt,
    };

    return logEntry;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    const logEntry: WebhookLog = {
      webhook_id: webhook.id || '',
      event: payload.event,
      payload,
      success: false,
      error: errorMessage,
      attempt,
      triggered_at: triggeredAt,
    };

    return logEntry;
  }
};

/**
 * Persist a webhook execution log to Firestore.
 */
const saveWebhookLog = async (logEntry: WebhookLog): Promise<void> => {
  try {
    const logId = generateId('WHL');
    const docRef = doc(db, WEBHOOK_LOGS_COLLECTION, logId);

    await setDoc(docRef, {
      ...logEntry,
      triggered_at: serverTimestamp(),
    });
  } catch (error) {
    logger.error('[webhookService] Failed to save webhook log:', error);
    // Don't throw - logging failure should not break webhook flow
  }
};

/**
 * Trigger all enabled webhooks matching the given event.
 * Sends payloads with retry logic and logs all executions.
 */
export const triggerWebhooks = async (
  event: string,
  data: Record<string, unknown>
): Promise<WebhookLog[]> => {
  const logs: WebhookLog[] = [];

  try {
    // Find enabled webhooks that listen for this event
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

    // Trigger each matching webhook
    const triggerPromises = matchingWebhooks.map(async (webhook) => {
      const payload: WebhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data,
        webhook_id: webhook.id || '',
      };

      let lastLog: WebhookLog | null = null;
      const maxAttempts = Math.max(1, webhook.retry_count);

      // Attempt with retries
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        lastLog = await sendWebhookRequest(webhook, payload, attempt);
        logs.push(lastLog);
        await saveWebhookLog(lastLog);

        if (lastLog.success) {
          break;
        }

        // Wait before retry (exponential backoff: 1s, 2s, 4s, ...)
        if (attempt < maxAttempts) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      // Update webhook's last trigger status
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

// ============================================================
// Webhook Log Operations
// ============================================================

/**
 * Get webhook execution logs.
 * Optionally filter by webhook_id and limit results.
 */
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

// ============================================================
// Test Operations
// ============================================================

/**
 * Send a test payload to a specific webhook.
 * Uses sample data to verify the webhook URL and configuration work correctly.
 */
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
