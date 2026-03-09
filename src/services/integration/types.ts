export type IntegrationType = 'slack' | 'teams' | 'email' | 'custom_api';

export interface IntegrationConfig {
  id?: string;
  type: IntegrationType;
  name: string;
  config: Record<string, string>;
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
