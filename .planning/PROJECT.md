# Moka CRM - Lead & Marketing Automation Platform

## What This Is

Mokadijital.com için geliştirilen, kobilerin lead toplama, qualifikasyon ve nurturing süreçlerini otomatize eden bir CRM platformu. Platform hem kendi kullanımımız için, hem de müşterilerimize white-label olarak satacağımız bir SaaS ürünü olacak.

Sistem, web siteleri/reklamlardan gelen lead'leri yakalıyor, WhatsApp üzerinden otomatik QA (qualifikasyon) soruları soruyor, yüksek skorlu lead'lere randevu linki gönderiyor, düşük skorlu lead'leri ise email ve WhatsApp nurturing kampanyalarıyla takip ediyor.

## Core Value

**Lead-to-Customer dönüşümünü otomatize eden tek platform.**

Lead toplamadan satışa giden tüm süreci (yakala → qualifie et → randevu al → satış yap) tek bir sistemde yönetilebilir kılıyoruz. Müşterilerimiz Google Sheets + n8n + ayrı email araçları yerine tek bir platform kullanacak.

## Current Milestone: v1.0.1 WhatsApp QA Soru Tipleri

**Goal:** Mevcut WhatsApp QA sistemine yeni soru tipleri ekleyerek lead qualification esnekliğini artırmak.

**Target features:**
- Çoktan seçmeli (multiple choice) soru tipi
- Anket/skalası soru tipi (1-5 Likert)
- Açık uçlu (open-ended) soru tipi
- WhatsApp inline buton desteği
- Her soru tipi için puanlama kuralları

## Requirements

### Validated (v1.0 MVP — Shipped 2026-03-15)

- ✓ Lead Yönetimi: Web form, API ve manuel girişle lead toplama
- ✓ Lead Qualification: WhatsApp üzerinden otomatik QA soruları ve puanlama sistemi
- ✓ Randevu Yönetimi: Cal.com entegrasyonu ile randevu takibi ve hatırlatmalar
- ✓ WhatsApp Pazarlama: Green API ile mesaj gönderimi ve nurturing kampanyaları
- ✓ Email Pazarlama: Resend ile email kampanyaları ve otomatik nurturing
- ✓ Lead Nurturing: Müşteriye dönüşmeyen lead'ler için otomatik takip serileri
- ✓ Kullanıcı Yönetimi: Admin, Sales ve Marketing rolleri ile yetkilendirme
- ✓ Aktivite Timeline: Notlar, WhatsApp, email, QA, randevu, proposal geçmişi
- ✓ Proposal Yönetimi: Teklif şablonları, gönderim, yanıt takibi
- ✓ Kampanya & Nurturing: Sequence builder, enrollment, analytics

### Active (v1.0.1)

- [ ] Çoktan seçmeli soru tipi: Birden fazla seçenek seçilebilir
- [ ] Anket/skalası soru tipi: 1-5 Likert skalaması (10-50 puan)
- [ ] Açık uçlu soru tipi: Admin tanımlı, serbest metin girişi
- [ ] WhatsApp inline butonlar: Native butonlar ile daha iyi UX
- [ ] Her soru tipi için puanlama: Otomatik puan hesaplama kuralları

### Out of Scope

- [Faturalama/Billing] — v1'de manuel abone yönetimi, faturalama sistemi v2'de
- [Mobil uygulama] — v1 sadece web, mobile app ileride
- [Sesli arama entegrasyonu] — VoIP v2'de, v1'de sadece WhatsApp/Email
- [Gelişmiş analytics] — Temel dashboard v1, gelişmiş analitik v2'de
- [Social media entegrasyonu] — Direkt sosyal medya dinleme v2'de

## Context

**Mevcut Sistem:**
- n8n workflows (4 adet) Google Sheets ile çalışıyor
- Green API (WhatsApp), Cal.com (randevu) entegrasyonları mevcut
- Her müşteri için ayrı Google Sheets kopyası + workflow kopyaları oluşturuluyor
- Deployment manuel: Sheet kopyala, ID'leri replace et, Cal.com user oluştur, Green API instance al

**Problem:**
- Google Sheets ölçeklenemiyor (performans, güvenlik, backup)
- Her yeni müşteri için manuel setup çok zaman alıyor
- Raporlama zor (sheet'lerden query çekmek zor)
- Müşteri self-service yapamıyor (her değişiklik için bize gelmek zorunda)

**Çözüm:**
- PocketBase her müşteri için ayrı database (multi-instance, not multi-tenant)
- n8n workflows PocketBase API ile konuşacak
- Tek bir admin panelinden tüm müşteri instance'larını yönetebileceğiz
- Müşteriler kendi subdomain'lerinde erişecek (crm.musteri.com)
- White-label: Müşteri logosu, renkleri, email template'leri özelleştirilebilir

**Hedef Kitle:**
- Birincil: Kobilerin dijital pazarlama ajansları
- İkincil: Doğrudan kobiler (lead toplama ihtiyacı olan)

**Kullanıcı Rolleri:**
- **Admin**: Tüm yetkiler, sistem ayarları, kullanıcı yönetimi
- **Sales**: Lead görüntüleme, not ekleme, randevu yönetimi, durum güncelleme
- **Marketing**: Kampanya oluşturma, nurturing serileri, raporları görüntüleme

## Constraints

- **Tech Stack**: PocketBase (backend), n8n (automation), Resend (email), Green API (WhatsApp), Cal.com (randevu) — Bu servisler zaten kullanımda ve değiştirilmeyecek
- **Multi-Tenant Model**: Her müşteri için ayrı PocketBase instance — veri izolasyonu ve deployment kolaylığı için
- **Self-Hosted**: Müşteriler kendi sunucularına kurabilecek (Docker compose ile kolay deploy)
- **White-Label**: Müşteriler branding'i özelleştirebilmeli (logo, colors, email templates)
- **Deployment**: Mokadijital olarak müşteri instance'larını merkezi yönetebilmeliyiz
- **Language**: Türkçe birincil dil, ama İngilizce desteklenebilir (i18n)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PocketBase vs PostgreSQL+SaaS framework | PocketBase tek binary, embedded, Go — müşteri deployment'ı için ideal | — Pending |
| Multi-instance vs Single-tenant DB | Her müşteri ayrı instance = veri izolasyonu, kolay backup, migration | — Pending |
| Resend for email | Modern API, TypeScript SDK, template management, iyi fiyat | — Pending |
| Admin panel type | Tek merkezden tüm müşteri instance'larını yönetmek için ayrı admin panel | — Pending |
| Frontend framework | Next.js 14 + TypeScript — App Router, Server Components, RSC support | Planned |
| Session management | NextAuth.js or custom middleware with PocketBase JWT | Planned |
| Authentication flow | Email/password + OAuth (Google/GitHub) via NextAuth or custom | Planned |
| State management | React Context + Server Components | Planned |
| Styling | Tailwind CSS + shadcn/ui components | Planned |

---
*Last updated: 2026-03-29 — Starting milestone v1.1 CRM Core Features*
