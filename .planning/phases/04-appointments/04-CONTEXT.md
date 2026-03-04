# Phase 4: Appointments - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

## Phase Boundary

Sistem Cal.com ile rezervasyon entegrasyonu sağlar, booking webhooks dinler, randevu kayıtlarını yönetir (CRUD), WhatsApp ile otomatik onay ve hatırlatma gönderir. Kullanıcılar randevu listesini görüntüleyebilir, filtreleyebilir ve manuel randevu oluşturabilir.

---

## Implementation Decisions

### Webhook Handling

- **Lead eşleştirme mantığı:** Önce telefon numarası ile eşleştir, bulunamazsa email ile dene
- **Lead bulunamazsa:** Kaydı "failed" durumunda işaretle ve logla (200 OK dön, veriyi sakla)
- **Event types:** Tüm durum değişikliklerini dinle (onaylanan, iptal edilen, yeniden planlanan - aynı endpoint)
- **Duplicate booking:** Lead durumuna göre sınırla (lead zaten "booked" ise ikinci rezervasyon için kontrol)

### Appointment UI

- **View toggle:** Tablo ve kart düzeni arasında geçiş butonu (email templates pattern)
- **Default view:** Masaüstü tablo, mobilde kartlar
- **Filtreleme:** Gelişmiş filtreler (tarih aralığı, durum, lead adı/telefon, source, vs.)
- **Detay görünümü:** Modal popup içinde (lead detail page pattern)
- **Durum badge'leri:** Renk + Lucide icon kombinasyonu (scheduled=yeşil+clock, completed=mavi+check, cancelled=kırmızı+x, rescheduled=turuncu+refresh)

### Reminder Timing

- **Hatırlatma schedule:** Çoklu hatırlatma - randevudan 1 gün önce + 2 saat önce
- **Mesaj şablonları:** Her hatırlatma tipi için ayrı şablon (24 saat önce, 2 saat önce), admin panelinde düzenlenebilir
- **Gönderen numara:** Merkezi sistem numarası (Green API)
- **İptal koşulları:** Randevu durumu değişirse (cancelled/completed) planlanan hatırlatmaları iptal et

### Manual Appointment Creation

- **Form alanları:** Lead seçimi + Tarih + Saat + Cal.com linki + Konum + Not (detaylı form)
- **Lead durum güncellemesi:** Manuel randevu oluşturulunca lead durumunu otomatik "booked" yap
- **Erişim noktaları:** Hem /appointments sayfasında hem lead detail page'de yönetilebilir
- **WhatsApp entegrasyonu:** Manuel randevu için de otomatik WhatsApp onay mesajı gönder (Cal.com webhook ile aynı)

### Claude's Discretion

- PocketBase appointments collection schema ve field types
- Webhook signature verification (güvenlik)
- Hatırlatma job scheduling implementation (cron, background job queue, vs.)
- Reminder template değişkenleri ({{lead_name}}, {{appointment_time}}, {{location}}, vs.)
- Randevu status enum values ve geçiş mantığı
- Error handling UI (toast messages, alert banners)

---

## Specific Ideas

- "Cal.com webhook tüm event'leri gönderiyor, aynı endpoint'i dinlemek yeterli"
- "Lead'i telefon ile bulmaya çalış, Türkiye'de WhatsApp daha güvenilir"
- "Email templates'deki view toggle pattern'i burada da kullan"
- "Hatırlatma şablonları da admin panelinde yönetilsin, email templates gibi"
- "Manuel randevu da Cal.com webhook ile aynı davranışı göstermeli"

---

## Deferred Ideas

- Calendar view (aylık/haftalık görünüm) — Phase 6 veya daha sonra
- Randevu ile lead scoring arasındaki korelasyon analizi — Phase 5 Campaigns sonrası
- Multi-location destek — şu an tek konum
- Randevu notlarını AI ile özetleme — Phase 6

---

*Phase: 04-appointments*
*Context gathered: 2026-03-04*
