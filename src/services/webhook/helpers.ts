import {
  db,
  doc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from '@/services/firebase';
import { logger } from '@/utils/logger';
import type { WebhookConfig, WebhookLog, WebhookPayload } from './types';

export const WEBHOOKS_COLLECTION = 'webhooks';
export const WEBHOOK_LOGS_COLLECTION = 'webhook_logs';

export const convertTimestampToString = (
  timestamp: Timestamp | string | undefined
): string => {
  if (!timestamp) return '';
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

export const docToWebhookConfig = (
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

export const docToWebhookLog = (
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

export const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
};

export const generateSignature = async (
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

export const sendWebhookRequest = async (
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
      signal: AbortSignal.timeout(30000),
    });

    const responseBody = await response.text().catch(() => '');

    return {
      webhook_id: webhook.id || '',
      event: payload.event,
      payload,
      response_status: response.status,
      response_body: responseBody.substring(0, 1000),
      success: response.ok,
      attempt,
      triggered_at: triggeredAt,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      webhook_id: webhook.id || '',
      event: payload.event,
      payload,
      success: false,
      error: errorMessage,
      attempt,
      triggered_at: triggeredAt,
    };
  }
};

export const saveWebhookLog = async (logEntry: WebhookLog): Promise<void> => {
  try {
    const logId = generateId('WHL');
    const docRef = doc(db, WEBHOOK_LOGS_COLLECTION, logId);

    await setDoc(docRef, {
      ...logEntry,
      triggered_at: serverTimestamp(),
    });
  } catch (error) {
    logger.error('[webhookService] Failed to save webhook log:', error);
  }
};
