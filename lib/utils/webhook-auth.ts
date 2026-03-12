import { NextRequest } from 'next/server';
import { WebhookAuthMethod, WebhookAuthConfig } from '@/types/webhook';
import crypto from 'crypto';

/**
 * Verify webhook signature using HMAC
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Extract API key from request headers
 */
export function extractApiKey(
  request: NextRequest,
  headerName = 'x-api-key'
): string | null {
  return request.headers.get(headerName);
}

/**
 * Extract bearer token from request headers
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Validate webhook request using configured auth method
 */
export function validateWebhookRequest(
  request: NextRequest,
  config: WebhookAuthConfig,
  body: string
): { valid: boolean; error?: string } {
  try {
    switch (config.method) {
      case WebhookAuthMethod.API_KEY:
        const apiKey = extractApiKey(request, config.headerName);
        if (!apiKey) {
          return { valid: false, error: 'API anahtarı eksik' };
        }
        if (apiKey !== config.apiKey) {
          return { valid: false, error: 'Geçersiz API anahtarı' };
        }
        return { valid: true };

      case WebhookAuthMethod.BEARER_TOKEN:
        const token = extractBearerToken(request);
        if (!token) {
          return { valid: false, error: 'Bearer token eksik' };
        }
        if (token !== config.apiKey) {
          return { valid: false, error: 'Geçersiz bearer token' };
        }
        return { valid: true };

      case WebhookAuthMethod.HMAC_SIGNATURE:
        const signature = request.headers.get(config.headerName || 'x-signature');
        if (!signature) {
          return { valid: false, error: 'İmza eksik' };
        }
        if (!verifyWebhookSignature(body, signature, config.secret!)) {
          return { valid: false, error: 'Geçersiz imza' };
        }
        return { valid: true };

      default:
        return { valid: false, error: 'Bilinmeyen yetkilendirme yöntemi' };
    }
  } catch (error) {
    console.error('Webhook kimlik doğrulama hatası:', error);
    return { valid: false, error: 'Kimlik doğrulama başarısız' };
  }
}

/**
 * Get webhook auth config from environment variables
 */
export function getWebhookAuthConfig(): WebhookAuthConfig {
  const method = process.env.WEBHOOK_AUTH_METHOD || WebhookAuthMethod.API_KEY;

  return {
    method: method as WebhookAuthMethod,
    apiKey: process.env.WEBHOOK_API_KEY,
    secret: process.env.WEBHOOK_SECRET,
    headerName: process.env.WEBHOOK_HEADER_NAME || 'x-api-key'
  };
}
