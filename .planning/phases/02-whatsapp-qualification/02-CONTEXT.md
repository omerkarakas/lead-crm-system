# Phase 2: WhatsApp & Qualification - Context

## Purpose

Lead'leri WhatsApp üzerinden otomatik QA (qualification) soruları ile qualify edip skorlamak.

## User Intent

**Kullanıcının açıklaması:**
- Lead formundan sadece telefon ve temel bilgileri alacağız
- Form submit olduktan 1 dakika sonra WhatsApp'tan insani bir mesaj gidecek
- WhatsApp'ta 1-2 soru veya poll formatında QA yapacağız
- Cevaplara göre skor hesaplayıp high score'lara Cal.com randevu linki göndereceğiz
- Numaranın gerçek olduğunu WhatsApp ile teyit etmiş olacağız

**Trigger kaynakları:**
- Web sayfasındaki lead form
- (Future) Instagram reklam lead formu

## Existing Solution (n8n Workflows)

**Mevcut çalışan yapı:**
- Location: `workflows/legacy/`
- Files:
  - `workflow1-lead-registration.json` — Lead kayıt + ilk WhatsApp mesajı
  - `workflow2-lead-qa.json` — QA flow (incoming webhook, scoring, next question)
  - `workflow3-calcom-booking.json` — Cal.com webhook handling

**Google Sheets → PocketBase Migration:**
- LEADS → `leads` collection (+ current_question_id, total_score, quality)
- QUESTIONS → `qa_questions` collection
- ANSWERS → `qa_answers` collection
- MESSAGES → `whatsapp_messages` collection
- CONFIG → System config veya environment variables

## Technical Decisions

**QA Format:** Poll (tek mesajda 2 soru)
```
Merhaba {name}! 👋
Başvurunuz için teşekkürler. Size yardımcı olabilmemiz için:

1. Şirketiniz kaç kişi?
   a) 1-10    b) 11-50    c) 51+

2. Ne ile ilgileniyorsunuz?
   a) Danışmanlık    b) Yazılım    c) Pazarlama

Cevapları "1a, 2b" formatında yazınız.
```

**Flow:**
1. Lead form submit → PocketBase
2. Background job: 1 dk bekle
3. WhatsApp poll gönder
4. Cevabı bekle (timeout: 24 saat)
5. Parse cevap → skor hesapla
6. Score ≥ 80 → Cal.com linki
7. Score < 80 → "İnceliyoruz" mesajı

**Green API:** Mevcut credentials kullanılacak
- Instance ID: env'de
- Token: env'de
- Webhook: `/api/whatsapp/webhook`

## Success Criteria (from ROADMAP)

1. Admin QA sorularını oluşturup aktif/pasif yapabilmeli
2. Lead oluşturulduktan 1 dk sonra ilk WhatsApp mesajı gitmeli
3. Lead WhatsApp'tan cevap verince sistem skor hesaplayıp kaydetmeli
4. Lead detay sayfasında toplam skor, quality status, ve breakdown görünmeli
5. Lead detay sayfasında WhatsApp conversation history görünmeli

## Out of Scope

- ❌ Instagram lead form entegrasyonu (future)
- ❌ Multi-select cevaplar
- ❌ Conditional branching
- ❌ Media handling (resim, ses)
- ❌ Email sending (Phase 3)
- ❌ Randevu confirmation/reminder (Phase 4)

## Dependencies

- Phase 1 complete (Lead CRUD, auth, UI)
- Green API credentials (existing)
- Cal.com meeting URL (existing)
