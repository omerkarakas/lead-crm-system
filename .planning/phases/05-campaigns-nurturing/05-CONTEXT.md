# Phase 5: Campaigns & Nurturing - Context

**Gathered:** 2026-03-08
**Status:** Ready for planning

## Phase Boundary

Multi-channel nurturing sequences — admins create campaigns with steps (email/WhatsApp + delays), leads auto-enroll based on qualification score or other triggers, system executes on schedule with performance tracking.

## Implementation Decisions

### Sequence Builder UI
- Görsel akış şeması VEYA tablo satırları — kullanıcı seçebilir (toggle between views)
- Modal edit ile adım detayları düzenleme (listedeki özet: kanal, gecikme, template adı)
- Genişletilebilir adım tipleri (WhatsApp, Email, Delay + ileride eklenebilecek diğer tipler için esnek yapı)
- İki delay türü: Step sonrası (relative) VE mutlak zamanlama (absolute scheduling) — admin seçsin

### Audience Segmentation
- Kriterler: Skor aralığı, Lead statüsü, Lead kaynağı, Etiketler — hepsi desteklensin
- Karmaşık mantık: VE/VEYA operatörleri ile kombinasyonlar (örn: (skor < 50) VEYA (statüsü = new))
- Segmentasyon önizleme: Kaydetmeden önce kaç lead'e ulaşacağını göster
- Dinamik segmentasyon: Lead verileri değiştiğinde segmentasyon otomatik güncellenir, lead yeniden değerlendirilir

### Enrollment Automation
- Tetikleyiciler: QA tamamlandığında, statü değişimi, ETİKET DEĞİŞİMİ, manuel ekleme, zamanlanmış
- Campaign bazlı auto-enroll: Admin campaign için minimum skor belirler (örn: 50), o altındakiler otomatik kaydedilir
- Bir campaign, bir kez: Aynı lead aynı campaign'e tekrar kaydedilemez
- Çıkış yöntemleri:
  1. Email sonundaki "abonelikten ayrıl" linki → lead'in kayıtlı olduğu kampanyalar listelenir, seçerek ayrılır
  2. Admin manuel olarak lead'i sequence'ten çıkarabilir
- Etiket değişimi trigger: Lead'e etiket eklendiğinde/çıkarıldığında segmentasyon yeniden değerlendirilir

### Performance Reporting
- Metrikler: Kayıt/tamamlama oranı, Email engagement (açılma, tıklama), WhatsApp delivery (teslimat, okunma), Conversion (statü değişimi)
- Görselleştirme: Grafikler (bar, line, pie)
- Zaman aralığı: Son 7 gün, 30 gün, 90 gün, tüm zaman — seçilebilir
- Lead-level performans: İki görünüm — adım bazında lead listesi VEYA timeline görünümü, kullanıcı seçebilir

### Claude's Discretion
- Grafik türleri için hangi kütüphane (recharts, chart.js, vb.)
- Detaylı timeline görünümü tasarımı
- Segmentasyon önizleme UI detayları
- Unsubscribe page tasarımı ve UX

## Specific Ideas

- "Sequence builder'da görsel akış şeması ve tablo arasında geçiş yapabilmeyi istiyorum"
- "Unsubscribe linkine tıklayınca lead'in hangi kampanyalara kayıtlı olduğunu görsün, seçerek ayrılabilsin"
- "Etiket değişimi trigger olarak çalışmalı — etiket ekleyip çıkınca segmentasyon yeniden değerlendirilsin"
- "Dinamik segmentasyon — lead'in verileri değişirse hemen yeniden değerlendirilsin"

## Deferred Ideas

- SMS kanalı için sequence adımı — ileride eklenebilir, genişletilebilir yapı hazırlanmalı
- A/B testing for campaigns — ayrı bir phase
- Lead scoring modeli özelleştirme — ayrı bir phase
- Campaign template'leri (yeniden kullanılabilir sequence'ler) — ileride eklenebilir

---

*Phase: 05-campaigns-nurturing*
*Context gathered: 2026-03-08*
