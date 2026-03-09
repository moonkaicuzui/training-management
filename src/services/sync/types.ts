// ============================================================
// Q-TRAIN Sync Service - Types
// ============================================================

import { Timestamp, serverTimestamp } from '@/services/firebase';

export type SyncDirection = 'bidirectional' | 'toFirestore' | 'toSheets';

export type SyncMode = 'bidirectional' | 'append_only' | 'firestore_to_sheets';

export type SyncStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface SyncCollectionConfig {
  key: string;
  label: string;
  syncMode: SyncMode;
}

export interface SyncConflict {
  /** Document ID that has a conflict */
  documentId: string;
  /** Collection where the conflict occurred */
  collection: string;
  /** The value from Firestore */
  firestoreValue: unknown;
  /** The value from Google Sheets */
  sheetsValue: unknown;
  /** Field name that has a conflict */
  field: string;
  /** Conflict resolution strategy applied, if any */
  resolution?: 'firestore_wins' | 'sheets_wins' | 'manual' | 'skipped';
}

export interface SyncResult {
  collection: string;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  /** Conflicts detected during this sync operation */
  conflicts: SyncConflict[];
  /** Duration of the sync operation in milliseconds */
  durationMs?: number;
}

export interface SyncProgress {
  /** Current collection being synced */
  currentCollection: string;
  /** Index of the current collection (0-based) */
  currentIndex: number;
  /** Total number of collections to sync */
  totalCollections: number;
  /** Current step status */
  status: SyncStatus;
  /** Percentage complete (0-100) */
  percent: number;
  /** Result for this collection, available when status is 'completed' or 'failed' */
  result?: SyncResult;
  /** Error message if status is 'failed' */
  error?: string;
}

export type SyncProgressCallback = (progress: SyncProgress) => void;

export interface SyncLogEntry {
  /** Unique identifier */
  id?: string;
  /** Sync direction used */
  direction: SyncDirection;
  /** Collections that were synced */
  collections: string[];
  /** Results per collection */
  results: SyncResult[];
  /** Overall status */
  status: 'success' | 'partial' | 'failed';
  /** Total conflicts across all collections */
  totalConflicts: number;
  /** Total errors across all collections */
  totalErrors: number;
  /** Total documents created */
  totalCreated: number;
  /** Total documents updated */
  totalUpdated: number;
  /** Total documents skipped */
  totalSkipped: number;
  /** Total duration in milliseconds */
  durationMs: number;
  /** User who initiated the sync (email) */
  initiatedBy?: string;
  /** Timestamp when sync started */
  started_at: Timestamp | ReturnType<typeof serverTimestamp>;
  /** Timestamp when sync completed */
  completed_at?: Timestamp | ReturnType<typeof serverTimestamp>;
  /** Created timestamp for Firestore */
  created_at: ReturnType<typeof serverTimestamp>;
}

export interface SyncMetadata {
  /** Collection name */
  collection: string;
  /** Timestamp of the last successful sync */
  last_sync_at: Timestamp | ReturnType<typeof serverTimestamp>;
  /** Direction of the last sync */
  last_sync_direction: SyncDirection;
  /** Status of the last sync */
  last_sync_status: 'success' | 'partial' | 'failed';
  /** Number of conflicts in the last sync */
  last_sync_conflicts: number;
  /** Updated timestamp */
  updated_at: ReturnType<typeof serverTimestamp>;
}

export interface SyncOptions {
  /** Progress callback for UI updates */
  onProgress?: SyncProgressCallback;
  /** Email of the user initiating the sync */
  initiatedBy?: string;
  /** Whether to skip logging to Firestore (default: false) */
  skipLogging?: boolean;
}
