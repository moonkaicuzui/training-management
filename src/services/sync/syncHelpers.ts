import {
  db,
  doc,
  collection,
  addDoc,
  setDoc,
  serverTimestamp,
} from '@/services/firebase';
import { logger } from '@/utils/logger';
import type {
  SyncDirection,
  SyncResult,
  SyncConflict,
  SyncLogEntry,
} from './types';

const SYNC_LOGS_COLLECTION = 'sync_logs';
const SYNC_METADATA_COLLECTION = 'sync_metadata';

export async function saveSyncLog(logEntry: Omit<SyncLogEntry, 'id' | 'created_at'>): Promise<string> {
  try {
    const colRef = collection(db, SYNC_LOGS_COLLECTION);
    const docRef = await addDoc(colRef, {
      ...logEntry,
      created_at: serverTimestamp(),
    });

    logger.info('[SyncService] Sync log saved', { logId: docRef.id });
    return docRef.id;
  } catch (error) {
    logger.error('[SyncService] Failed to save sync log', { error });
    return '';
  }
}

export async function updateLastSyncTimestamp(
  collectionKey: string,
  direction: SyncDirection,
  status: 'success' | 'partial' | 'failed',
  conflictCount: number
): Promise<void> {
  try {
    const docRef = doc(db, SYNC_METADATA_COLLECTION, collectionKey);
    await setDoc(
      docRef,
      {
        collection: collectionKey,
        last_sync_at: serverTimestamp(),
        last_sync_direction: direction,
        last_sync_status: status,
        last_sync_conflicts: conflictCount,
        updated_at: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    logger.error('[SyncService] Failed to update last sync timestamp', {
      collection: collectionKey,
      error,
    });
  }
}

export function normalizeSyncResult(raw: unknown): SyncResult {
  const result = raw as Record<string, unknown>;

  return {
    collection: (result.collection as string) || '',
    created: (result.created as number) || 0,
    updated: (result.updated as number) || 0,
    skipped: (result.skipped as number) || 0,
    errors: (result.errors as string[]) || [],
    conflicts: (result.conflicts as SyncConflict[]) || [],
    durationMs: result.durationMs as number | undefined,
  };
}

export function determineSyncStatus(result: SyncResult): 'success' | 'partial' | 'failed' {
  if (result.errors.length > 0 && (result.created > 0 || result.updated > 0)) {
    return 'partial';
  }
  if (result.errors.length > 0 && result.created === 0 && result.updated === 0) {
    return 'failed';
  }
  return 'success';
}
