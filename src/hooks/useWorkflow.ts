/**
 * useWorkflow Hook
 *
 * React hook that provides an interface to the workflow automation engine.
 * Allows components to trigger workflow events, track processing state,
 * and access recent execution history.
 */

import { useState, useCallback, useRef } from 'react';
import {
  executeWorkflow,
  getWorkflowRules,
  getRecentExecutions,
} from '@/services/workflowService';
import type {
  WorkflowEventType,
  WorkflowExecutionLog,
  WorkflowRule,
} from '@/services/workflowService';
import { useAuthStore } from '@/stores/authStore';
import { logger } from '@/utils/logger';

// ============================================================
// Hook Return Type
// ============================================================

interface UseWorkflowEngineReturn {
  /** Trigger a workflow event with associated data */
  triggerEvent: (
    event: WorkflowEventType,
    data: Record<string, unknown>
  ) => Promise<WorkflowExecutionLog[]>;
  /** Whether a workflow is currently being processed */
  isProcessing: boolean;
  /** The most recent execution result */
  lastExecution: WorkflowExecutionLog | null;
  /** All execution logs from the last triggerEvent call */
  lastExecutionBatch: WorkflowExecutionLog[];
  /** Any error from the last execution attempt */
  error: Error | null;
}

interface UseWorkflowRulesReturn {
  /** All workflow rules */
  rules: WorkflowRule[];
  /** Whether rules are currently loading */
  isLoading: boolean;
  /** Any error from loading rules */
  error: Error | null;
  /** Refresh the rules list */
  refresh: () => Promise<void>;
}

interface UseWorkflowHistoryReturn {
  /** Recent execution logs */
  logs: WorkflowExecutionLog[];
  /** Whether logs are currently loading */
  isLoading: boolean;
  /** Any error from loading logs */
  error: Error | null;
  /** Refresh the execution logs */
  refresh: () => Promise<void>;
}

// ============================================================
// useWorkflowEngine - Event triggering
// ============================================================

/**
 * Hook for triggering workflow events.
 *
 * Usage:
 * ```tsx
 * const { triggerEvent, isProcessing } = useWorkflowEngine();
 *
 * // After recording a training result:
 * await triggerEvent('result_recorded', {
 *   employee_id: '123',
 *   session_id: 'sess_456',
 *   score: 85,
 *   result: 'PASS',
 * });
 * ```
 */
export function useWorkflowEngine(): UseWorkflowEngineReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastExecution, setLastExecution] = useState<WorkflowExecutionLog | null>(null);
  const [lastExecutionBatch, setLastExecutionBatch] = useState<WorkflowExecutionLog[]>([]);
  const [error, setError] = useState<Error | null>(null);

  // Use ref to avoid stale closure on user
  const userRef = useRef(useAuthStore.getState().user);
  userRef.current = useAuthStore.getState().user;

  const triggerEvent = useCallback(
    async (
      event: WorkflowEventType,
      data: Record<string, unknown>
    ): Promise<WorkflowExecutionLog[]> => {
      setIsProcessing(true);
      setError(null);

      try {
        const executedBy = userRef.current?.email || userRef.current?.id || 'system';
        const logs = await executeWorkflow(event, data, executedBy);

        setLastExecutionBatch(logs);
        if (logs.length > 0) {
          setLastExecution(logs[logs.length - 1]);
        }

        logger.log(
          `[useWorkflow] Event "${event}" processed: ${logs.length} rule(s) executed`
        );

        return logs;
      } catch (err) {
        const wrappedError =
          err instanceof Error ? err : new Error('Workflow execution failed');
        setError(wrappedError);
        logger.error(`[useWorkflow] Event "${event}" failed:`, err);
        return [];
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  return {
    triggerEvent,
    isProcessing,
    lastExecution,
    lastExecutionBatch,
    error,
  };
}

// ============================================================
// useWorkflowRules - Rule management
// ============================================================

/**
 * Hook for loading and managing workflow rules.
 *
 * Usage:
 * ```tsx
 * const { rules, isLoading, refresh } = useWorkflowRules();
 * ```
 */
export function useWorkflowRules(): UseWorkflowRulesReturn {
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const fetchedRules = await getWorkflowRules();
      setRules(fetchedRules);
    } catch (err) {
      const wrappedError =
        err instanceof Error ? err : new Error('Failed to load workflow rules');
      setError(wrappedError);
      logger.error('[useWorkflow] Failed to load rules:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    rules,
    isLoading,
    error,
    refresh,
  };
}

// ============================================================
// useWorkflowHistory - Execution log history
// ============================================================

/**
 * Hook for loading workflow execution history.
 *
 * Usage:
 * ```tsx
 * const { logs, isLoading, refresh } = useWorkflowHistory(50);
 * ```
 */
export function useWorkflowHistory(count: number = 20): UseWorkflowHistoryReturn {
  const [logs, setLogs] = useState<WorkflowExecutionLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const fetchedLogs = await getRecentExecutions(count);
      setLogs(fetchedLogs);
    } catch (err) {
      const wrappedError =
        err instanceof Error ? err : new Error('Failed to load execution logs');
      setError(wrappedError);
      logger.error('[useWorkflow] Failed to load execution logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [count]);

  return {
    logs,
    isLoading,
    error,
    refresh,
  };
}
