/**
 * Report Builder Firebase Service
 *
 * Dynamic report generation from Firestore collections.
 * Supports filtering, sorting, grouping, aggregations, and export.
 * Uses snake_case collection names per project convention.
 */

import {
  db,
  doc,
  collection,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  limit,
  Timestamp,
} from '@/services/firebase';
import { logger } from '@/utils/logger';

// ============================================================
// Types
// ============================================================

export interface ReportField {
  key: string;
  label: string; // i18n key
  type: 'string' | 'number' | 'date' | 'boolean' | 'enum';
  source: string; // collection name
  aggregatable?: boolean; // can be used with SUM, AVG, COUNT
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'between' | 'in' | 'contains';
  value: unknown;
}

export interface ReportConfig {
  id?: string;
  name: string;
  description?: string;
  source: 'employees' | 'training_programs' | 'training_results' | 'training_sessions' | 'certificates' | 'tqc_trainees';
  fields: string[]; // field keys to include
  filters: ReportFilter[];
  groupBy?: string; // field key
  sortBy?: { field: string; direction: 'asc' | 'desc' };
  aggregations?: Array<{ field: string; function: 'count' | 'sum' | 'avg' | 'min' | 'max' }>;
  chartType?: 'table' | 'bar' | 'line' | 'pie' | 'none';
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ReportResult {
  data: Record<string, unknown>[];
  totalRows: number;
  aggregatedValues?: Record<string, number>;
  generatedAt: string;
  config: ReportConfig;
}

// ============================================================
// Collection Names (snake_case per project convention)
// ============================================================

const REPORT_TEMPLATES_COLLECTION = 'report_templates';

// ============================================================
// Available Fields per Source Collection
// ============================================================

const AVAILABLE_FIELDS: Record<string, ReportField[]> = {
  employees: [
    { key: 'employee_id', label: 'report.fields.employee_id', type: 'string', source: 'employees' },
    { key: 'employee_name', label: 'report.fields.employee_name', type: 'string', source: 'employees' },
    { key: 'department', label: 'report.fields.department', type: 'enum', source: 'employees' },
    { key: 'position', label: 'report.fields.position', type: 'enum', source: 'employees' },
    { key: 'building', label: 'report.fields.building', type: 'enum', source: 'employees' },
    { key: 'line', label: 'report.fields.line', type: 'string', source: 'employees' },
    { key: 'hire_date', label: 'report.fields.hire_date', type: 'date', source: 'employees' },
    { key: 'status', label: 'report.fields.status', type: 'enum', source: 'employees' },
    { key: 'updated_at', label: 'report.fields.updated_at', type: 'date', source: 'employees' },
  ],

  training_programs: [
    { key: 'program_code', label: 'report.fields.program_code', type: 'string', source: 'training_programs' },
    { key: 'program_name', label: 'report.fields.program_name', type: 'string', source: 'training_programs' },
    { key: 'program_name_vn', label: 'report.fields.program_name_vn', type: 'string', source: 'training_programs' },
    { key: 'program_name_kr', label: 'report.fields.program_name_kr', type: 'string', source: 'training_programs' },
    { key: 'category', label: 'report.fields.category', type: 'enum', source: 'training_programs' },
    { key: 'target_positions', label: 'report.fields.target_positions', type: 'string', source: 'training_programs' },
    { key: 'evaluation_type', label: 'report.fields.evaluation_type', type: 'enum', source: 'training_programs' },
    { key: 'passing_score', label: 'report.fields.passing_score', type: 'number', source: 'training_programs', aggregatable: true },
    { key: 'duration_hours', label: 'report.fields.duration_hours', type: 'number', source: 'training_programs', aggregatable: true },
    { key: 'validity_months', label: 'report.fields.validity_months', type: 'number', source: 'training_programs', aggregatable: true },
    { key: 'training_level', label: 'report.fields.training_level', type: 'enum', source: 'training_programs' },
    { key: 'training_type', label: 'report.fields.training_type', type: 'enum', source: 'training_programs' },
    { key: 'is_active', label: 'report.fields.is_active', type: 'boolean', source: 'training_programs' },
    { key: 'created_at', label: 'report.fields.created_at', type: 'date', source: 'training_programs' },
    { key: 'updated_at', label: 'report.fields.updated_at', type: 'date', source: 'training_programs' },
  ],

  training_results: [
    { key: 'result_id', label: 'report.fields.result_id', type: 'string', source: 'training_results' },
    { key: 'session_id', label: 'report.fields.session_id', type: 'string', source: 'training_results' },
    { key: 'employee_id', label: 'report.fields.employee_id', type: 'string', source: 'training_results' },
    { key: 'program_code', label: 'report.fields.program_code', type: 'string', source: 'training_results' },
    { key: 'training_date', label: 'report.fields.training_date', type: 'date', source: 'training_results' },
    { key: 'score', label: 'report.fields.score', type: 'number', source: 'training_results', aggregatable: true },
    { key: 'grade', label: 'report.fields.grade', type: 'enum', source: 'training_results' },
    { key: 'result', label: 'report.fields.result', type: 'enum', source: 'training_results' },
    { key: 'needs_retraining', label: 'report.fields.needs_retraining', type: 'boolean', source: 'training_results' },
    { key: 'evaluated_by', label: 'report.fields.evaluated_by', type: 'string', source: 'training_results' },
    { key: 'remarks', label: 'report.fields.remarks', type: 'string', source: 'training_results' },
    { key: 'test_attempt', label: 'report.fields.test_attempt', type: 'number', source: 'training_results', aggregatable: true },
    { key: 'trainer_name', label: 'report.fields.trainer_name', type: 'string', source: 'training_results' },
    { key: 'created_at', label: 'report.fields.created_at', type: 'date', source: 'training_results' },
    { key: 'updated_at', label: 'report.fields.updated_at', type: 'date', source: 'training_results' },
  ],

  training_sessions: [
    { key: 'session_id', label: 'report.fields.session_id', type: 'string', source: 'training_sessions' },
    { key: 'program_code', label: 'report.fields.program_code', type: 'string', source: 'training_sessions' },
    { key: 'session_date', label: 'report.fields.session_date', type: 'date', source: 'training_sessions' },
    { key: 'session_time', label: 'report.fields.session_time', type: 'string', source: 'training_sessions' },
    { key: 'trainer_name', label: 'report.fields.trainer_name', type: 'string', source: 'training_sessions' },
    { key: 'trainer', label: 'report.fields.trainer', type: 'string', source: 'training_sessions' },
    { key: 'location', label: 'report.fields.location', type: 'string', source: 'training_sessions' },
    { key: 'max_attendees', label: 'report.fields.max_attendees', type: 'number', source: 'training_sessions', aggregatable: true },
    { key: 'status', label: 'report.fields.status', type: 'enum', source: 'training_sessions' },
    { key: 'training_level', label: 'report.fields.training_level', type: 'enum', source: 'training_sessions' },
    { key: 'training_type', label: 'report.fields.training_type', type: 'enum', source: 'training_sessions' },
    { key: 'notes', label: 'report.fields.notes', type: 'string', source: 'training_sessions' },
    { key: 'created_by', label: 'report.fields.created_by', type: 'string', source: 'training_sessions' },
    { key: 'created_at', label: 'report.fields.created_at', type: 'date', source: 'training_sessions' },
  ],

  certificates: [
    { key: 'certificate_id', label: 'report.fields.certificate_id', type: 'string', source: 'certificates' },
    { key: 'certificate_number', label: 'report.fields.certificate_number', type: 'string', source: 'certificates' },
    { key: 'employee_id', label: 'report.fields.employee_id', type: 'string', source: 'certificates' },
    { key: 'employee_name', label: 'report.fields.employee_name', type: 'string', source: 'certificates' },
    { key: 'department', label: 'report.fields.department', type: 'enum', source: 'certificates' },
    { key: 'position', label: 'report.fields.position', type: 'enum', source: 'certificates' },
    { key: 'program_code', label: 'report.fields.program_code', type: 'string', source: 'certificates' },
    { key: 'program_name', label: 'report.fields.program_name', type: 'string', source: 'certificates' },
    { key: 'training_date', label: 'report.fields.training_date', type: 'date', source: 'certificates' },
    { key: 'score', label: 'report.fields.score', type: 'number', source: 'certificates', aggregatable: true },
    { key: 'grade', label: 'report.fields.grade', type: 'enum', source: 'certificates' },
    { key: 'issue_date', label: 'report.fields.issue_date', type: 'date', source: 'certificates' },
    { key: 'issued_by', label: 'report.fields.issued_by', type: 'string', source: 'certificates' },
    { key: 'status', label: 'report.fields.status', type: 'enum', source: 'certificates' },
    { key: 'created_at', label: 'report.fields.created_at', type: 'date', source: 'certificates' },
  ],

  tqc_trainees: [
    { key: 'trainee_id', label: 'report.fields.trainee_id', type: 'string', source: 'tqc_trainees' },
    { key: 'employee_id', label: 'report.fields.employee_id', type: 'string', source: 'tqc_trainees' },
    { key: 'employee_name', label: 'report.fields.employee_name', type: 'string', source: 'tqc_trainees' },
    { key: 'team_id', label: 'report.fields.team_id', type: 'string', source: 'tqc_trainees' },
    { key: 'department', label: 'report.fields.department', type: 'enum', source: 'tqc_trainees' },
    { key: 'position', label: 'report.fields.position', type: 'enum', source: 'tqc_trainees' },
    { key: 'building', label: 'report.fields.building', type: 'enum', source: 'tqc_trainees' },
    { key: 'line', label: 'report.fields.line', type: 'string', source: 'tqc_trainees' },
    { key: 'hire_date', label: 'report.fields.hire_date', type: 'date', source: 'tqc_trainees' },
    { key: 'training_status', label: 'report.fields.training_status', type: 'enum', source: 'tqc_trainees' },
    { key: 'start_date', label: 'report.fields.start_date', type: 'date', source: 'tqc_trainees' },
    { key: 'expected_end_date', label: 'report.fields.expected_end_date', type: 'date', source: 'tqc_trainees' },
    { key: 'actual_end_date', label: 'report.fields.actual_end_date', type: 'date', source: 'tqc_trainees' },
    { key: 'created_at', label: 'report.fields.created_at', type: 'date', source: 'tqc_trainees' },
    { key: 'updated_at', label: 'report.fields.updated_at', type: 'date', source: 'tqc_trainees' },
  ],
};

// ============================================================
// Helper Functions
// ============================================================

/** Convert Firestore Timestamp to ISO string */
const convertTimestamp = (
  value: unknown
): unknown => {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  return value;
};

/** Convert all Timestamp fields in a document to ISO strings */
const convertDocTimestamps = (
  data: Record<string, unknown>
): Record<string, unknown> => {
  const converted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    converted[key] = convertTimestamp(value);
  }
  return converted;
};

