import {
  db,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from '@/services/firebase';
import { logger } from '@/utils/logger';
import type { ReportConfig, ReportResult } from './types';
import { AVAILABLE_FIELDS } from './fields';
import {
  convertDocTimestamps,
  matchesFilter,
  calculateAggregation,
  calculateOverallAggregations,
} from './helpers';

export const generateReport = async (
  config: ReportConfig
): Promise<ReportResult> => {
  try {
    const { source, fields, filters, groupBy, sortBy, aggregations } = config;

    if (!AVAILABLE_FIELDS[source]) {
      throw new Error(`Invalid report source: ${source}`);
    }

    const constraints = [];

    for (const filter of filters) {
      if (filter.operator === 'equals' && filter.value !== null && filter.value !== undefined) {
        constraints.push(where(filter.field, '==', filter.value));
      } else if (filter.operator === 'in' && Array.isArray(filter.value) && filter.value.length > 0 && filter.value.length <= 30) {
        constraints.push(where(filter.field, 'in', filter.value));
      } else if (filter.operator === 'greater_than' && typeof filter.value === 'number') {
        constraints.push(where(filter.field, '>', filter.value));
      } else if (filter.operator === 'less_than' && typeof filter.value === 'number') {
        constraints.push(where(filter.field, '<', filter.value));
      }
    }

    const hasInequalityFilter = filters.some(
      (f) =>
        (f.operator === 'greater_than' || f.operator === 'less_than') &&
        typeof f.value === 'number'
    );

    if (sortBy && !hasInequalityFilter) {
      constraints.push(orderBy(sortBy.field, sortBy.direction));
    }

    constraints.push(limit(2000));

    const q = query(collection(db, source), ...constraints);
    const snapshot = await getDocs(q);

    let rows: Record<string, unknown>[] = snapshot.docs.map((d) => {
      const raw = d.data() as Record<string, unknown>;
      return convertDocTimestamps(raw);
    });

    const clientSideFilters = filters.filter((f) => {
      if (f.operator === 'equals' && f.value !== null && f.value !== undefined) return false;
      if (f.operator === 'in' && Array.isArray(f.value) && f.value.length > 0 && f.value.length <= 30) return false;
      if (f.operator === 'greater_than' && typeof f.value === 'number') return false;
      if (f.operator === 'less_than' && typeof f.value === 'number') return false;
      return true;
    });

    if (clientSideFilters.length > 0) {
      rows = rows.filter((row) =>
        clientSideFilters.every((filter) => matchesFilter(row[filter.field], filter))
      );
    }

    if (sortBy && hasInequalityFilter) {
      rows.sort((a, b) => {
        const aVal = a[sortBy.field];
        const bVal = b[sortBy.field];

        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        let comparison = 0;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }

        return sortBy.direction === 'desc' ? -comparison : comparison;
      });
    }

    const totalRows = rows.length;

    if (groupBy) {
      const grouped = new Map<string, Record<string, unknown>[]>();
      for (const row of rows) {
        const groupKey = String(row[groupBy] ?? 'N/A');
        if (!grouped.has(groupKey)) {
          grouped.set(groupKey, []);
        }
        grouped.get(groupKey)!.push(row);
      }

      if (aggregations && aggregations.length > 0) {
        const groupedRows: Record<string, unknown>[] = [];

        for (const [groupKey, groupRows] of grouped.entries()) {
          const summaryRow: Record<string, unknown> = { [groupBy]: groupKey, _count: groupRows.length };

          for (const agg of aggregations) {
            const numericValues = groupRows
              .map((r) => r[agg.field])
              .filter((v): v is number => typeof v === 'number');

            summaryRow[`${agg.function}_${agg.field}`] = calculateAggregation(numericValues, agg.function);
          }

          groupedRows.push(summaryRow);
        }

        if (sortBy && sortBy.field === groupBy) {
          groupedRows.sort((a, b) => {
            const aVal = String(a[groupBy] ?? '');
            const bVal = String(b[groupBy] ?? '');
            const cmp = aVal.localeCompare(bVal);
            return sortBy.direction === 'desc' ? -cmp : cmp;
          });
        }

        return {
          data: groupedRows,
          totalRows,
          aggregatedValues: calculateOverallAggregations(rows, aggregations),
          generatedAt: new Date().toISOString(),
          config,
        };
      }
    }

    let aggregatedValues: Record<string, number> | undefined;

    if (aggregations && aggregations.length > 0) {
      aggregatedValues = calculateOverallAggregations(rows, aggregations);
    }

    const availableFieldKeys = new Set(
      AVAILABLE_FIELDS[source]?.map((f) => f.key) ?? []
    );
    const requestedFields = fields.filter((f) => availableFieldKeys.has(f));

    const projectedRows = rows.map((row) => {
      const projected: Record<string, unknown> = {};
      for (const fieldKey of requestedFields) {
        projected[fieldKey] = row[fieldKey] ?? null;
      }
      return projected;
    });

    return {
      data: projectedRows,
      totalRows,
      aggregatedValues,
      generatedAt: new Date().toISOString(),
      config,
    };
  } catch (error) {
    logger.error('[reportBuilderService] generateReport failed:', error);
    throw error;
  }
};
