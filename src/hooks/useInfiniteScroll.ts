/**
 * useInfiniteScroll - IntersectionObserver-Based Infinite Scroll Hook
 *
 * Attaches an IntersectionObserver to a sentinel element. When the sentinel
 * enters the viewport, the provided callback is invoked to load more data.
 *
 * Designed to work seamlessly with `usePagination` for infinite-scroll UIs.
 *
 * @example
 * ```tsx
 * const { data, isLoading, hasNextPage, loadNextPage } = usePagination<Item>({
 *   collectionName: 'training_results',
 * });
 *
 * const sentinelRef = useInfiniteScroll({
 *   onLoadMore: loadNextPage,
 *   hasMore: hasNextPage,
 *   isLoading,
 * });
 *
 * return (
 *   <div>
 *     {data.map((item) => (
 *       <ItemCard key={item.id} item={item} />
 *     ))}
 *     <div ref={sentinelRef} aria-hidden="true" />
 *   </div>
 * );
 * ```
 */

import { useRef, useEffect, useCallback } from 'react';

// ============================================================
// Types
// ============================================================

export interface UseInfiniteScrollOptions {
  /** Callback to invoke when the sentinel becomes visible */
  onLoadMore: () => void | Promise<void>;
  /** Whether more data is available. Observer disconnects when false. */
  hasMore: boolean;
  /** Whether a load is currently in progress. Prevents duplicate calls. */
  isLoading: boolean;
  /**
   * IntersectionObserver root margin (default: '200px').
   * A positive value triggers loading before the sentinel is fully visible,
   * providing a smoother experience.
   */
  rootMargin?: string;
  /**
   * IntersectionObserver visibility threshold (default: 0).
   * 0 means the callback fires as soon as even one pixel is visible.
   */
  threshold?: number;
  /** Whether the infinite scroll is enabled (default: true) */
  enabled?: boolean;
}

// ============================================================
// Hook Implementation
// ============================================================

export function useInfiniteScroll(
  options: UseInfiniteScrollOptions
): React.RefCallback<HTMLElement> {
  const {
    onLoadMore,
    hasMore,
    isLoading,
    rootMargin = '200px',
    threshold = 0,
    enabled = true,
  } = options;

  // Store the current observer so we can disconnect when the sentinel changes
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Track latest values via refs to avoid re-creating the observer on every render
  const onLoadMoreRef = useRef(onLoadMore);
  const hasMoreRef = useRef(hasMore);
  const isLoadingRef = useRef(isLoading);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  /**
   * Ref callback. Each time the sentinel element mounts or changes,
   * we set up a new IntersectionObserver.
   */
  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      // Disconnect any existing observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      // Do not observe if disabled or no node
      if (!enabled || !node) return;

      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (
            entry?.isIntersecting &&
            hasMoreRef.current &&
            !isLoadingRef.current
          ) {
            void onLoadMoreRef.current();
          }
        },
        {
          rootMargin,
          threshold,
        }
      );

      observer.observe(node);
      observerRef.current = observer;
    },
    [enabled, rootMargin, threshold]
  );

  return sentinelRef;
}
