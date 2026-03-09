import {
  db,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from '@/services/firebase';
import { logger } from '@/utils/logger';
import type { WorkflowExecutionLog, ExecutionLogFilters } from './types';
import { EXECUTION_LOGS_COLLECTION, docToExecutionLog } from './helpers';

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

export async function getExecutionLogsByRule(ruleId: string): Promise<WorkflowExecutionLog[]> {
  return getExecutionLogs({ rule_id: ruleId });
}

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
