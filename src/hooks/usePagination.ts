/**
 * usePagination - Cursor-Based Firestore Pagination Hook
 *
 * A reusable React hook that provides cursor-based pagination for any
 * Firestore collection. Supports forward/backward navigation, filters,
 * custom ordering, and automatic refresh.
 *
 * Uses Firestore document cursors (startAfter/endBefore) instead of
 * offset-based pagination for consistent performance on large collections.
 *
 * @example
 * ```tsx
 * const {
 *   data,
 *   isLoading,
 *   hasNextPage,
 *   hasPreviousPage,
 *   loadNextPage,
 *   loadPreviousPage,
 *   refresh,
 *   currentPage,
 * } = usePagination<TrainingResultRecord>({
 *   collectionName: 'training_results',
 *   pageSize: 50,
 *   orderByField: 'created_at',
 *   orderDirection: 'desc',
 *   filters: [{ field: 'program_code', op: '==', value: 'QIP-001' }],
 * });
 * ```
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { DocumentData, DocumentSnapshot } from 'firebase/firestore';
import type { WhereFilterOp } from 'firebase/firestore';
import { fetchPage } from '@/utils/firestorePagination';
import type { PageResult } from '@/utils/firestorePagination';
import { logger } from '@/utils/logger';

// ============================================================
// Types
// ============================================================

export interface UsePaginationOptions<T> {
  /** Firestore collection name (snake_case convention) */
  collectionName: string;
  /** Number of documents per page (default: 50) */
  pageSize?: number;
  /** Field to order by (default: 'created_at') */
  orderByField?: string;
  /** Sort direction (default: 'desc') */
  orderDirection?: 'asc' | 'desc';
  /** Array of where-clause filters */
  filters?: Array<{ field: string; op: WhereFilterOp; value: unknown }>;
  /** Whether to fetch data (default: true). Set false to defer loading. */
  enabled?: boolean;
  /** Optional transform function applied to each document */
  transform?: (id: string, data: DocumentData) => T;
}

export interface UsePaginationResult<T> {
  /** Current page data */
  data: T[];
  /** True while a fetch is in progress */
  isLoading: boolean;
  /** Error from the most recent fetch, or null */
  error: Error | null;
  /** True if there is a next page available */
  hasNextPage: boolean;
  /** True if the user has navigated past page 1 */
  hasPreviousPage: boolean;
  /** Navigate to the next page */
  loadNextPage: () => Promise<void>;
  /** Navigate to the previous page */
  loadPreviousPage: () => Promise<void>;
  /** Reload the current page (or reset to page 1 if filters changed) */
  refresh: () => Promise<void>;
  /** Total number of documents loaded in the current page */
  totalLoaded: number;
  /** Current page number (1-based) */
  currentPage: number;
}

// ============================================================
// Cursor Stack for Bidirectional Navigation
// ============================================================

interface CursorEntry {
  firstDoc: DocumentSnapshot<DocumentData>;
  lastDoc: DocumentSnapshot<DocumentData>;
}

// ============================================================
// Hook Implementation
// ============================================================

