// ============================================================
// Q-TRAIN Sync Service - Barrel Re-exports
// ============================================================

export type {
  SyncDirection,
  SyncMode,
  SyncStatus,
  SyncCollectionConfig,
  SyncConflict,
  SyncResult,
  SyncProgress,
  SyncProgressCallback,
  SyncLogEntry,
  SyncMetadata,
  SyncOptions,
} from './sync/types';

export { SYNC_COLLECTIONS, validateSyncConfig } from './sync/config';

export { triggerSync, triggerSyncAll, getSyncStatus } from './sync/syncOperations';

export { getSyncLogs, getLastSyncTimestamp, getAllSyncTimestamps } from './sync/syncLogs';
