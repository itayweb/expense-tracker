const TTL_MS = 30_000; // 30 seconds

interface CacheEntry {
  data: unknown;
  cachedAt: number;
}

const cache = new Map<string, CacheEntry>();

export function getHistoryCacheKey(
  month: number,
  year: number,
  weekNumber: number | null,
  categoryFilter: number | null
): string {
  return `${year}-${month}-${weekNumber ?? "all"}-${categoryFilter ?? "all"}`;
}

export function getCachedHistory(key: string): unknown | null {
  return cache.get(key)?.data ?? null;
}

export function isHistoryCacheFresh(key: string): boolean {
  const entry = cache.get(key);
  return !!entry && Date.now() - entry.cachedAt < TTL_MS;
}

export function setCachedHistory(key: string, data: unknown): void {
  cache.set(key, { data, cachedAt: Date.now() });
}

export function invalidateHistoryCache(): void {
  cache.clear();
}
