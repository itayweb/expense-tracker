import { BudgetWithCategories } from "./types";

const TTL_MS = 30_000; // 30 seconds

let cache: BudgetWithCategories | null = null;
let cachedAt = 0;

export function getCachedBudget(): BudgetWithCategories | null {
  return cache;
}

/** Returns true if the cache exists AND is younger than TTL — skip background refetch */
export function isBudgetCacheFresh(): boolean {
  return !!cache && Date.now() - cachedAt < TTL_MS;
}

export function setCachedBudget(data: BudgetWithCategories): void {
  cache = data;
  cachedAt = Date.now();
}

export function invalidateBudgetCache(): void {
  cache = null;
  cachedAt = 0;
}
