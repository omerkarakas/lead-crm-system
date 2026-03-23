/**
 * Rate Limiting Utilities
 *
 * Provides in-memory IP-based rate limiting for API endpoints.
 * Uses sliding window algorithm with configurable limits.
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory storage for rate limit records
// Note: This resets on server restart. For production, consider using Redis
const rateLimitMap = new Map<string, RateLimitRecord>();

// Cleanup old records every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  Array.from(rateLimitMap.entries()).forEach(([ip, record]) => {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  });
}, 5 * 60 * 1000);

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed */
  limit: number;
  /** Time window in milliseconds (default: 60000 = 1 minute) */
  windowMs: number;
}

/**
 * Default rate limit: 100 requests per minute
 */
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  limit: 100,
  windowMs: 60000, // 1 minute
};

/**
 * Stricter rate limit: 10 requests per minute (for sensitive endpoints)
 */
export const STRICT_RATE_LIMIT: RateLimitConfig = {
  limit: 10,
  windowMs: 60000,
};

/**
 * Checks if a request should be rate limited based on IP address
 *
 * @param ip - IP address of the client
 * @param config - Rate limit configuration
 * @returns true if request is allowed, false if rate limit exceeded
 */
export function checkRateLimit(
  ip: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // No previous record or window expired - create new record
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return true;
  }

  // Check if limit exceeded
  if (record.count >= config.limit) {
    return false;
  }

  // Increment counter
  record.count++;
  return true;
}

/**
 * Gets rate limit information for an IP address
 *
 * @param ip - IP address of the client
 * @returns Rate limit info with remaining requests and reset time
 */
export function getRateLimitInfo(ip: string): {
  remaining: number;
  resetTime: number | null;
} {
  const record = rateLimitMap.get(ip);
  const now = Date.now();

  if (!record || now > record.resetTime) {
    return {
      remaining: DEFAULT_RATE_LIMIT.limit,
      resetTime: null,
    };
  }

  return {
    remaining: Math.max(0, DEFAULT_RATE_LIMIT.limit - record.count),
    resetTime: record.resetTime,
  };
}

/**
 * Resets rate limit for an IP address (for testing/admin purposes)
 *
 * @param ip - IP address to reset
 */
export function resetRateLimit(ip: string): void {
  rateLimitMap.delete(ip);
}

/**
 * Middleware helper to extract IP from NextRequest
 *
 * @param request - Next.js Request object
 * @returns IP address or 'anonymous' if not detectable
 */
export function extractIp(request: Request): string {
  // Check various headers for IP (proxies, load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, first one is client IP
    return forwardedFor.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // For Next.js edge requests, try to get from request
  // @ts-ignore - Next.js internal property
  if (request.ip) {
    // @ts-ignore
    return request.ip;
  }

  // Fallback for local development
  return '127.0.0.1';
}
