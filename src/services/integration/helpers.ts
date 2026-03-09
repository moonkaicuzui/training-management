import { Timestamp } from '@/services/firebase';
import type { IntegrationConfig, IntegrationType } from './types';

export const INTEGRATIONS_COLLECTION = 'integrations';

export const convertTimestampToString = (
  timestamp: Timestamp | string | undefined
): string => {
  if (!timestamp) return '';
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

export const docToIntegrationConfig = (
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

export const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
};
