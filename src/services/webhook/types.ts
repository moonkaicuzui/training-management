export interface WebhookConfig {
  id?: string;
  name: string;
  url: string;
  events: string[];
  headers?: Record<string, string>;
  secret?: string;
  enabled: boolean;
  retry_count: number;
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