export function usePagination<T = DocumentData>(
  options: UsePaginationOptions<T>
): UsePaginationResult<T> {
  const {
    collectionName,
    pageSize = 50,
    orderByField = 'created_at',
    orderDirection = 'desc',
    filters = [],
    enabled = true,
    transform,
  } = options;

  // State
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Cursor stack: stores first/last doc snapshots for each visited page.
  // cursorStack[0] = page 1 cursors, cursorStack[1] = page 2 cursors, etc.
  const cursorStackRef = useRef<CursorEntry[]>([]);

  // Serialize filters for dependency tracking
  const filtersKey = JSON.stringify(filters);

  // --------------------------------------------------------
  // Core fetch logic
  // --------------------------------------------------------

  const executeFetch = useCallback(
    async (
      startAfterDoc?: DocumentSnapshot<DocumentData>,
      endBeforeDoc?: DocumentSnapshot<DocumentData>
    ): Promise<PageResult<DocumentData> | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchPage<DocumentData>(collectionName, {
          pageSize,
          orderByField,
          orderDirection,
          filters,
          startAfterDoc,
          endBeforeDoc,
        });

        const transformedData: T[] = result.documents.map((doc) => {
          if (transform) {
            return transform(doc.id, doc.data);
          }
          return doc.data as T;
        });

        setData(transformedData);
        setHasNextPage(result.hasMore);

        return result as PageResult<DocumentData>;
      } catch (err) {
        const fetchError =
          err instanceof Error ? err : new Error(String(err));
        logger.error(
          `[usePagination] Failed to fetch "${collectionName}" page:`,
          fetchError
        );
        setError(fetchError);
        setData([]);
        setHasNextPage(false);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [collectionName, pageSize, orderByField, orderDirection, filtersKey, transform]
  );

  // --------------------------------------------------------
  // Load first page
  // --------------------------------------------------------

  const loadFirstPage = useCallback(async () => {
    cursorStackRef.current = [];
    setCurrentPage(1);

    const result = await executeFetch();

    if (result && result.firstDoc && result.lastDoc) {
      cursorStackRef.current = [
        { firstDoc: result.firstDoc, lastDoc: result.lastDoc },
      ];
    }
  }, [executeFetch]);

  // --------------------------------------------------------
  // Load next page
  // --------------------------------------------------------

  const loadNextPage = useCallback(async () => {
    const stack = cursorStackRef.current;
    const currentEntry = stack[stack.length - 1];

    if (!currentEntry || !hasNextPage) return;

    const result = await executeFetch(currentEntry.lastDoc);

    if (result && result.firstDoc && result.lastDoc) {
      cursorStackRef.current = [...stack, { firstDoc: result.firstDoc, lastDoc: result.lastDoc }];
      setCurrentPage((prev) => prev + 1);
    }
  }, [executeFetch, hasNextPage]);

  // --------------------------------------------------------
  // Load previous page
  // --------------------------------------------------------

  const loadPreviousPage = useCallback(async () => {
    const stack = cursorStackRef.current;

    if (stack.length <= 1) return; // Already on page 1

    // Pop the current page entry
    const newStack = stack.slice(0, -1);
    cursorStackRef.current = newStack;

    if (newStack.length === 0) {
      // Go back to page 1 (no cursor needed)
      setCurrentPage(1);
      const result = await executeFetch();
      if (result && result.firstDoc && result.lastDoc) {
        cursorStackRef.current = [
          { firstDoc: result.firstDoc, lastDoc: result.lastDoc },
        ];
      }
    } else {
      // Re-fetch using the previous page's last doc as startAfter
      const prevEntry = newStack[newStack.length - 1];

      // For going back, we need the startAfter of the target page.
      // If target is page 1, no cursor. Otherwise use the page before's lastDoc.
      if (newStack.length === 1) {
        // Target is page 1
        setCurrentPage(1);
        const result = await executeFetch();
        if (result && result.firstDoc && result.lastDoc) {
          cursorStackRef.current = [
            { firstDoc: result.firstDoc, lastDoc: result.lastDoc },
          ];
        }
      } else {
        const pageBeforeTarget = newStack[newStack.length - 2];
        setCurrentPage(newStack.length);
        const result = await executeFetch(pageBeforeTarget.lastDoc);
        if (result && result.firstDoc && result.lastDoc) {
          cursorStackRef.current = [
            ...newStack.slice(0, -1),
            { firstDoc: result.firstDoc, lastDoc: result.lastDoc },
          ];
        }
      }

      // Use existing cursors to go back to the target page
      void prevEntry; // cursor reference retained in stack
    }
  }, [executeFetch]);

  // --------------------------------------------------------
  // Refresh (reload current page or reset on filter change)
  // --------------------------------------------------------

  const refresh = useCallback(async () => {
    await loadFirstPage();
  }, [loadFirstPage]);

  // --------------------------------------------------------
  // Auto-fetch on mount and when options change
  // --------------------------------------------------------

  useEffect(() => {
    if (!enabled) {
      setData([]);
      setIsLoading(false);
      setError(null);
      setHasNextPage(false);
      setCurrentPage(1);
      cursorStackRef.current = [];
      return;
    }

    void loadFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, collectionName, pageSize, orderByField, orderDirection, filtersKey]);

  // --------------------------------------------------------
  // Return
  // --------------------------------------------------------

  return {
    data,
    isLoading,
    error,
    hasNextPage,
    hasPreviousPage: currentPage > 1,
    loadNextPage,
    loadPreviousPage,
    refresh,
    totalLoaded: data.length,
    currentPage,
  };
}