/** Apply a single filter to a value */
const matchesFilter = (
  fieldValue: unknown,
  filter: ReportFilter
): boolean => {
  const { operator, value: filterValue } = filter;

  // Handle null/undefined field values
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

/** Calculate aggregation on a numeric array */
const calculateAggregation = (
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

/** Escape a CSV field value */
const escapeCSVField = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Wrap in quotes if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// ============================================================
// Public API
// ============================================================

/**
 * Get available fields for a source collection
 */
export const getAvailableFields = (source: string): ReportField[] => {
  return AVAILABLE_FIELDS[source] || [];
};

/**
 * Generate a report based on the provided configuration.
 *
 * Process:
 * 1. Query Firestore collection
 * 2. Convert Timestamps to ISO strings
 * 3. Apply client-side filters
 * 4. Apply sorting
 * 5. Apply grouping (if specified)
 * 6. Calculate aggregations (if specified)
 * 7. Project only requested fields
 */
export const generateReport = async (
  config: ReportConfig
): Promise<ReportResult> => {
  try {
    const { source, fields, filters, groupBy, sortBy, aggregations } = config;

    // Validate source
    if (!AVAILABLE_FIELDS[source]) {
      throw new Error(`Invalid report source: ${source}`);
    }

    // ── Step 1: Build Firestore query with server-side filters ──
    // Firestore supports limited query operators, so we use 'equals' and 'in'
    // on the server side and apply the rest client-side.
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

    // Apply server-side sorting if sortBy is provided and no conflicting
    // inequality filters exist (Firestore limitation)
    const hasInequalityFilter = filters.some(
      (f) =>
        (f.operator === 'greater_than' || f.operator === 'less_than') &&
        typeof f.value === 'number'
    );

    if (
      sortBy &&
      !hasInequalityFilter
    ) {
      constraints.push(orderBy(sortBy.field, sortBy.direction));
    }

    // Safety limit to prevent reading too many documents
    constraints.push(limit(2000));

    const q = query(collection(db, source), ...constraints);
    const snapshot = await getDocs(q);

    // ── Step 2: Convert documents ──
    let rows: Record<string, unknown>[] = snapshot.docs.map((d) => {
      const raw = d.data() as Record<string, unknown>;
      return convertDocTimestamps(raw);
    });

    // ── Step 3: Apply client-side filters ──
    // Filters not pushed to Firestore (not_equals, between, contains, string comparisons)
    const clientSideFilters = filters.filter((f) => {
      // Already handled server-side
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

    // ── Step 4: Apply client-side sorting ──
    // If we could not sort server-side, do it here
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

    // ── Step 5: Apply grouping ──
    if (groupBy) {
      const grouped = new Map<string, Record<string, unknown>[]>();
      for (const row of rows) {
        const groupKey = String(row[groupBy] ?? 'N/A');
        if (!grouped.has(groupKey)) {
          grouped.set(groupKey, []);
        }
        grouped.get(groupKey)!.push(row);
      }

      // Flatten grouped data: each group becomes a summary row
      // If aggregations are specified, they will be calculated per group
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

        // Sort grouped rows by group key
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

    // ── Step 6: Calculate overall aggregations (without grouping) ──
    let aggregatedValues: Record<string, number> | undefined;

    if (aggregations && aggregations.length > 0) {
      aggregatedValues = calculateOverallAggregations(rows, aggregations);
    }

    // ── Step 7: Project only requested fields ──
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

/** Calculate overall aggregations across all rows */
const calculateOverallAggregations = (
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

// ============================================================
// Template CRUD
// ============================================================

/**
 * Save a report template to the 'report_templates' collection.
 * Returns the generated document ID.
 */
export const saveReportTemplate = async (
  config: ReportConfig
): Promise<string> => {
  try {
    const templateId = config.id || `RPT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const docRef = doc(db, REPORT_TEMPLATES_COLLECTION, templateId);

    await setDoc(docRef, {
      ...config,
      id: templateId,
      created_at: config.created_at || serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    logger.info(`[reportBuilderService] Report template saved: ${templateId}`);
    return templateId;
  } catch (error) {
    logger.error('[reportBuilderService] saveReportTemplate failed:', error);
    throw error;
  }
};

/**
 * Get saved report templates.
 * Optionally filter by userId (created_by).
 */
export const getReportTemplates = async (
  userId?: string
): Promise<ReportConfig[]> => {
  try {
    const constraints = [];

    if (userId) {
      constraints.push(where('created_by', '==', userId));
    }

    constraints.push(orderBy('updated_at', 'desc'));
    constraints.push(limit(100));

    const q = query(
      collection(db, REPORT_TEMPLATES_COLLECTION),
      ...constraints
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        name: (data.name as string) || '',
        description: data.description as string | undefined,
        source: data.source as ReportConfig['source'],
        fields: (data.fields as string[]) || [],
        filters: (data.filters as ReportFilter[]) || [],
        groupBy: data.groupBy as string | undefined,
        sortBy: data.sortBy as ReportConfig['sortBy'],
        aggregations: data.aggregations as ReportConfig['aggregations'],
        chartType: data.chartType as ReportConfig['chartType'],
        created_by: data.created_by as string | undefined,
        created_at: data.created_at instanceof Timestamp
          ? data.created_at.toDate().toISOString()
          : (data.created_at as string | undefined),
        updated_at: data.updated_at instanceof Timestamp
          ? data.updated_at.toDate().toISOString()
          : (data.updated_at as string | undefined),
      };
    });
  } catch (error) {
    logger.error('[reportBuilderService] getReportTemplates failed:', error);
    throw error;
  }
};

/**
 * Delete a report template by ID.
 */
export const deleteReportTemplate = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, REPORT_TEMPLATES_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error(`Report template not found: ${id}`);
    }

    await deleteDoc(docRef);
    logger.info(`[reportBuilderService] Report template deleted: ${id}`);
  } catch (error) {
    logger.error(`[reportBuilderService] deleteReportTemplate failed for ${id}:`, error);
    throw error;
  }
};

// ============================================================
// Export Functions
// ============================================================

/**
 * Export report result to CSV string.
 * Uses the config's fields array for column ordering.
 */
export const exportReportToCSV = (result: ReportResult): string => {
  const { data, config } = result;

  if (data.length === 0) {
    return '';
  }

  // Determine column headers from the data keys (respect field order from config)
  const allKeys = new Set<string>();
  for (const row of data) {
    for (const key of Object.keys(row)) {
      allKeys.add(key);
    }
  }

  // Use config fields order if available, then add any extra keys (e.g., aggregation columns)
  const orderedKeys: string[] = [];
  for (const fieldKey of config.fields) {
    if (allKeys.has(fieldKey)) {
      orderedKeys.push(fieldKey);
      allKeys.delete(fieldKey);
    }
  }
  // Append remaining keys (like groupBy summary columns, _count, aggregation columns)
  for (const key of allKeys) {
    orderedKeys.push(key);
  }

  // Build header row with field labels where available
  const availableFields = getAvailableFields(config.source);
  const fieldLabelMap = new Map(availableFields.map((f) => [f.key, f.label]));

  const headerRow = orderedKeys
    .map((key) => escapeCSVField(fieldLabelMap.get(key) || key))
    .join(',');

  // Build data rows
  const dataRows = data.map((row) =>
    orderedKeys.map((key) => escapeCSVField(row[key])).join(',')
  );

  return [headerRow, ...dataRows].join('\n');
};

/**
 * Export report result to formatted JSON string.
 */
export const exportReportToJSON = (result: ReportResult): string => {
  return JSON.stringify(
    {
      reportName: result.config.name,
      source: result.config.source,
      generatedAt: result.generatedAt,
      totalRows: result.totalRows,
      aggregatedValues: result.aggregatedValues || null,
      data: result.data,
    },
    null,
    2
  );
};
