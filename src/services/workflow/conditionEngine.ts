import { logger } from '@/utils/logger';
import type { WorkflowCondition } from './types';
import { resolveField } from './helpers';

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

export function evaluateConditions(
  conditions: WorkflowCondition[],
  data: Record<string, unknown>
): boolean {
  if (conditions.length === 0) return true;
  return conditions.every((condition) => evaluateCondition(condition, data));
}
