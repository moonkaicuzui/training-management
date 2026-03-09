// ============================================================
// Q-TRAIN Sync Service - Sync Operations
// Google Sheets <-> Firestore 동기화 (GAS Web App 호출)
// ============================================================
// Features:
//   - Retry logic with exponential backoff (3 retries, 1s base)
//   - Progress callback for UI tracking
//   - Sync history logging to Firestore (sync_logs collection)
//   - Conflict detection in sync results
//   - Last sync timestamp tracking per collection (sync_metadata)
//   - Pre-sync validation
// ============================================================

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
  SyncOptions,
  SyncLogEntry,
} from './types';
import { SYNC_COLLECTIONS, validateSyncConfig, validateCollections } from './config';

// ============================================================
// Configuration
// ============================================================

/** Maximum number of retry attempts for failed sync requests */
const MAX_RETRIES = 3;

/** Base delay in milliseconds for exponential backoff */
const BASE_DELAY_MS = 1000;

/** Maximum delay cap in milliseconds */
const MAX_DELAY_MS = 10000;

/** Firestore collection name for sync logs */
const SYNC_LOGS_COLLECTION = 'sync_logs';

/** Firestore collection name for sync metadata (timestamps) */
const SYNC_METADATA_COLLECTION = 'sync_metadata';

// ============================================================
// Retry Logic with Exponential Backoff
// ============================================================

/**
 * Calculate delay for exponential backoff with jitter.
 * Formula: min(MAX_DELAY, BASE_DELAY * 2^attempt) + random jitter
 */
function calculateBackoffDelay(attempt: number): number {
  const exponentialDelay = BASE_DELAY_MS * Math.pow(2, attempt);
  const cappedDelay = Math.min(exponentialDelay, MAX_DELAY_MS);
  // Add random jitter (0-25% of the delay) to prevent thundering herd
  const jitter = cappedDelay * Math.random() * 0.25;
  return cappedDelay + jitter;
}

/**
 * Sleep for the specified number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic and exponential backoff.
 * @param fn - The async function to execute
 * @param context - Description of the operation (for logging)
 * @param maxRetries - Maximum number of retry attempts
 * @returns The result of the function
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  context: string,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const delay = calculateBackoffDelay(attempt);
        logger.warn(
          `[SyncService] ${context} failed (attempt ${attempt + 1}/${maxRetries + 1}). ` +
            `Retrying in ${Math.round(delay)}ms...`,
          { error: lastError.message }
        );
        await sleep(delay);
      } else {
        logger.error(
          `[SyncService] ${context} failed after ${maxRetries + 1} attempts.`,
          { error: lastError.message }
        );
      }
    }
  }

  throw lastError!;
}

// ============================================================
// GAS Communication
// ============================================================

/**
 * Call the GAS Web App endpoint via Cloud Functions proxy.
 * GAS API keys are stored server-side in Cloud Functions secrets,
 * not exposed in the client bundle.
 */
