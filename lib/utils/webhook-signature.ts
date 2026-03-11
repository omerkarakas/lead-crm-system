/**
 * Webhook Signature Verification Utilities
 *
 * Provides signature verification for webhook endpoints.
 * Supports both HMAC SHA-256 (Meta Ads) and simple API key validation.
 */

import crypto from 'crypto';

/**
 * Verifies Meta Ads webhook signature using HMAC SHA-256
 *
 * Meta Ads sends a X-Hub-Signature-256 header with the format:
 * sha256=<signature> where signature is the HMAC of the payload
 *
 * @param payload - Raw request body as string
 * @param signature - Value from X-Hub-Signature-256 header
 * @param secret - App secret from Meta App settings
 * @returns true if signature is valid, false otherwise
 */
export function verifyMetaAdsSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  try {
    // Calculate expected signature
    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');

    // Use timingSafeEqual to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expectedSignature, 'utf8')
    );
  } catch (error) {
    console.error('[verifyMetaAdsSignature] Error:', error);
    return false;
  }
}

/**
 * Verifies webhook request using simple API key
 *
 * @param request - Next.js Request object
 * @param validKey - Expected API key (defaults to WEBHOOK_API_KEY env var)
 * @returns true if API key matches, false otherwise
 */
export function verifyWebhookApiKey(
  request: Request,
  validKey?: string
): boolean {
  const apiKey = request.headers.get('X-Webhook-Key');
  const expectedKey = validKey || process.env.WEBHOOK_API_KEY;

  if (!apiKey || !expectedKey) {
    return false;
  }

  return apiKey === expectedKey;
}

/**
 * Gets Meta Ads webhook secret from environment
 *
 * @returns Meta webhook secret or empty string if not configured
 */
export function getMetaWebhookSecret(): string {
  return process.env.META_WEBHOOK_SECRET || '';
}

/**
 * Checks if webhook signature verification is enabled
 *
 * @returns true if META_WEBHOOK_SECRET or WEBHOOK_API_KEY is set
 */
export function isWebhookVerificationEnabled(): boolean {
  return !!(
    process.env.META_WEBHOOK_SECRET ||
    process.env.WEBHOOK_API_KEY
  );
}

/**
 * Generic HMAC signature verification for other webhooks
 *
 * @param payload - Raw request body as string
 * @param signature - Signature from header
 * @param secret - Secret key for HMAC
 * @param algorithm - Hash algorithm (default: sha256)
 * @returns true if signature is valid, false otherwise
 */
export function verifyHmacSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: 'sha256' | 'sha512' | 'sha1' = 'sha256'
): boolean {
  if (!signature || !secret) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac(algorithm, secret)
      .update(payload, 'utf8')
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expectedSignature, 'utf8')
    );
  } catch (error) {
    console.error('[verifyHmacSignature] Error:', error);
    return false;
  }
}

/**
 * Helper to verify webhook with multiple signature formats
 * Supports: HMAC SHA-256, API key, or Bearer token
 *
 * @param request - Next.js Request object
 * @param payload - Raw request body as string
 * @returns true if any verification method succeeds
 */
export function verifyWebhook(request: Request, payload: string): {
  valid: boolean;
  method?: 'hmac' | 'api-key' | 'bearer';
} {
  // Try HMAC signature (Meta Ads)
  const signature = request.headers.get('X-Hub-Signature-256');
  const metaSecret = getMetaWebhookSecret();

  if (signature && metaSecret) {
    if (verifyMetaAdsSignature(payload, signature, metaSecret)) {
      return { valid: true, method: 'hmac' };
    }
  }

  // Try API key
  const apiKey = request.headers.get('X-Webhook-Key');
  if (apiKey && process.env.WEBHOOK_API_KEY) {
    if (verifyWebhookApiKey(request)) {
      return { valid: true, method: 'api-key' };
    }
  }

  // Try Bearer token
  const bearerToken = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (bearerToken && process.env.WEBHOOK_API_KEY === bearerToken) {
    return { valid: true, method: 'bearer' };
  }

  return { valid: false };
}
