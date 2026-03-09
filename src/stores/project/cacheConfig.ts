/**
 * Cache configuration for ProjectStore
 *
 * Cache timestamps live outside the store so they are not persisted.
 */

export const CACHE_TTL_MS = 30_000; // 30초

export const isCacheValid = (ts: number | null, len: number) =>
  ts !== null && len > 0 && Date.now() - ts < CACHE_TTL_MS;

/** Mutable cache timestamps (outside store — not persisted) */
export const cache = {
  membersLastFetched: null as number | null,
  projectsLastFetched: null as number | null,
  tasksLastFetched: null as number | null,
  categoriesLastFetched: null as number | null,
  eventsLastFetched: null as number | null,
  eventsLastRange: null as { start: number; end: number } | null,
};

/** Reset all cache timestamps */
export const resetCache = () => {
  cache.membersLastFetched = null;
  cache.projectsLastFetched = null;
  cache.tasksLastFetched = null;
  cache.categoriesLastFetched = null;
  cache.eventsLastFetched = null;
  cache.eventsLastRange = null;
};
