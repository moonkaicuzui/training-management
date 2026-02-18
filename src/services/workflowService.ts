/**
 * Workflow Automation Engine Service
 *
 * Client-side workflow automation that triggers actions based on events.
 * Firestore CRUD operations for 'workflow_rules' and 'workflow_execution_logs' collections.
 *
 * Event-driven architecture:
 *   1. An event is fired (e.g., training_completed)
 *   2. Matching enabled rules are fetched
 *   3. Conditions are evaluated against the event data
 *   4. Actions are executed in sequence
 *   5. Execution is logged to 'workflow_execution_logs'
 */

import {
  db,
  doc,
  collection,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from '@/services/firebase';
import { logger } from '@/utils/logger';
import type { NotificationType } from '@/types/notification';

// ============================================================
// Collection Names (snake_case per project convention)
// ============================================================

const RULES_COLLECTION = 'workflow_rules';
const EXECUTION_LOGS_COLLECTION = 'workflow_execution_logs';

// ============================================================
// Type Definitions
// ============================================================

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

// ============================================================
// Helper Functions
// ============================================================

const convertTimestampToString = (
  timestamp: Timestamp | string | undefined
): string => {
  if (!timestamp) return '';
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
};

const docToWorkflowRule = (docId: string, data: Record<string, unknown>): WorkflowRule => {
  return {
    id: docId,
    name: (data.name as string) || '',
    description: (data.description as string) || '',
    event: (data.event as WorkflowEventType) || 'training_completed',
    conditions: (data.conditions as WorkflowCondition[]) || [],
    actions: (data.actions as WorkflowAction[]) || [],
    enabled: (data.enabled as boolean) ?? true,
    created_at: convertTimestampToString(data.created_at as Timestamp | string | undefined),
    updated_at: convertTimestampToString(data.updated_at as Timestamp | string | undefined),
  };
};

const docToExecutionLog = (docId: string, data: Record<string, unknown>): WorkflowExecutionLog => {
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

function generateRuleId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `wfr_${timestamp}_${random}`;
}

function generateLogId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `wfl_${timestamp}_${random}`;
}

// ============================================================
// Rule CRUD Operations
// ============================================================

/**
 * Get all workflow rules from Firestore.
 * Returns rules sorted by creation date (newest first).
 */
export async function getWorkflowRules(): Promise<WorkflowRule[]> {
  try {
    const q = query(
      collection(db, RULES_COLLECTION),
      orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) =>
      docToWorkflowRule(d.id, d.data() as Record<string, unknown>)
    );
  } catch (error) {
    logger.error('[workflowService] getWorkflowRules failed:', error);
    throw error;
  }
}

/**
 * Get a single workflow rule by ID.
 */
