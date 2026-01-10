/**
 * Simple in-memory rate limiter for Vercel free tier optimization
 * Note: For production, consider using Redis or Vercel's rate limiting
 */

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitStore>();

/**
 * Rate limit check - returns true if request should be allowed
 * @param key - Unique identifier for the rate limit (e.g., IP address or user ID)
 * @param maxRequests - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute default
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = store.get(key);

  // Clean up old entries periodically (every 1000 checks)
  if (Math.random() < 0.001) {
    for (const [k, v] of store.entries()) {
      if (v.resetTime < now) {
        store.delete(k);
      }
    }
  }

  if (!record || record.resetTime < now) {
    // Create new record or reset expired one
    store.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    };
  }

  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetTime,
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetAt: record.resetTime,
  };
}

/**
 * Get client identifier for rate limiting
 */
export function getRateLimitKey(request: Request): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");
  
  const ip = cfConnectingIP || 
             (forwarded ? forwarded.split(",")[0].trim() : null) || 
             realIP || 
             "unknown";
  
  return `rate_limit:${ip}`;
}
