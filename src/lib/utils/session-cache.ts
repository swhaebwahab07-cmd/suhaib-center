// Simple in-memory cache for session validation (reduces database calls)
// Cache TTL: 5 minutes (300000 ms)
const SESSION_CACHE_TTL = 300000;

interface CacheEntry {
  isValid: boolean;
  timestamp: number;
}

const sessionCache = new Map<string, CacheEntry>();

export function getCachedSessionValidation(sessionToken: string): boolean | null {
  const entry = sessionCache.get(sessionToken);
  if (!entry) {
    return null; // Not cached
  }
  
  const now = Date.now();
  if (now - entry.timestamp > SESSION_CACHE_TTL) {
    // Cache expired
    sessionCache.delete(sessionToken);
    return null;
  }
  
  return entry.isValid;
}

export function setCachedSessionValidation(sessionToken: string, isValid: boolean): void {
  sessionCache.set(sessionToken, {
    isValid,
    timestamp: Date.now(),
  });
  
  // Clean up old entries periodically (keep cache size reasonable)
  if (sessionCache.size > 1000) {
    const now = Date.now();
    for (const [token, entry] of sessionCache.entries()) {
      if (now - entry.timestamp > SESSION_CACHE_TTL) {
        sessionCache.delete(token);
      }
    }
  }
}