export async function getWorkflowRule(id: string): Promise<WorkflowRule | null> {
  try {
    const docRef = doc(db, RULES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return docToWorkflowRule(docSnap.id, docSnap.data() as Record<string, unknown>);
  } catch (error) {
    logger.error(`[workflowService] getWorkflowRule failed for ${id}:`, error);
    throw error;
  }
}

/**
 * Create a new workflow rule.
 * Generates an ID if not provided.
 */
export async function createWorkflowRule(
  rule: Omit<WorkflowRule, 'id' | 'created_at' | 'updated_at'>
): Promise<WorkflowRule> {
  try {
    const id = generateRuleId();
    const now = serverTimestamp();

    const ruleData = {
      name: rule.name,
      description: rule.description,
      event: rule.event,
      conditions: rule.conditions,
      actions: rule.actions,
      enabled: rule.enabled,
      created_at: now,
      updated_at: now,
    };

    const docRef = doc(db, RULES_COLLECTION, id);
    await setDoc(docRef, ruleData);

    logger.log('[workflowService] Created workflow rule:', id, rule.name);

    return {
      ...rule,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('[workflowService] createWorkflowRule failed:', error);
    throw error;
  }
}

/**
 * Update an existing workflow rule.
 */
export async function updateWorkflowRule(
  id: string,
  updates: Partial<Omit<WorkflowRule, 'id' | 'created_at' | 'updated_at'>>
): Promise<void> {
  try {
    const docRef = doc(db, RULES_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });
    logger.log('[workflowService] Updated workflow rule:', id);
  } catch (error) {
    logger.error(`[workflowService] updateWorkflowRule failed for ${id}:`, error);
    throw error;
  }
}

/**
 * Delete a workflow rule.
 */
export async function deleteWorkflowRule(id: string): Promise<void> {
  try {
    const docRef = doc(db, RULES_COLLECTION, id);
    await deleteDoc(docRef);
    logger.log('[workflowService] Deleted workflow rule:', id);
  } catch (error) {
    logger.error(`[workflowService] deleteWorkflowRule failed for ${id}:`, error);
    throw error;
  }
}

// ============================================================
// Condition Evaluation Engine
// ============================================================

/**
 * Resolve a dotted field path from a nested object.
 * e.g., resolveField({ score: { total: 85 } }, 'score.total') => 85
 */
function resolveField(data: Record<string, unknown>, fieldPath: string): unknown {
  const parts = fieldPath.split('.');
  let current: unknown = data;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Evaluate a single condition against the provided data.
 */
function evaluateCondition(condition: WorkflowCondition, data: Record<string, unknown>): boolean {
  const fieldValue = resolveField(data, condition.field);

  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;

    case 'not_equals':
      return fieldValue !== condition.value;

    case 'greater_than':
      return (
        typeof fieldValue === 'number' &&
        typeof condition.value === 'number' &&
        fieldValue > condition.value
      );

    case 'less_than':
      return (
        typeof fieldValue === 'number' &&
        typeof condition.value === 'number' &&
        fieldValue < condition.value
      );

    case 'contains':
      if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
        return fieldValue.toLowerCase().includes(condition.value.toLowerCase());
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(condition.value);
      }
      return false;

    case 'in':
      if (Array.isArray(condition.value)) {
        return condition.value.includes(fieldValue);
      }
      return false;

    default:
      logger.warn(`[workflowService] Unknown condition operator: ${condition.operator}`);
      return false;
  }
}

/**
 * Evaluate all conditions against the provided data.
 * All conditions must pass (AND logic).
 */
export function evaluateConditions(
  conditions: WorkflowCondition[],
  data: Record<string, unknown>
): boolean {
  if (conditions.length === 0) return true;
  return conditions.every((condition) => evaluateCondition(condition, data));
}

// ============================================================
// Action Execution Engine
// ============================================================

/**
 * Action handler registry.
 * Each action type maps to an async function that executes the action.
 * Actions are intentionally lightweight on the client side; they prepare
 * the data and delegate to existing services.
 */
const actionHandlers: Record<
  WorkflowActionType,
  (params: Record<string, unknown>, triggerData: Record<string, unknown>) => Promise<void>
