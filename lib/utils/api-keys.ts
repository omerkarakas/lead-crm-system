/**
 * API Key Validation Utilities
 *
 * Provides API key validation for secure endpoint access.
 * Keys are configured via environment variable (comma-separated).
 */

/**
 * Validates API key from request headers
 * Supports both X-API-Key and Authorization: Bearer <key> headers
 *
 * @param request - Next.js Request object
 * @returns true if API key is valid, false otherwise
 */
export function validateApiKey(request: Request): boolean {
  const apiKeyFromHeader = request.headers.get('X-API-Key');
  const apiKeyFromAuth = request.headers.get('Authorization')?.replace('Bearer ', '');

  const apiKey = apiKeyFromHeader || apiKeyFromAuth;

  if (!apiKey) {
    return false;
  }

  const validKeys = getValidApiKeys();

  return validKeys.includes(apiKey);
}

/**
 * Gets list of valid API keys from environment
 * Keys are comma-separated in API_KEYS env var
 *
 * @returns Array of valid API keys
 */
export function getValidApiKeys(): string[] {
  const keys = process.env.API_KEYS;
  if (!keys) {
    return [];
  }

  return keys.split(',').map(key => key.trim()).filter(Boolean);
}

/**
 * Checks if API key authentication is enabled
 *
 * @returns true if API_KEYS env var is set with at least one key
 */
export function isApiKeyAuthEnabled(): boolean {
  return getValidApiKeys().length > 0;
}
