/**
 * API Rate Limiting Wrapper
 *
 * Provides a wrapper function for adding rate limiting to API routes.
 * Supports endpoint-specific rate limit configurations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, extractIp, DEFAULT_RATE_LIMIT, STRICT_RATE_LIMIT, type RateLimitConfig } from './rate-limit';

/**
 * Rate limit configuration presets for common use cases
 */
export const RateLimitPresets = {
  /** Default: 100 requests per minute */
  DEFAULT: DEFAULT_RATE_LIMIT,
  /** Strict: 10 requests per minute (for sensitive operations) */
  STRICT: STRICT_RATE_LIMIT,
  /** Lenient: 300 requests per minute (for read-heavy endpoints) */
  LENIENT: { limit: 300, windowMs: 60000 } as RateLimitConfig,
  /** Webhook: No rate limiting (signature verification used instead) */
  NONE: null,
} as const;

/**
 * Type for rate limit handler function
 */
type RateLimitedHandler = (request: NextRequest) => Promise<NextResponse> | NextResponse;

/**
 * Wraps an API route handler with rate limiting
 *
 * @param handler - The API route handler function
 * @param config - Rate limit configuration (uses DEFAULT if not provided)
 * @returns A new handler function with rate limiting applied
 *
 * @example
 * ```ts
 * import { withRateLimit, RateLimitPresets } from '@/lib/utils/api-rate-limit';
 *
 * export const POST = withRateLimit(async (request) => {
 *   // Your API logic here
 *   return NextResponse.json({ success: true });
 * }, RateLimitPresets.STRICT);
 * ```
 */
export function withRateLimit<T extends RateLimitedHandler>(
  handler: T,
  config?: RateLimitConfig | null
): T {
  return (async (request: NextRequest) => {
    // Skip rate limiting if config is explicitly null (e.g., webhooks)
    if (config === null) {
      return handler(request);
    }

    // Apply rate limiting
    const ip = extractIp(request);
    const rateLimitConfig = config || DEFAULT_RATE_LIMIT;

    if (!checkRateLimit(ip, rateLimitConfig)) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded: ${rateLimitConfig.limit} requests per ${rateLimitConfig.windowMs / 1000} seconds`,
          retryAfter: Math.ceil(rateLimitConfig.windowMs / 1000),
        },
        { status: 429 }
      );
    }

    // Call the original handler
    return handler(request);
  }) as T;
}

/**
 * Wraps an API route handler with rate limiting and authentication check
 *
 * @param handler - The API route handler function
 * @param config - Rate limit configuration (uses DEFAULT if not provided)
 * @returns A new handler function with rate limiting and auth check applied
 *
 * @example
 * ```ts
 * import { withRateLimitAndAuth } from '@/lib/utils/api-rate-limit';
 * import { getServerPb } from '@/lib/pocketbase/server';
 *
 * export const GET = withRateLimitAndAuth(async (request, pb) => {
 *   const user = pb.authStore.model;
 *   return NextResponse.json({ user });
 * });
 * ```
 */
export function withRateLimitAndAuth<T extends (
  request: NextRequest,
  pb: any
) => Promise<NextResponse> | NextResponse>(
  handler: T,
  config?: RateLimitConfig | null
): T {
  return (async (request: NextRequest) => {
    // Skip rate limiting if config is explicitly null
    if (config !== null) {
      const ip = extractIp(request);
      const rateLimitConfig = config || DEFAULT_RATE_LIMIT;

      if (!checkRateLimit(ip, rateLimitConfig)) {
        return NextResponse.json(
          {
            error: 'Too many requests',
            message: `Rate limit exceeded: ${rateLimitConfig.limit} requests per ${rateLimitConfig.windowMs / 1000} seconds`,
            retryAfter: Math.ceil(rateLimitConfig.windowMs / 1000),
          },
          { status: 429 }
        );
      }
    }

    // Check authentication
    const { getServerPb } = await import('@/lib/pocketbase/server');
    const pb = await getServerPb();

    try {
      await pb.collection('users').authRefresh();
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Call the original handler with pb instance
    return handler(request, pb);
  }) as unknown as T;
}

/**
 * Extracts rate limit info from the request headers
 * Useful for returning rate limit info to clients
 *
 * @param request - Next.js Request object
 * @returns Rate limit information
 */
export function getRateLimitHeaders(request: NextRequest): {
  limit: number;
  remaining: number;
  reset: number | null;
} {
  const ip = extractIp(request);
  const { getRateLimitInfo } = require('./rate-limit');
  const info = getRateLimitInfo(ip);

  return {
    limit: DEFAULT_RATE_LIMIT.limit,
    remaining: info.remaining,
    reset: info.resetTime,
  };
}

/**
 * Adds rate limit headers to the response
 *
 * @param response - NextResponse object
 * @param request - Next.js Request object
 * @returns Response with rate limit headers added
 */
export function withRateLimitHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const info = getRateLimitHeaders(request);

  response.headers.set('X-RateLimit-Limit', info.limit.toString());
  response.headers.set('X-RateLimit-Remaining', info.remaining.toString());

  if (info.reset) {
    response.headers.set('X-RateLimit-Reset', info.reset.toString());
  }

  return response;
}
