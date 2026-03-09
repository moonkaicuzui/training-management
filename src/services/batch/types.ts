// ============================================================
// Q-TRAIN Batch Service - Types
// ============================================================

export interface BatchOperation {
  type: 'create' | 'update' | 'delete';
  collection: string;
  docId?: string; // for update/delete
  data?: Record<string, unknown>; // for create/update
}

export interface BatchResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{ index: number; error: string; operation: BatchOperation }>;
  duration: number; // ms
}

export interface ImportConfig {
  collection: string;
  fieldMapping: Record<string, string>; // csvField -> firestoreField
  uniqueKey: string; // field to check for duplicates
  mode: 'insert' | 'upsert' | 'update_only';
  validateFn?: (row: Record<string, unknown>) => { valid: boolean; errors: string[] };
}
