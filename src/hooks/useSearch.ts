/**
 * useSearch Hook
 *
 * React hook wrapping the unified search service.
 * Provides debounced search with loading and error states.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { search, invalidateSearchCache } from '@/services/searchService';
import type { SearchResult, SearchOptions } from '@/services/searchService';

interface UseSearchOptions extends SearchOptions {
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number;
  /** Whether to search immediately (default: true) */
  enabled?: boolean;
}

interface UseSearchReturn {
  results: SearchResult[];
  isLoading: boolean;
  error: Error | null;
  /** Grouped results by type for categorized display */
  groupedResults: Record<SearchResult['type'], SearchResult[]>;
  /** Clear results and reset state */
  clear: () => void;
  /** Invalidate the search cache */
  invalidateCache: () => void;
}

export function useSearch(
  query: string,
  options?: UseSearchOptions
): UseSearchReturn {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const debounceMs = options?.debounceMs ?? 300;
  const enabled = options?.enabled ?? true;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(false);

  // Memoize search options to avoid unnecessary re-renders
  const searchOptions = useMemo<SearchOptions>(
    () => ({
      types: options?.types,
      limit: options?.limit,
      minScore: options?.minScore,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      // Use JSON string for stable comparison of array values
      JSON.stringify(options?.types),
      options?.limit,
      options?.minScore,
    ]
  );

  useEffect(() => {
    // Clear previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Reset abort flag
    abortRef.current = false;

    const trimmed = query.trim();

    // If query too short or disabled, clear results
    if (trimmed.length < 2 || !enabled) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    timerRef.current = setTimeout(async () => {
      try {
        const searchResults = await search(trimmed, searchOptions);
        // Only update if not aborted (query changed while searching)
        if (!abortRef.current) {
          setResults(searchResults);
          setIsLoading(false);
        }
      } catch (err) {
        if (!abortRef.current) {
          setError(err instanceof Error ? err : new Error('Search failed'));
          setResults([]);
          setIsLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      abortRef.current = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [query, searchOptions, debounceMs, enabled]);

  // Group results by type for categorized display
  const groupedResults = useMemo(() => {
    const groups: Record<SearchResult['type'], SearchResult[]> = {
      employee: [],
      program: [],
      session: [],
      result: [],
      material: [],
      trainer: [],
      capa: [],
      project: [],
    };

    for (const result of results) {
      groups[result.type].push(result);
    }

    return groups;
  }, [results]);

  const clear = useCallback(() => {
    setResults([]);
    setIsLoading(false);
    setError(null);
  }, []);

  const invalidateCache = useCallback(() => {
    invalidateSearchCache();
  }, []);

  return {
    results,
    isLoading,
    error,
    groupedResults,
    clear,
    invalidateCache,
  };
}
