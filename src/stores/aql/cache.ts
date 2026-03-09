const CACHE_TTL_MS = 5 * 60 * 1000;

export const cache = { monthsAt: 0, dataAt: 0, dataMonth: '', configAt: 0 };

export const isFresh = (ts: number) => ts > 0 && Date.now() - ts < CACHE_TTL_MS;
