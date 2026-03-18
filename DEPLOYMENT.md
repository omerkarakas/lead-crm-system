# Moka CRM - Deployment Guide

Bu doküman, Moka CRM'in VPS sunucusuna deploy edilmesi için gereken adımları içerir.

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Gereksinimler](#gereksinimler)
3. [Teknik Mimari](#teknik-mimari)
4. [Kurulum](#kurulum)
5. [İlk Deploy](#ilk-deploy)
6. [Yeni Instance Ekleme](#yeni-instance-ekleme)
7. [Yönetim Komutları](#yönetim-komutları)
8. [Yedekleme](#yedekleme)
9. [Sorun Giderme](#sorun-giderme)

---

## Genel Bakış

Moka CRM, Docker kullanarak aynı sunucuda birden fazla instance çalıştırabilir. Her instance:
- Ayrı bir PocketBase veritabanına sahiptir
- Ayrı bir domain/subdomain üzerinden erişilir
- Tamamen izole çalışır

---

## Gereksinimler

### Sunucu Gereksinimleri
- **OS**: Linux (Ubuntu 20.04+ önerilir) veya Windows Server
- **RAM**: Minimum 2GB (instance başına +512MB önerilir)
- **Disk**: Minimum 20GB (instance başına +5GB önerilir)
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### Yazılım Gereksinimleri
- Docker ve Docker Compose kurulu olmalı
- Traefik reverse proxy kurulu olmalı
- SSL sertifikası için Let's Encrypt (Traefik ile otomatik)

---

## Teknik Mimari

```
┌─────────────────────────────────────────────────────────────┐
│                        VPS Sunucu                           │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    Traefik                          │   │
│  │              (Reverse Proxy + SSL)                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                   │
│          ┌───────────────┼───────────────┐                  │
│          ▼               ▼               ▼                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │  Instance 1  │ │  Instance 2  │ │  Instance N  │        │
│  │              │ │              │ │              │        │
│  │ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │        │
│  │ │ Next.js  │ │ │ │ Next.js  │ │ │ │ Next.js  │ │        │
│  │ │  :3000   │ │ │ │  :3000   │ │ │ │  :3000   │ │        │
│  │ └──────────┘ │ │ └──────────┘ │ │ └──────────┘ │        │
│  │      │       │ │      │       │ │      │       │        │
│  │ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │        │
│  │ │PocketBase│ │ │ │PocketBase│ │ │ │PocketBase│ │        │
│  │ │  :8090   │ │ │ │  :8090   │ │ │ │  :8090   │ │        │
│  │ └──────────┘ │ │ └──────────┘ │ │ └──────────┘ │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Port Yapısı
| Servis | Internal Port | External Exposure |
|--------|---------------|-------------------|
| Next.js | 3000 | Traefik via 443 |
| PocketBase | 8090 | Traefik via 443 (optional) |

---

## Kurulum

### 1. Dosyaları Sunucuya Aktarın

```bash
# Git clone ile
git clone <repo-url> /opt/moka-crm
cd /opt/moka-crm

# Veya dosyaları manuel kopyalayın
scp -r ./moka-crm user@server:/opt/moka-crm
```

### 2. İlk Kurulum

```bash
# Linux/Mac
chmod +x deploy.sh
./deploy.sh init

# Windows PowerShell
.\deploy.ps1 init
```

Bu komut:
- Traefik network'ünü kontrol eder/o oluşturur
- `instances/` dizinini oluşturur

---

## İlk Deploy

### 1. Instance Ekleyin

```bash
# Linux/Mac
./deploy.sh add customer1

# Windows PowerShell
.\deploy.ps1 add customer1
```

Sizden domain girmeniz istenecektir:
```
Domain adı (örn: crm.example.com): crm.musteri1.com
```

### 2. Ortam Değişkenlerini Ayarlayın

Oluşan `instances/customer1/.env` dosyasını düzenleyin:

```bash
cd instances/customer1
nano .env
```

```env
# Email servisi
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@musteri1.com
RESEND_FROM_NAME=Musteri1 CRM

# WhatsApp (Green API)
GREEN_API_INSTANCE_ID=123456789
GREEN_API_TOKEN=abc123def456xyz789
```

### 3. Container'ları Restart Edin

```bash
docker compose restart
```

### 4. Erişim Testi

- Uygulama: `https://crm.musteri1.com`
- PocketBase Admin: `https://pb.crm.musteri1.com/_/`

---

## Yeni Instance Ekleme

Aynı sunucuda yeni bir müşteri için instance eklemek:

```bash
# Linux/Mac
./deploy.sh add musteri2

# Windows PowerShell
.\deploy.ps1 add musteri2
```

Domain girin (örn: `crm.musteri2.com`) ve ortam değişkenlerini düzenleyin.

---

## Yönetim Komutları

### Tüm Instance'ları Listele

```bash
./deploy.sh list        # Linux/Mac
.\deploy.ps1 list       # Windows
```

### Instance'ı Yeniden Başlat

```bash
./deploy.sh restart customer1    # Linux/Mac
.\deploy.ps1 restart customer1   # Windows
```

### Instance'ı Durdur

```bash
./deploy.sh stop customer1       # Linux/Mac
.\deploy.ps1 stop customer1      # Windows
```

### Instance'ı Başlat

```bash
./deploy.sh start customer1      # Linux/Mac
.\deploy.ps1 start customer1     # Windows
```

### Logları Görüntüle

```bash
./deploy.sh logs customer1       # Linux/Mac
.\deploy.ps1 logs customer1      # Windows
```

---

## Yedekleme

### Otomatik Yedek (Cron)

Örnek cron configuration (`/etc/cron.d/moka-crm-backup`):

```cron
# Her gün saat 03:00'te yedek al
0 3 * * * root /opt/moka-crm/deploy.sh backup customer1
0 3 * * * root /opt/moka-crm/deploy.sh backup customer2
```

### Manuel Yedek

```bash
./deploy.sh backup customer1
```

Yedekler `backups/` dizinine kaydedilir.

### Yedekten Geri Yükleme

```bash
# Instance'ı durdur
./deploy.sh stop customer1

# Eski yedeği sil
rm -rf instances/customer1/pb_data

# Yedeği çıkar
tar -xzf backups/customer1_20240301_030000.tar.gz -C /tmp/

# Verileri kopyala
cp -r /tmp/customer1/pb_data instances/customer1/

# Instance'ı başlat
./deploy.sh start customer1
```

---

## Sorun Giderme

### Container Başlamıyor

```bash
# Logları kontrol et
docker logs moka-crm-app-customer1
docker logs moka-crm-pb-customer1

# Container durumunu kontrol et
docker ps -a | grep customer1
```

### SSL Sertifika Hatası

Traefik loglarını kontrol edin:

```bash
docker logs traefik
```

Let's Encrypt rate limit'ine takılmış olabilirsiniz. Staging environment kullanın:

```yaml
# Traefik config'de certresolver'ı "letsencrypt-staging" olarak değiştirin
```

### PocketBase Bağlantı Hatası

1. PocketBase container'ın çalıştığını kontrol edin
2. `NEXT_PUBLIC_POCKETBASE_URL` environment variable'ını kontrol edin
3. Network bağlantısını kontrol edin:

```bash
docker network inspect moka-network-customer1
```

### Memory Sorunu

Container memory limit'i ekleyin (`docker-compose.yml`):

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

---

## Güvenlik Önerileri

1. **PocketBase Admin UI**: Production'da devre dışı bırakın veya VPN ile erişilebilir yapın
2. **API Rate Limiting**: Traefik middleware ekleyin
3. **Firewall**: Gereksiz portları kapatın
4. **Updates**: Düzenli olarak güncelleyin:
   ```bash
   cd instances/customer1
   docker compose pull
   docker compose up -d
   ```

---

## İleri Seviye Konfigürasyon

### Custom Build Args

Dockerfile'da PocketBase version'u değiştirmek için:

```bash
docker build --build-arg PB_VERSION=0.22.0 --target pocketbase -t moka-crm-pocketbase:latest .
```

### Resource Limits

`docker-compose.yml` ekleyin:

```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 256M
```

### Monitoring

Prometheus metrics eklemek için container'lara label ekleyin:

```yaml
labels:
  - "prometheus.enable=true"
  - "prometheus.port=3000"
```
