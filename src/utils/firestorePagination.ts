/**
 * Firestore Cursor-Based Pagination Utilities
 *
 * Low-level utility functions for building paginated Firestore queries.
 * Uses cursor-based pagination (startAfter/endBefore) for efficient
 * navigation through large collections without offset-based skipping.
 *
 * @example
 * ```ts
 * import { createPaginatedQuery, fetchPage } from '@/utils/firestorePagination';
 *
 * const q = createPaginatedQuery('training_results', {
 *   pageSize: 50,
 *   orderByField: 'created_at',
 *   orderDirection: 'desc',
 *   filters: [{ field: 'program_code', op: '==', value: 'QIP-001' }],
 * });
 * const { documents, lastDoc, hasMore } = await fetchPage(q, 50);
 * ```
 */

import {
  db,
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  where,
} from '@/services/firebase';
import {
  endBefore,
  limitToLast,
  getCountFromServer,
} from 'firebase/firestore';
import type {
  DocumentData,
  DocumentSnapshot,
  QueryConstraint,
} from 'firebase/firestore';
import type { WhereFilterOp, Query } from 'firebase/firestore';
import { logger } from '@/utils/logger';

// ============================================================
// Types
// ============================================================

export interface PaginationFilter {
  field: string;
  op: WhereFilterOp;
  value: unknown;
}

export interface PaginatedQueryOptions {
  pageSize?: number;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  filters?: PaginationFilter[];
  startAfterDoc?: DocumentSnapshot<DocumentData>;
  endBeforeDoc?: DocumentSnapshot<DocumentData>;
}

export interface PageResult<T = DocumentData> {
  documents: Array<{ id: string; data: T }>;
  firstDoc: DocumentSnapshot<DocumentData> | null;
  lastDoc: DocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
  size: number;
}

// ============================================================
// Query Builder
// ============================================================

/**
 * Build a paginated Firestore query with filters, ordering, and cursors.
 *
 * @param collectionName - Firestore collection name (snake_case)
 * @param options - Pagination and filter options
 * @returns A Firestore Query ready for execution
 */
export function createPaginatedQuery(
  collectionName: string,
  options: PaginatedQueryOptions = {}
): Query<DocumentData> {
  const {
    pageSize = 50,
    orderByField = 'created_at',
    orderDirection = 'desc',
    filters = [],
    startAfterDoc,
    endBeforeDoc,
  } = options;

  const constraints: QueryConstraint[] = [];

  // Apply where filters
  for (const filter of filters) {
    constraints.push(where(filter.field, filter.op, filter.value));
  }

  // Apply ordering
  constraints.push(orderBy(orderByField, orderDirection));

  // Apply cursor-based pagination
  if (startAfterDoc) {
    constraints.push(startAfter(startAfterDoc));
    constraints.push(limit(pageSize));
  } else if (endBeforeDoc) {
    constraints.push(endBefore(endBeforeDoc));
    constraints.push(limitToLast(pageSize));
  } else {
    constraints.push(limit(pageSize));
  }

  const collectionRef = collection(db, collectionName);
  return query(collectionRef, ...constraints);
}

// ============================================================
// Page Fetcher
// ============================================================

/**
 * Fetch a single page of documents from Firestore.
 *
 * Requests pageSize + 1 documents to determine if a next page exists,
 * then returns only pageSize documents to the caller.
 *
 * @param collectionName - Firestore collection name
 * @param options - Pagination options
 * @returns Page result with documents, cursors, and pagination metadata
 */
export async function fetchPage<T = DocumentData>(
  collectionName: string,
  options: PaginatedQueryOptions = {}
): Promise<PageResult<T>> {
  const pageSize = options.pageSize ?? 50;

  try {
    // Fetch one extra document to determine hasMore
    const q = createPaginatedQuery(collectionName, {
      ...options,
      pageSize: options.endBeforeDoc ? pageSize : pageSize + 1,
    });

    const snapshot = await getDocs(q);
    const docs = snapshot.docs;

    let hasMore: boolean;
    let resultDocs: typeof docs;

    if (options.endBeforeDoc) {
      // For backward navigation, we cannot use the +1 trick with limitToLast.
      // If we got exactly pageSize docs, there might be more before them.
      hasMore = docs.length === pageSize;
      resultDocs = docs;
    } else {
      // Forward navigation: if we got pageSize+1, there are more pages.
      hasMore = docs.length > pageSize;
      resultDocs = hasMore ? docs.slice(0, pageSize) : docs;
    }

    const documents = resultDocs.map((docSnap) => ({
      id: docSnap.id,
      data: { ...docSnap.data(), id: docSnap.id } as T,
    }));

    return {
      documents,
      firstDoc: resultDocs.length > 0 ? resultDocs[0] : null,
      lastDoc: resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null,
      hasMore,
      size: documents.length,
    };
  } catch (error) {
    logger.error(`[firestorePagination] fetchPage failed for "${collectionName}":`, error);
    throw error;
  }
}

// ============================================================
// Count Utility
// ============================================================

/**
 * Get an approximate count of documents matching the given filters.
 *
 * Uses Firestore's server-side aggregation (getCountFromServer) for
 * efficiency -- no documents are downloaded.
 *
 * @param collectionName - Firestore collection name
 * @param filters - Optional array of where-clause filters
 * @returns Approximate document count
 */
export async function countDocuments(
  collectionName: string,
  filters: PaginationFilter[] = []
): Promise<number> {
  try {
    const constraints: QueryConstraint[] = [];

    for (const filter of filters) {
      constraints.push(where(filter.field, filter.op, filter.value));
    }

    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, ...constraints);
    const countSnapshot = await getCountFromServer(q);

    return countSnapshot.data().count;
  } catch (error) {
    logger.error(`[firestorePagination] countDocuments failed for "${collectionName}":`, error);
    throw error;
  }
}
