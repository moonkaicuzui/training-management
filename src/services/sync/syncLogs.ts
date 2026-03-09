// ============================================================
// Q-TRAIN Sync Service - Sync Logs & Timestamps
// ============================================================

import {
  db,
  doc,
  collection,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from '@/services/firebase';
import { logger } from '@/utils/logger';
import type { SyncLogEntry, SyncMetadata } from './types';

/** Firestore collection name for sync logs */
const SYNC_LOGS_COLLECTION = 'sync_logs';

/** Firestore collection name for sync metadata (timestamps) */
const SYNC_METADATA_COLLECTION = 'sync_metadata';

// ============================================================
// Sync History Logging
// ============================================================

/**
 * Retrieve recent sync logs from Firestore.
 * @param count - Number of recent logs to retrieve (default: 10)
 * @param collectionFilter - Optional collection name to filter by
 */
export async function getSyncLogs(
  count: number = 10,
  collectionFilter?: string
): Promise<SyncLogEntry[]> {
  try {
    const colRef = collection(db, SYNC_LOGS_COLLECTION);

    const q = collectionFilter
      ? query(colRef, where('collections', 'array-contains', collectionFilter), orderBy('created_at', 'desc'), limit(count))
      : query(colRef, orderBy('created_at', 'desc'), limit(count));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as SyncLogEntry[];
  } catch (error) {
    logger.error('[SyncService] Failed to retrieve sync logs', { error });
    return [];
  }
}

// ============================================================
// Last Sync Timestamp Tracking
// ============================================================

/**
 * Get the last sync timestamp for a specific collection.
 * @param collectionKey - The collection key to check
 * @returns The metadata or null if no sync has been recorded
 */
export async function getLastSyncTimestamp(
  collectionKey: string
): Promise<SyncMetadata | null> {
  try {
    const docRef = doc(db, SYNC_METADATA_COLLECTION, collectionKey);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.data() as SyncMetadata;
  } catch (error) {
    logger.error('[SyncService] Failed to get last sync timestamp', {
      collection: collectionKey,
      error,
    });
    return null;
  }
}

/**
 * Get last sync timestamps for all collections.
 * @returns A map of collection key to sync metadata
 */
export async function getAllSyncTimestamps(): Promise<Record<string, SyncMetadata>> {
  try {
    const colRef = collection(db, SYNC_METADATA_COLLECTION);
    const snapshot = await getDocs(colRef);

    const result: Record<string, SyncMetadata> = {};
    snapshot.docs.forEach((d) => {
      result[d.id] = d.data() as SyncMetadata;
    });

    return result;
  } catch (error) {
    logger.error('[SyncService] Failed to get all sync timestamps', { error });
    return {};
  }
}
