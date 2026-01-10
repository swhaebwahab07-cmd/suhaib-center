/**
 * Simple in-memory cache for Vercel free tier optimization
 * Note: For production with multiple instances, consider using Redis
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Get cached value
 */
export function getCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

/**
 * Set cached value
 */
export function setCache<T>(key: string, data: T, ttlMs: number = 60000): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Generate cache key for analytics
 */
export function getAnalyticsCacheKey(linktreeId: string): string {
  return `analytics:${linktreeId}`;
}
