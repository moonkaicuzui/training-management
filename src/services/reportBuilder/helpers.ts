import { Timestamp } from '@/services/firebase';
import type { ReportFilter } from './types';

export const convertTimestamp = (value: unknown): unknown => {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return value;
};

export const convertDocTimestamps = (
  data: Record<string, unknown>
): Record<string, unknown> => {
  const converted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    converted[key] = convertTimestamp(value);
  }
  return converted;
};

export const matchesFilter = (
  fieldValue: unknown,
  filter: ReportFilter
): boolean => {
  const { operator, value: filterValue } = filter;

  if (fieldValue === null || fieldValue === undefined) {
    if (operator === 'equals') return filterValue === null || filterValue === undefined;
    if (operator === 'not_equals') return filterValue !== null && filterValue !== undefined;
    return false;
  }

  switch (operator) {
    case 'equals':
      return fieldValue === filterValue;

    case 'not_equals':
      return fieldValue !== filterValue;

    case 'greater_than':
      if (typeof fieldValue === 'number' && typeof filterValue === 'number') {
        return fieldValue > filterValue;
      }
      if (typeof fieldValue === 'string' && typeof filterValue === 'string') {
        return fieldValue > filterValue;
      }
      return false;

    case 'less_than':
      if (typeof fieldValue === 'number' && typeof filterValue === 'number') {
        return fieldValue < filterValue;
      }
      if (typeof fieldValue === 'string' && typeof filterValue === 'string') {
        return fieldValue < filterValue;
      }
      return false;

    case 'between': {
      const range = filterValue as [unknown, unknown];
      if (!Array.isArray(range) || range.length !== 2) return false;
      const [minVal, maxVal] = range;
      if (typeof fieldValue === 'number') {
        return fieldValue >= (minVal as number) && fieldValue <= (maxVal as number);
      }
      if (typeof fieldValue === 'string') {
        return fieldValue >= (minVal as string) && fieldValue <= (maxVal as string);
      }
      return false;
    }

    case 'in': {
      const allowedValues = filterValue as unknown[];
      if (!Array.isArray(allowedValues)) return false;
      return allowedValues.includes(fieldValue);
    }

    case 'contains': {
      if (typeof fieldValue === 'string' && typeof filterValue === 'string') {
        return fieldValue.toLowerCase().includes(filterValue.toLowerCase());
      }
      if (Array.isArray(fieldValue) && typeof filterValue === 'string') {
        return fieldValue.some(
          (item) =>
            typeof item === 'string' &&
            item.toLowerCase().includes(filterValue.toLowerCase())
        );
      }
      return false;
    }

    default:
      return true;
  }
};

export const calculateAggregation = (
  values: number[],
  fn: 'count' | 'sum' | 'avg' | 'min' | 'max'
): number => {
  if (values.length === 0) return 0;

  switch (fn) {
    case 'count':
      return values.length;
    case 'sum':
      return values.reduce((acc, v) => acc + v, 0);
    case 'avg': {
      const sum = values.reduce((acc, v) => acc + v, 0);
      return Math.round((sum / values.length) * 100) / 100;
    }
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    default:
      return 0;
  }
};

export const calculateOverallAggregations = (
  rows: Record<string, unknown>[],
  aggregations: Array<{ field: string; function: 'count' | 'sum' | 'avg' | 'min' | 'max' }>
): Record<string, number> => {
  const result: Record<string, number> = {};

  for (const agg of aggregations) {
    const numericValues = rows
      .map((r) => r[agg.field])
      .filter((v): v is number => typeof v === 'number');

    result[`${agg.function}_${agg.field}`] = calculateAggregation(numericValues, agg.function);
  }

  return result;
};

export const escapeCSVField = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};