async function callGAS(action: string, payload: Record<string, unknown> = {}): Promise<unknown> {
  return withRetry(
    async () => {
      const response = await fetch('/api/sync/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ...payload,
        }),
      });

      if (!response.ok) {
        throw new Error(`Sync request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Sync failed');
      }

      return data.data;
    },
    `Sync action "${action}"`
  );
}

// ============================================================
// Internal Helpers
// ============================================================

/**
 * Save a sync log entry to Firestore.
 * Logs are append-only for audit trail.
 */
async function saveSyncLog(logEntry: Omit<SyncLogEntry, 'id' | 'created_at'>): Promise<string> {
  try {
    const colRef = collection(db, SYNC_LOGS_COLLECTION);
    const docRef = await addDoc(colRef, {
      ...logEntry,
      created_at: serverTimestamp(),
    });

    logger.info('[SyncService] Sync log saved', { logId: docRef.id });
    return docRef.id;
  } catch (error) {
    // Log but don't fail the sync operation due to logging failure
    logger.error('[SyncService] Failed to save sync log', { error });
    return '';
  }
}

/**
 * Update the last sync timestamp for a collection.
 * @param collectionKey - The collection key
 * @param direction - The sync direction used
 * @param status - The sync status
 * @param conflictCount - Number of conflicts detected
 */
async function updateLastSyncTimestamp(
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
    // Log but don't fail the sync operation
    logger.error('[SyncService] Failed to update last sync timestamp', {
      collection: collectionKey,
      error,
    });
  }
}

// ============================================================
// Conflict Detection Helpers
// ============================================================

/**
 * Normalize a raw sync result from GAS, ensuring the conflicts array exists.
 * The GAS endpoint may or may not return conflicts; we ensure a consistent shape.
 */
function normalizeSyncResult(raw: unknown): SyncResult {
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

/**
 * Determine the sync status for a single collection result.
 */
function determineSyncStatus(result: SyncResult): 'success' | 'partial' | 'failed' {
  if (result.errors.length > 0 && (result.created > 0 || result.updated > 0)) {
    return 'partial';
  }
  if (result.errors.length > 0 && result.created === 0 && result.updated === 0) {
    return 'failed';
  }
  return 'success';
}

// ============================================================
// Public API: Sync Operations
// ============================================================

/**
 * Sync individual collections with progress tracking and logging.
 *
 * @param collections - Array of collection keys to sync
 * @param direction - Sync direction
 * @param options - Optional settings (progress callback, user info, logging control)
 * @returns Array of sync results with conflict information
 *
 * @example
 * ```ts
 * const results = await triggerSync(
 *   ['employees', 'training_programs'],
 *   'bidirectional',
 *   {
 *     onProgress: (p) => console.log(`${p.percent}% - ${p.currentCollection}`),
 *     initiatedBy: 'admin@example.com',
 *   }
 * );
 * ```
 */
export async function triggerSync(
  collections: string[],
  direction: SyncDirection,
  options: SyncOptions = {}
): Promise<SyncResult[]> {
  const { onProgress, initiatedBy, skipLogging = false } = options;

  // Pre-sync validation
  const config = validateSyncConfig();
  if (!config.valid) {
    throw new Error(`Sync configuration invalid: ${config.errors.join('; ')}`);
  }

  validateCollections(collections);

  const results: SyncResult[] = [];
  const startTime = Date.now();
  const startTimestamp = serverTimestamp();

  logger.info('[SyncService] Starting sync', {
    collections,
    direction,
    initiatedBy,
  });

  for (let i = 0; i < collections.length; i++) {
    const collectionKey = collections[i];

    // Report progress: starting this collection
    onProgress?.({
      currentCollection: collectionKey,
      currentIndex: i,
      totalCollections: collections.length,
      status: 'in_progress',
      percent: Math.round((i / collections.length) * 100),
    });

    const collectionStartTime = Date.now();

    try {
      const raw = await callGAS('syncCollection', { collection: collectionKey, direction });
      const result = normalizeSyncResult(raw);
      result.collection = collectionKey;
      result.durationMs = Date.now() - collectionStartTime;

      results.push(result);

      // Update last sync timestamp for this collection
      const collectionStatus = determineSyncStatus(result);
      await updateLastSyncTimestamp(
        collectionKey,
        direction,
        collectionStatus,
        result.conflicts.length
      );

      // Report progress: completed this collection
      onProgress?.({
        currentCollection: collectionKey,
        currentIndex: i,
        totalCollections: collections.length,
        status: 'completed',
        percent: Math.round(((i + 1) / collections.length) * 100),
        result,
      });

      logger.info(`[SyncService] Collection "${collectionKey}" synced`, {
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
        errors: result.errors.length,
        conflicts: result.conflicts.length,
        durationMs: result.durationMs,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const failedResult: SyncResult = {
        collection: collectionKey,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [errorMessage],
        conflicts: [],
        durationMs: Date.now() - collectionStartTime,
      };

      results.push(failedResult);

      // Update last sync timestamp as failed
      await updateLastSyncTimestamp(collectionKey, direction, 'failed', 0);

      // Report progress: failed this collection
      onProgress?.({
        currentCollection: collectionKey,
        currentIndex: i,
        totalCollections: collections.length,
        status: 'failed',
        percent: Math.round(((i + 1) / collections.length) * 100),
        result: failedResult,
        error: errorMessage,
      });

      logger.error(`[SyncService] Collection "${collectionKey}" sync failed`, {
        error: errorMessage,
      });
    }
  }

  const totalDurationMs = Date.now() - startTime;

  // Save sync log to Firestore
  if (!skipLogging) {
    const totalConflicts = results.reduce((sum, r) => sum + r.conflicts.length, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalCreated = results.reduce((sum, r) => sum + r.created, 0);
    const totalUpdated = results.reduce((sum, r) => sum + r.updated, 0);
    const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);

    const overallStatus: 'success' | 'partial' | 'failed' =
      totalErrors === 0
        ? 'success'
        : results.some((r) => r.errors.length === 0)
          ? 'partial'
          : 'failed';

    await saveSyncLog({
      direction,
      collections,
      results,
      status: overallStatus,
      totalConflicts,
      totalErrors,
      totalCreated,
      totalUpdated,
      totalSkipped,
      durationMs: totalDurationMs,
      initiatedBy,
      started_at: startTimestamp,
      completed_at: serverTimestamp(),
    });
  }

  logger.info('[SyncService] Sync completed', {
    collections: collections.length,
    totalDurationMs,
    totalCreated: results.reduce((s, r) => s + r.created, 0),
    totalUpdated: results.reduce((s, r) => s + r.updated, 0),
    totalConflicts: results.reduce((s, r) => s + r.conflicts.length, 0),
    totalErrors: results.reduce((s, r) => s + r.errors.length, 0),
  });

  return results;
}

/**
 * Sync all collections at once with progress tracking and logging.
 *
 * @param direction - Sync direction
 * @param options - Optional settings (progress callback, user info, logging control)
 * @returns Array of sync results with conflict information
 *
 * @example
 * ```ts
 * const results = await triggerSyncAll('bidirectional', {
 *   onProgress: (p) => setProgress(p),
 *   initiatedBy: currentUser.email,
 * });
 * ```
 */
export async function triggerSyncAll(
  direction: SyncDirection,
  options: SyncOptions = {}
): Promise<SyncResult[]> {
  const { onProgress, initiatedBy, skipLogging = false } = options;

  // Pre-sync validation
  const config = validateSyncConfig();
  if (!config.valid) {
    throw new Error(`Sync configuration invalid: ${config.errors.join('; ')}`);
  }

  const allCollectionKeys = SYNC_COLLECTIONS.map((c) => c.key);
  const startTime = Date.now();
  const startTimestamp = serverTimestamp();

  logger.info('[SyncService] Starting full sync', { direction, initiatedBy });

  // Report progress: starting
  onProgress?.({
    currentCollection: 'all',
    currentIndex: 0,
    totalCollections: allCollectionKeys.length,
    status: 'in_progress',
    percent: 0,
  });

  try {
    const raw = await callGAS('syncAll', { direction });
    const rawResults = Array.isArray(raw) ? raw : [];
    const results: SyncResult[] = rawResults.map((r: unknown) => normalizeSyncResult(r));

    const totalDurationMs = Date.now() - startTime;

    // Update last sync timestamp for each collection
    for (const result of results) {
      if (result.collection) {
        const collectionStatus = determineSyncStatus(result);
        await updateLastSyncTimestamp(
          result.collection,
          direction,
          collectionStatus,
          result.conflicts.length
        );
      }
    }

    // Report progress: completed
    onProgress?.({
      currentCollection: 'all',
      currentIndex: allCollectionKeys.length,
      totalCollections: allCollectionKeys.length,
      status: 'completed',
      percent: 100,
    });

    // Save sync log
    if (!skipLogging) {
      const totalConflicts = results.reduce((sum, r) => sum + r.conflicts.length, 0);
      const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
      const totalCreated = results.reduce((sum, r) => sum + r.created, 0);
      const totalUpdated = results.reduce((sum, r) => sum + r.updated, 0);
      const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);

      const overallStatus: 'success' | 'partial' | 'failed' =
        totalErrors === 0
          ? 'success'
          : results.some((r) => r.errors.length === 0)
            ? 'partial'
            : 'failed';

      await saveSyncLog({
        direction,
        collections: allCollectionKeys,
        results,
        status: overallStatus,
        totalConflicts,
        totalErrors,
        totalCreated,
        totalUpdated,
        totalSkipped,
        durationMs: totalDurationMs,
        initiatedBy,
        started_at: startTimestamp,
        completed_at: serverTimestamp(),
      });
    }

    logger.info('[SyncService] Full sync completed', {
      totalDurationMs,
      totalResults: results.length,
    });

    return results;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Report progress: failed
    onProgress?.({
      currentCollection: 'all',
      currentIndex: 0,
      totalCollections: allCollectionKeys.length,
      status: 'failed',
      percent: 0,
      error: errorMessage,
    });

    // Save failure log
    if (!skipLogging) {
      await saveSyncLog({
        direction,
        collections: allCollectionKeys,
        results: [],
        status: 'failed',
        totalConflicts: 0,
        totalErrors: 1,
        totalCreated: 0,
        totalUpdated: 0,
        totalSkipped: 0,
        durationMs: Date.now() - startTime,
        initiatedBy,
        started_at: startTimestamp,
        completed_at: serverTimestamp(),
      });
    }

    logger.error('[SyncService] Full sync failed', { error: errorMessage });
    throw error;
  }
}

/**
 * Get sync status from the GAS endpoint via Cloud Functions proxy.
 * Returns information about each sheet's current state.
 */
export async function getSyncStatus(): Promise<
  Record<string, { sheetName: string; syncMode: string; sheetRows: number }>
> {
  const response = await fetch('/api/sync/status', {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Sync status request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to get sync status');
  }

  return data.data as Record<string, { sheetName: string; syncMode: string; sheetRows: number }>;
}
