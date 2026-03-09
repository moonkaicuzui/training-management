import {
  db,
  doc,
  collection,
  setDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from '@/services/firebase';
import { logger } from '@/utils/logger';
import type { WorkflowEventType, WorkflowExecutionLog } from './types';
import {
  RULES_COLLECTION,
  EXECUTION_LOGS_COLLECTION,
  docToWorkflowRule,
  generateLogId,
} from './helpers';
import { evaluateConditions } from './conditionEngine';
import { actionHandlers } from './actionHandlers';

export async function executeWorkflow(
  event: WorkflowEventType,
  data: Record<string, unknown>,
  executedBy: string = 'system'
): Promise<WorkflowExecutionLog[]> {
  const executionLogs: WorkflowExecutionLog[] = [];

  try {
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

    for (const rule of matchingRules) {
      const conditionsMet = evaluateConditions(rule.conditions, data);

      if (!conditionsMet) {
        logger.log(
          `[workflowService] Conditions not met for rule "${rule.name}" (${rule.id}), skipping`
        );
        continue;
      }

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
