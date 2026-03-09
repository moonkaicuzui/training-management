export interface ReportField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'enum';
  source: string;
  aggregatable?: boolean;
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
  fields: string[];
  filters: ReportFilter[];
  groupBy?: string;
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