> = {
  async create_notification(params, triggerData) {
    // Lazy import to avoid circular dependencies
    const { createNotification } = await import('@/services/notificationService');

    const notificationId = `wf_notif_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    await createNotification({
      notification_id: notificationId,
      type: (params.notification_type as NotificationType) || 'SYSTEM',
      priority: (params.priority as 'HIGH' | 'MEDIUM' | 'LOW') || 'MEDIUM',
      title: (params.title as string) || 'Workflow Notification',
      message: interpolateTemplate((params.message as string) || '', triggerData),
      recipient_id: (params.recipient_id as string) || (triggerData.employee_id as string) || undefined,
      recipient_type: (params.recipient_type as 'EMPLOYEE' | 'DEPARTMENT' | 'ALL') || 'EMPLOYEE',
      is_read: false,
    });
  },

  async create_certificate(params, triggerData) {
    // Placeholder: certificate creation typically requires more complex logic
    // and should be handled by the certificateService
    logger.log('[workflowService] create_certificate action triggered', {
      params,
      employee_id: triggerData.employee_id,
      program_code: triggerData.program_code,
    });
    // In a full implementation, this would call certificateService.createCertificate()
  },

  async schedule_retraining(params, triggerData) {
    // Placeholder: schedule retraining via the existing service layer
    logger.log('[workflowService] schedule_retraining action triggered', {
      params,
      employee_id: triggerData.employee_id,
      program_code: triggerData.program_code,
    });
    // In a full implementation, this would create a retraining entry
  },

  async send_email(params, triggerData) {
    // Client-side email sending is not directly possible;
    // this would typically call a Cloud Function endpoint
    logger.log('[workflowService] send_email action triggered', {
      to: params.to || triggerData.email,
      subject: params.subject,
      template: params.template,
    });
    // In a full implementation, this would call a Cloud Function via fetch()
  },

  async update_status(params, triggerData) {
    // Generic status updater using the Firestore doc path
    const collectionName = params.collection as string;
    const documentId = (params.document_id as string) || (triggerData.id as string);
    const statusField = (params.status_field as string) || 'status';
    const statusValue = params.status_value;

    if (!collectionName || !documentId || statusValue === undefined) {
      throw new Error('update_status requires collection, document_id, and status_value params');
    }

    const { doc: getDocRef, updateDoc: updateDocument, serverTimestamp: getTimestamp } =
      await import('@/services/firebase');

    const docRef = getDocRef(db, collectionName, documentId);
    await updateDocument(docRef, {
      [statusField]: statusValue,
      updated_at: getTimestamp(),
    });
  },

  async create_audit_log(params, triggerData) {
    const { doc: getDocRef, setDoc: setDocument, serverTimestamp: getTimestamp } =
      await import('@/services/firebase');

    const logId = `wf_audit_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const logRef = getDocRef(db, 'auditLogs', logId);

    await setDocument(logRef, {
      log_id: logId,
      entity_type: (params.entity_type as string) || 'WORKFLOW',
      entity_id: (params.entity_id as string) || (triggerData.id as string) || '',
      action: (params.action as string) || 'WORKFLOW_TRIGGER',
      changed_by: (params.changed_by as string) || (triggerData.executed_by as string) || 'system',
      changed_at: getTimestamp(),
      before_data: (params.before_data as Record<string, unknown>) || null,
      after_data: (params.after_data as Record<string, unknown>) || triggerData,
      reason: (params.reason as string) || 'Triggered by workflow automation',
    });
  },
};

/**
 * Interpolate template strings with data values.
 * Supports {{field}} syntax for simple template rendering.
 * e.g., "Training {{program_name}} completed" with { program_name: "Safety" }
 *   => "Training Safety completed"
 */
function interpolateTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_match, fieldPath: string) => {
    const value = resolveField(data, fieldPath);
    if (value === undefined || value === null) return '';
    return String(value);
  });
}

// ============================================================
// Workflow Execution Engine
// ============================================================

/**
 * Main workflow execution function.
 *
 * 1. Finds all enabled rules that match the given event type
 * 2. Evaluates conditions for each matching rule
 * 3. Executes actions in sequence for rules whose conditions pass
 * 4. Logs execution results to Firestore
 *
 * Returns an array of execution logs for all rules that were processed.
 */
