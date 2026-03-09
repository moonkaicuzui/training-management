import { Timestamp } from '@/services/firebase';
import type {
  WorkflowRule,
  WorkflowExecutionLog,
  WorkflowEventType,
  WorkflowCondition,
} from './types';

export const RULES_COLLECTION = 'workflow_rules';
export const EXECUTION_LOGS_COLLECTION = 'workflow_execution_logs';

export const convertTimestampToString = (
  timestamp: Timestamp | string | undefined
): string => {
  if (!timestamp) return '';
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

export const docToWorkflowRule = (docId: string, data: Record<string, unknown>): WorkflowRule => {
  return {
    id: docId,
    name: (data.name as string) || '',
    description: (data.description as string) || '',
    event: (data.event as WorkflowEventType) || 'training_completed',
    conditions: (data.conditions as WorkflowCondition[]) || [],
    actions: (data.actions as WorkflowRule['actions']) || [],
    enabled: (data.enabled as boolean) ?? true,
    created_at: convertTimestampToString(data.created_at as Timestamp | string | undefined),
    updated_at: convertTimestampToString(data.updated_at as Timestamp | string | undefined),
  };
};

export const docToExecutionLog = (docId: string, data: Record<string, unknown>): WorkflowExecutionLog => {
  return {
    id: docId,
    rule_id: (data.rule_id as string) || '',
    rule_name: (data.rule_name as string) || '',
    event: (data.event as WorkflowEventType) || 'training_completed',
    trigger_data: (data.trigger_data as Record<string, unknown>) || {},
    actions_executed: (data.actions_executed as WorkflowExecutionLog['actions_executed']) || [],
    executed_at: convertTimestampToString(data.executed_at as Timestamp | string | undefined),
    executed_by: (data.executed_by as string) || '',
  };
};

export function generateRuleId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `wfr_${timestamp}_${random}`;
}

export function generateLogId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `wfl_${timestamp}_${random}`;
}

export function resolveField(data: Record<string, unknown>, fieldPath: string): unknown {
  const parts = fieldPath.split('.');
  let current: unknown = data;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

export function interpolateTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_match: string, fieldPath: string) => {
    const value = resolveField(data, fieldPath);
    if (value === undefined || value === null) return '';
    return String(value);
  });
}
