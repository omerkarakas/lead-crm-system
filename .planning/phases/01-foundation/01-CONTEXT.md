# Phase 1: Foundation - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

## Phase Boundary

Kullanıcılar güvenle giriş yapabilir ve temel lead bilgilerini yönetebilir. Authentication sistemi, kullanıcı rolleri (Admin, Sales, Marketing), lead CRUD işlemleri, ve lead arama/filtreleme bu phase'de yer alır.

## Implementation Decisions

### Tech Stack
- **Frontend:** Next.js 14 + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** Zustand for client state
- **Backend:** PocketBase (self-contained Go backend)
- **Authentication:** NextAuth.js or custom middleware with PocketBase JWT

### Authentication - Oturum Yönetimi
- **Kalıcı oturum (Remember me):** Kullanıcı tarayıcıyı kapatsa bile giriş kalıcı, yenileme gerekmez
- **Çoklu cihaz politikası:** Birden fazla cihazda eşzamanlı giriş izinli, cihaz listesi yönetilebilir
- **Şifre kurtarma:** Email'e şifre sıfırlama linki gönderilir, link ile yeni şifre belirlenir
- **Kimlik doğrulama yöntemi:** Email/şifre + OAuth (Google/Github) giriş desteği

### Next.js Specific Considerations
- **App Router:** Server Components for data fetching, Client Components for interactivity
- **Route Protection:** Middleware for protected routes
- **Form Handling:** react-hook-form + zod for validation
- **API Routes:** Next.js API routes as proxy to PocketBase (or direct PB SDK calls)

### Claude's Discretion
- Token refresh mechanism detayları
- OAuth provider'ların tutulacağı storage (PB built-in vs custom)
- Session storage approach (localStorage vs cookie vs NextAuth session)
- Password reset token expiration time
- Cihaz yönetim UI detayları (hangi bilgiler gösterilecek)
- shadcn/ui component selection

## Specific Ideas

- OAuth ile gelen kullanıcılar için otomatik rol ataması (default: Sales? admin onayı mı?)
- "Remember me" seçeneği varsayılan olarak işaretli mi olmalı?
- Server Components vs Client Components boundary'leri nerede olmalı?

## Deferred Ideas

Two-factor authentication (2FA) — v2'de eklenebilir
Social media provider'lar (Facebook, LinkedIn) — ileride eklenebilir
SSO (Single Sign-On) — enterprise için v2

---

*Phase: 01-foundation*
*Context updated: 2026-03-02 — Switched to Next.js*
