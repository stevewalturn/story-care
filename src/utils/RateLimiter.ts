/**
 * Simple In-Memory Rate Limiter
 * No external dependencies, HIPAA-compliant (no PHI sent externally)
 *
 * For production with multiple servers, consider:
 * - Redis-based rate limiting (with BAA)
 * - Or Vercel KV (with BAA)
 * - Or keep this simple approach (works well for single-server or low traffic)
 */

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

// In-memory store (resets on server restart)
const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export type RateLimitConfig = {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

/**
 * Check if request is within rate limit
 *
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 *
 * @example
 * ```typescript
 * const result = checkRateLimit(userIp, {
 *   windowMs: 60 * 1000, // 1 minute
 *   maxRequests: 100,
 * });
 *
 * if (!result.allowed) {
 *   return NextResponse.json(
 *     { error: 'Too many requests' },
 *     { status: 429 }
 *   );
 * }
 * ```
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const key = `${identifier}`;

  // Get existing entry or create new one
  let entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // Create new window
    entry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    store.set(key, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: entry.resetAt,
    };
  }

  // Increment count in existing window
  entry.count++;

  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  return (forwardedFor?.split(',')[0]?.trim()) || realIp || 'unknown';
}

/**
 * Pre-configured rate limiters for different use cases
 */

// General API rate limit: 100 requests per minute
export const generalRateLimit: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 100,
};

// Auth rate limit: 5 attempts per 15 minutes
export const authRateLimit: RateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
};

// Upload rate limit: 10 uploads per hour
export const uploadRateLimit: RateLimitConfig = {
  windowMs: 60 * 60 * 1000,
  maxRequests: 10,
};

// AI rate limit: 20 requests per hour
export const aiRateLimit: RateLimitConfig = {
  windowMs: 60 * 60 * 1000,
  maxRequests: 20,
};

// Export rate limit: 5 exports per day
export const exportRateLimit: RateLimitConfig = {
  windowMs: 24 * 60 * 60 * 1000,
  maxRequests: 5,
};
