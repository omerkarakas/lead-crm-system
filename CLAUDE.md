# CLAUDE.md

Bu dosya, bu depodaki kod üzerinde çalışırken Claude Code (claude.ai/code) için rehberlik sağlar.

## Komutlar

### Geliştirme
```bash
npm run dev          # Geliştirme sunucusunu başlat (http://localhost:3000)
npm run build        # Production build oluştur
npm run start        # Production sunucusunu başlat
npm run lint         # ESLint çalıştır
```

### PocketBase Kurulumu
```bash
# PocketBase'i yerel olarak çalıştır
./pocketbase serve   # http://127.0.0.1:8090

# Docker ile çalıştır (production)
docker-compose up -d
```

## Teknik Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui, Radix UI
- **State Management**: Zustand
- **Backend**: PocketBase (self-hosted BaaS)
- **Integrations**: Green API (WhatsApp), Resend (Email), Cal.com (Randevu)

## Proje Yapısı

```
app/                      # Next.js App Router
  (dashboard)/           # Korumalı dashboard sayfaları
  api/                   # API route'ları
    webhooks/            # Webhook endpoint'leri (leads, meta-ads, calcom, whatsapp)
    cron/                # Cron job endpoint'leri
  lead-form/             # Herkese açık lead formu
  login/                 # Giriş sayfası

lib/                     # Core utilities
  pocketbase.ts          # Client-side PocketBase instance
  pocketbase/server.ts   # Server-side PocketBase instance
  api/                   # API client fonksiyonları
  stores/                # Zustand stores (auth, leads, campaigns, etc.)
  utils/                 # Utility fonksiyonları (permissions, webhook-auth, etc.)
  email/                 # Email template utilities
  whatsapp/              # WhatsApp mesaj formatlama

components/              # React components
  ui/                    # shadcn/ui base components
  auth/                  # Authentication components
  leads/                 # Lead yönetimi components
  campaigns/             # Kampanya/sequence components
  admin/                 # Admin panel components
  appointments/          # Randevu yönetimi components

types/                   # TypeScript type definitions
```

## Temel Mimari

### PocketBase Client Pattern

Proje, farklı feature'lar için ayrı PocketBase instance'ları kullanır. Bu, otomatik iptal (auto-cancellation) sorunlarını önlemek için tasarlanmıştır:

```typescript
// lib/api/leads.ts - Leads için ayrı instance
const pb = new PocketBase(PB_URL);
// Cookie'den auth yükle
if (typeof window !== 'undefined') {
  const pbCookie = cookies.find(c => c.trim().startsWith('pb_auth='));
  if (pbCookie) pb.authStore.loadFromCookie(pbCookie.trim());
}
```

### Authentication

- **Client-side**: `pb_auth` cookie'den token yüklenir (`lib/pocketbase.ts`)
- **Server-side**: `getServerPb()` fonksiyonu kullanılır (`lib/pocketbase/server.ts`)
- **State Management**: Zustand store (`lib/stores/auth.ts`)
- **Sessions**: `sessions` collection'da token ve user agent ile tracking

### Role-Based Permissions

`lib/utils/permissions.ts` üç rolü destekler:
- **admin**: Tüm yetkiler
- **sales**: Lead oluşturma/düzenleme, email/proposal gönderme
- **marketing**: Lead oluşturma, campaign yönetimi

Permission check örnekleri:
```typescript
import { hasPermission, PERMISSIONS, Role } from '@/lib/utils/permissions';

if (hasPermission(user.role, PERMISSIONS.CAN_DELETE_LEADS)) {
  // Delete operation
}
```

### Campaign & Sequence Execution

Lead nurturing sistemi `lib/api/sequence-executor.ts`'te uygulanır:

1. **Campaign**: Hedef kitle segment tanımları
2. **Sequence**: Adım adım mesaj akışları (email/WhatsApp/delay)
3. **Enrollment**: Lead'in sequence'e kaydı
4. **Execution**: `startSequence()` → `processNextStep()` → mesaj gönderimi

Delay types:
- **Relative**: Şu andan X dakika/saat/gün sonra
- **Absolute**: Belirli bir tarihte/saatte

### Webhook Auth

Webhook endpoint'leri `lib/utils/webhook-auth.ts` ile korunur:

- **API Key**: `X-API-Key` header
- **HMAC Signature**: `X-Signature` header (SHA256)
- **Bearer Token**: `Authorization: Bearer <token>`

## Önemli Dosyalar

### Core Infrastructure
- `lib/pocketbase.ts` - Client PocketBase singleton
- `lib/pocketbase/server.ts` - Server PocketBase factory (cache-busting ile)
- `lib/stores/auth.ts` - Authentication state management
- `lib/utils/permissions.ts` - Role-based access control

### Lead Management
- `lib/api/leads.ts` - Lead CRUD operations
- `lib/api/qa.ts` - Qualification answers API
- `lib/utils/lead-scoring.ts` - Score → quality status mapping
- `lib/whatsapp/message-formatter.ts` - WhatsApp poll mesaj formatlama

### Campaign System
- `lib/api/campaigns.ts` - Campaign/sequence CRUD
- `lib/api/sequence-executor.ts` - Sequence execution engine
- `lib/api/enrollments.ts` - Lead enrollment management

### Webhooks
- `app/api/webhooks/leads/route.ts` - Lead creation webhook
- `app/api/webhooks/qa-complete/route.ts` - QA completion webhook
- `app/api/webhooks/calcom/route.ts` - Cal.com booking webhook

## Geliştirme Notları

### Environment Variables
```bash
NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
POCKETBASE_INTERNAL_URL=http://pocketbase:8090  # Docker için
GREEN_API_URL=...
GREEN_API_ID=...
GREEN_API_TOKEN=...
RESEND_API_KEY=...
```

### Cache Issues
PocketBase SDK'nın built-in cache'i production'da stale data sorunlarına neden olabilir. `getServerPb()` cache-busting header'ları ekler:
```typescript
pb.beforeSend = function (url, options) {
  options.headers = options.headers || {};
  options.headers['Cache-Control'] = 'no-cache';
  options.headers['Pragma'] = 'no-cache';
  return { url, options };
};
```

### Cascade Delete
PocketBase cascade delete desteklemez. `lib/api/leads.ts`'teki `deleteLead()` fonksiyonu manuel olarak ilişkili kayıtları siler:
- email_messages
- whatsapp_messages
- qa_answers
- appointments
- notes

### Auto-Updated Status
Lead statüsü QA sonucuna göre otomatik güncellendiğinde `auto_updated_status=true` bayrağı atanır. Admin olmayan kullanıcılar bu statüyü değiştiremez.
