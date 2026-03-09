// ============================================================
// Q-TRAIN Sync Service - Configuration
// ============================================================

import type { SyncCollectionConfig } from './types';

// ============================================================
// Collection Configuration
// ============================================================

export const SYNC_COLLECTIONS: SyncCollectionConfig[] = [
  { key: 'employees', label: 'sync.collections.employees', syncMode: 'bidirectional' },
  { key: 'training_programs', label: 'sync.collections.programs', syncMode: 'bidirectional' },
  { key: 'training_sessions', label: 'sync.collections.sessions', syncMode: 'bidirectional' },
  { key: 'training_results', label: 'sync.collections.results', syncMode: 'append_only' },
  { key: 'program_change_logs', label: 'sync.collections.programLogs', syncMode: 'firestore_to_sheets' },
  { key: 'result_edit_logs', label: 'sync.collections.resultLogs', syncMode: 'firestore_to_sheets' },
  { key: 'md_inspections', label: 'sync.collections.mdInspections', syncMode: 'bidirectional' },
  { key: 'md_failures', label: 'sync.collections.mdFailures', syncMode: 'firestore_to_sheets' },
];

// ============================================================
// Validation
// ============================================================

/**
 * Validate that the sync service is properly configured.
 * With Cloud Functions proxy, no client-side environment variables are needed.
 */
export function validateSyncConfig(): { valid: boolean; errors: string[] } {
  // GAS API keys are now stored in Cloud Functions secrets.
  // No client-side configuration required.
  return {
    valid: true,
    errors: [],
  };
}

/**
 * Validate that the given collection keys are recognized sync collections.
 */
export function validateCollections(collections: string[]): void {
  const validKeys = new Set(SYNC_COLLECTIONS.map((c) => c.key));

  for (const col of collections) {
    if (!validKeys.has(col)) {
      throw new Error(
        `Unknown sync collection: "${col}". Valid collections: ${Array.from(validKeys).join(', ')}`
      );
    }
  }
}
