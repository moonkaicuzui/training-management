// ============================================================
// Q-TRAIN Sync Service
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
  getDoc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from '@/services/firebase';
import { logger } from '@/utils/logger';

// ============================================================
// Configuration
// ============================================================

const GAS_URL = import.meta.env.VITE_GAS_SYNC_URL;
const API_KEY = import.meta.env.VITE_SYNC_API_KEY;

/** Maximum number of retry attempts for failed GAS requests */
const MAX_RETRIES = 3;

/** Base delay in milliseconds for exponential backoff */
const BASE_DELAY_MS = 1000;

/** Maximum delay cap in milliseconds */
const MAX_DELAY_MS = 10000;

// ============================================================
// Types
// ============================================================

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
  last_sync_at: Timestamp;
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
];

/** Firestore collection name for sync logs */
const SYNC_LOGS_COLLECTION = 'sync_logs';

/** Firestore collection name for sync metadata (timestamps) */
const SYNC_METADATA_COLLECTION = 'sync_metadata';

// ============================================================
// Validation
// ============================================================

/**
 * Validate that the sync service is properly configured.
 * Throws an error if required environment variables are missing.
 */
export function validateSyncConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!GAS_URL) {
    errors.push('GAS Sync URL is not configured. Set VITE_GAS_SYNC_URL in .env');
  }

  if (!API_KEY) {
    errors.push('Sync API Key is not configured. Set VITE_SYNC_API_KEY in .env');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate that the given collection keys are recognized sync collections.
 */
function validateCollections(collections: string[]): void {
  const validKeys = new Set(SYNC_COLLECTIONS.map((c) => c.key));

  for (const col of collections) {
    if (!validKeys.has(col)) {
      throw new Error(
        `Unknown sync collection: "${col}". Valid collections: ${Array.from(validKeys).join(', ')}`
      );
    }
  }
}

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
 * Call the GAS Web App endpoint with retry logic.
 * Sends a POST request and handles response validation.
 */
async function callGAS(action: string, payload: Record<string, unknown> = {}): Promise<unknown> {
  const config = validateSyncConfig();
  if (!config.valid) {
    throw new Error(config.errors.join('; '));
  }

  return withRetry(
    async () => {
      const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action,
          apiKey: API_KEY,
          ...payload,
        }),
      });

      if (!response.ok) {
        throw new Error(`GAS request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Sync failed');
      }

      return data.data;
    },
    `GAS action "${action}"`
  );
}

// ============================================================
// Sync History Logging
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
        last_sync_at: Timestamp.now(),
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
  const startTimestamp = Timestamp.now();

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
  const startTimestamp = Timestamp.now();

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
 * Get sync status from the GAS endpoint.
 * Returns information about each sheet's current state.
 */
export async function getSyncStatus(): Promise<
  Record<string, { sheetName: string; syncMode: string; sheetRows: number }>
> {
  const result = await callGAS('getSyncStatus');
  return result as Record<string, { sheetName: string; syncMode: string; sheetRows: number }>;
}
