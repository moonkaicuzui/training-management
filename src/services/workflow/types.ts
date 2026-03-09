export type WorkflowEventType =
  | 'training_completed'
  | 'certificate_expiring'
  | 'result_recorded'
  | 'session_cancelled'
  | 'capa_status_changed'
  | 'trainee_stage_completed';

export type WorkflowActionType =
  | 'create_notification'
  | 'create_certificate'
  | 'schedule_retraining'
  | 'send_email'
  | 'update_status'
  | 'create_audit_log';

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
  value: unknown;
}

export interface WorkflowAction {
  type: WorkflowActionType;
  params: Record<string, unknown>;
}

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  event: WorkflowEventType;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowExecutionLog {
  id: string;
  rule_id: string;
  rule_name: string;
  event: WorkflowEventType;
  trigger_data: Record<string, unknown>;
  actions_executed: { type: string; success: boolean; error?: string }[];
  executed_at: string;
  executed_by: string;
}

export interface ExecutionLogFilters {
  rule_id?: string;
  event?: WorkflowEventType;
  from_date?: string;
  to_date?: string;
}