export async function executeWorkflow(
  event: WorkflowEventType,
  data: Record<string, unknown>,
  executedBy: string = 'system'
): Promise<WorkflowExecutionLog[]> {
  const executionLogs: WorkflowExecutionLog[] = [];

  try {
    // 1. Find matching enabled rules for this event
    const q = query(
      collection(db, RULES_COLLECTION),
      where('event', '==', event),
      where('enabled', '==', true)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      logger.log(`[workflowService] No enabled rules found for event: ${event}`);
      return [];
    }

    const matchingRules = snapshot.docs.map((d) =>
      docToWorkflowRule(d.id, d.data() as Record<string, unknown>)
    );

    // 2. Process each matching rule
    for (const rule of matchingRules) {
      // 2a. Evaluate conditions
      const conditionsMet = evaluateConditions(rule.conditions, data);

      if (!conditionsMet) {
        logger.log(
          `[workflowService] Conditions not met for rule "${rule.name}" (${rule.id}), skipping`
        );
        continue;
      }

      // 2b. Execute actions in sequence
      const actionsExecuted: WorkflowExecutionLog['actions_executed'] = [];

      for (const action of rule.actions) {
        const handler = actionHandlers[action.type];

        if (!handler) {
          actionsExecuted.push({
            type: action.type,
            success: false,
            error: `Unknown action type: ${action.type}`,
          });
          continue;
        }

        try {
          await handler(action.params, data);
          actionsExecuted.push({
            type: action.type,
            success: true,
          });
        } catch (actionError) {
          const errorMessage =
            actionError instanceof Error ? actionError.message : String(actionError);
          actionsExecuted.push({
            type: action.type,
            success: false,
            error: errorMessage,
          });
          logger.error(
            `[workflowService] Action "${action.type}" failed for rule "${rule.name}":`,
            actionError
          );
        }
      }

      // 2c. Log execution
      const logId = generateLogId();
      const executionLog: WorkflowExecutionLog = {
        id: logId,
        rule_id: rule.id,
        rule_name: rule.name,
        event,
        trigger_data: data,
        actions_executed: actionsExecuted,
        executed_at: new Date().toISOString(),
        executed_by: executedBy,
      };

      try {
        const logRef = doc(db, EXECUTION_LOGS_COLLECTION, logId);
        await setDoc(logRef, {
          ...executionLog,
          executed_at: serverTimestamp(),
        });
      } catch (logError) {
        // Log failure should not block the workflow result
        logger.error('[workflowService] Failed to save execution log:', logError);
      }

      executionLogs.push(executionLog);

      logger.log(
        `[workflowService] Executed rule "${rule.name}" for event "${event}": ` +
          `${actionsExecuted.filter((a) => a.success).length}/${actionsExecuted.length} actions succeeded`
      );
    }
  } catch (error) {
    logger.error(`[workflowService] executeWorkflow failed for event "${event}":`, error);
    throw error;
  }

  return executionLogs;
}

// ============================================================
// Execution Log Operations
// ============================================================

/**
 * Get execution logs with optional filters.
 * Supports filtering by rule_id, event type, and date range.
 */
export async function getExecutionLogs(
  filters?: ExecutionLogFilters
): Promise<WorkflowExecutionLog[]> {
  try {
    const constraints = [];

    if (filters?.rule_id) {
      constraints.push(where('rule_id', '==', filters.rule_id));
    }

    if (filters?.event) {
      constraints.push(where('event', '==', filters.event));
    }

    constraints.push(orderBy('executed_at', 'desc'));
    constraints.push(limit(200));

    const q = query(collection(db, EXECUTION_LOGS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    let results = snapshot.docs.map((d) =>
      docToExecutionLog(d.id, d.data() as Record<string, unknown>)
    );

    // Client-side date range filtering (Firestore does not natively support
    // compound inequality queries on different fields)
    if (filters?.from_date) {
      const fromDate = new Date(filters.from_date).getTime();
      results = results.filter((log) => new Date(log.executed_at).getTime() >= fromDate);
    }

    if (filters?.to_date) {
      const toDate = new Date(filters.to_date).getTime();
      results = results.filter((log) => new Date(log.executed_at).getTime() <= toDate);
    }

    return results;
  } catch (error) {
    logger.error('[workflowService] getExecutionLogs failed:', error);
    throw error;
  }
}

/**
 * Get execution logs for a specific rule.
 * Convenience wrapper around getExecutionLogs.
 */
export async function getExecutionLogsByRule(ruleId: string): Promise<WorkflowExecutionLog[]> {
  return getExecutionLogs({ rule_id: ruleId });
}

/**
 * Get the most recent execution log entries.
 */
export async function getRecentExecutions(count: number = 20): Promise<WorkflowExecutionLog[]> {
  try {
    const q = query(
      collection(db, EXECUTION_LOGS_COLLECTION),
      orderBy('executed_at', 'desc'),
      limit(count)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) =>
      docToExecutionLog(d.id, d.data() as Record<string, unknown>)
    );
  } catch (error) {
    logger.error('[workflowService] getRecentExecutions failed:', error);
    throw error;
  }
}
