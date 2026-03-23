/**
 * OpenAPI 3.1 Schema for Moka CRM API
 *
 * Complete API documentation for Moka CRM with all endpoints,
 * schemas, and security schemes.
 */

import type { OpenAPIDocument } from './routes';
import { paths, tags, securitySchemes } from './routes';
import { getAllSchemaDefinitions } from './types-to-schema';

/** Complete OpenAPI Document */
export const openApiDocument: OpenAPIDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Moka CRM API',
    version: '1.0.0',
    description: `**Moka CRM** — Lead-to-Customer dönüşümünü otomatize eden platform.

Bu API, Moka CRM'in tüm fonksiyonlarına programatik erişim sağlar:

- **Lead Yönetimi**: Lead oluşturma, listeleme, güncelleme, silme
- **Qualification**: WhatsApp üzerinden otomatik QA soruları ve puanlama
- **Randevular**: Cal.com entegrasyonu ile randevu yönetimi
- **Kampanyalar**: Nurturing sequences ve enrollment yönetimi
- **Webhook'lar**: Dış sistemler için webhook endpoint'leri

### Authentication

Tüm endpoint'ler authentication gerektirir. İki yöntem desteklenir:

1. **Bearer Token**: \`Authorization: Bearer <token>\` header
2. **API Key**: \`X-API-Key: <key>\` header (webhook'lar için)

### Rate Limiting

API endpoint'leri rate limiting'e tabidir:
- Standart endpoint'ler: 100 istek/dakika
- Lead creation: 20 istek/dakika (daha sıkı)

429 durum kodu ile rate limit aşıldığında bilgi verilir.
`,
    contact: {
      name: 'Mokadijital',
      url: 'https://mokadijital.com',
    },
    license: {
      name: 'Proprietary',
    },
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
      description: 'Development server',
    },
  ],
  tags,
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths,
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token from PocketBase authentication. Use `Authorization: Bearer <token>` header.',
      },
      api_key: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for webhook and external integrations.',
      },
    },
    schemas: getAllSchemaDefinitions(),
  },
};
