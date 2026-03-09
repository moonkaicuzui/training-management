import { serverTimestamp } from '@/services/firebase';
import { logger } from '@/utils/logger';
import type { SyncDirection, SyncResult, SyncOptions } from './types';
import { SYNC_COLLECTIONS, validateSyncConfig, validateCollections } from './config';
import { callGAS } from './gasClient';
import {
  saveSyncLog,
  updateLastSyncTimestamp,
  normalizeSyncResult,
  determineSyncStatus,
} from './syncHelpers';

export async function triggerSync(
  collections: string[],
  direction: SyncDirection,
  options: SyncOptions = {}
): Promise<SyncResult[]> {
  const { onProgress, initiatedBy, skipLogging = false } = options;

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

      const collectionStatus = determineSyncStatus(result);
      await updateLastSyncTimestamp(
        collectionKey,
        direction,
        collectionStatus,
        result.conflicts.length
      );

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

      await updateLastSyncTimestamp(collectionKey, direction, 'failed', 0);

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

export async function triggerSyncAll(
  direction: SyncDirection,
  options: SyncOptions = {}
): Promise<SyncResult[]> {
  const { onProgress, initiatedBy, skipLogging = false } = options;

  const config = validateSyncConfig();
  if (!config.valid) {
    throw new Error(`Sync configuration invalid: ${config.errors.join('; ')}`);
  }

  const allCollectionKeys = SYNC_COLLECTIONS.map((c) => c.key);
  const startTime = Date.now();
  const startTimestamp = serverTimestamp();

  logger.info('[SyncService] Starting full sync', { direction, initiatedBy });

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

    onProgress?.({
      currentCollection: 'all',
      currentIndex: allCollectionKeys.length,
      totalCollections: allCollectionKeys.length,
      status: 'completed',
      percent: 100,
    });

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

    onProgress?.({
      currentCollection: 'all',
      currentIndex: 0,
      totalCollections: allCollectionKeys.length,
      status: 'failed',
      percent: 0,
      error: errorMessage,
    });

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
