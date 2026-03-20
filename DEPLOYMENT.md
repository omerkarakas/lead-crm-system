# Moka CRM - Deployment Guide

Bu doküman, Moka CRM'in VPS sunucusuna deploy edilmesi için gereken adımları içerir.

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Gereksinimler](#gereksinimler)
3. [Kurulum Senaryoları](#kurulum-senaryoları)
4. [Teknik Mimari](#teknik-mimari)
5. [Kurulum](#kurulum)
6. [İlk Deploy](#ilk-deploy)
7. [Yeni Instance Ekleme](#yeni-instance-ekleme)
8. [Yönetim Komutları](#yönetim-komutları)
9. [Yedekleme](#yedekleme)
10. [Sorun Giderme](#sorun-giderme)

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
- **SSL sertifikası**: Traefik ile otomatik (Let's Encrypt)

---

## Kurulum Senaryoları

### Senaryo A: Mevcut Sisteme Ekleme (Traefik Var)

Sunucunuzda zaten çalışan bir Traefik instance'ı varsa (örneğin `docker-compose-current-system.yml` ile):

```bash
# Mevcut traefik'i kullanarak deploy
./deploy.sh add <instance-name> --use-existing-traefik

# Veya Docker Compose ile manuel deploy
cp docker-compose.template.yml docker-compose.yml
# docker-compose.yml içinde certresolver'ı "mytlschallenge" olarak ayarlayın
docker compose up -d
```

**Mevcut Traefik Ayarları:**
- CertResolver: `mytlschallenge`
- EntryPoints: `web` (80), `websecure` (443)
- Network: Traefik container'ı ile aynı network'te çalışmalı
- SSL Email: `.env.current` dosyasında `SSL_EMAIL`
- Mevcut Domain: `mokadijital.com`

### Senaryo B: Yeni Sunucuya Kurulum (Traefik Yok)

Temiz bir sunucuya Traefik ile birlikte kurulum için:

```bash
./deploy.sh init
./deploy.sh add <instance-name>
```

**Yeni Traefik Ayarları:**
- CertResolver: `letsencrypt`
- Network: `traefik-public` (otomatik oluşturulur)

---

## Teknik Mimari

### Mevcut Sistem Entegrasyonu

Eğer sunucunuzda `docker-compose-current-system.yml` ile çalışan bir sistem varsa:

```
┌─────────────────────────────────────────────────────────────┐
│                    Mevcut Sistem                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Traefik v2.11 (docker-compose-current-system.yml)  │   │
│  │  - CertResolver: mytlschallenge                      │   │
│  │  - Services: n8n, postgres, redis                    │   │
│  │  - Volume: traefik_data (external)                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                   │
│          ┌───────────────┼───────────────┐                  │
│          ▼               ▼               ▼                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ Moka CRM 1   │ │ Moka CRM 2   │ │  Moka CRM N  │        │
│  │              │ │              │ │              │        │
│  │ Next.js      │ │ Next.js      │ │ Next.js      │        │
│  │ PocketBase   │ │ PocketBase   │ │ PocketBase   │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Standalone Mimari

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

**Senaryo A: Mevcut Traefik Varsa**

```bash
# Mevcut traefik sistemini kontrol et
./deploy.sh check-existing

# instances/ dizinini oluştur
mkdir -p instances
```

**Senaryo B: Yeni Sunucuya Traefik ile Kurulum**

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

### 3. Mevcut Sistem Kontrolü

Mevcut traefik sistemini doğrulamak için:

```bash
# Traefik container'ını kontrol et
docker ps | grep traefik

# Mevcut volume'ları kontrol et
docker volume ls | grep traefik

# Mevcut network'leri kontrol et
docker network ls
```

Beklenen çıktı:
```
traefik_data (external volume)
n8n, postgres, redis (container'lar)
```

---

## İlk Deploy

### 1. Instance Ekleyin

**Senaryo A: Mevcut Traefik Kullanarak**

```bash
# Linux/Mac
./deploy.sh add customer1 --existing-traefik

# Windows PowerShell
.\deploy.ps1 add customer1 -ExistingTraefik
```

Sizden domain girmeniz istenecektir:
```
Domain adı (örn: crm.example.com): crm.musteri1.com
```

Otomatik olarak:
- CertResolver: `mytlschallenge` kullanılacak
- Mevcut traefik_data volume bağlanacak

**Senaryo B: Yeni Traefik ile**

```bash
# Linux/Mac
./deploy.sh add customer1

# Windows PowerShell
.\deploy.ps1 add customer1
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

### 3. Mevcut Sistem ile Entegrasyon

Oluşan `instances/customer1/docker-compose.yml` dosyasında **certresolver** ayarını kontrol edin:

```yaml
# Mevcut traefik kullanılıyorsa:
traefik.http.routers.customer1-app.tls.certresolver=mytlschallenge

# Yeni traefik kullanılıyorsa:
traefik.http.routers.customer1-app.tls.certresolver=letsencrypt
```

### 4. Container'ları Traefik Network'üne Bağla

```bash
# Traefik network adını öğren
docker network ls

# Container'ları bağla (otomatik yapılmalı ama kontrol edin)
docker network connect <traefik-network> moka-crm-app-customer1
docker network connect <traefik-network> moka-crm-pb-customer1
```

### 5. Erişim Testi

- Uygulama: `https://crm.musteri1.com`
- PocketBase Admin: `https://pb.crm.musteri1.com/_/`

---

## Yeni Instance Ekleme

Aynı sunucuda yeni bir müşteri için instance eklemek:

**Mevcut Traefik ile:**
```bash
# Linux/Mac
./deploy.sh add musteri2 --existing-traefik

# Windows PowerShell
.\deploy.ps1 add musteri2 -ExistingTraefik
```

**Yeni Traefik ile:**
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

### Mevcut Sistem Kontrolü

```bash
./deploy.sh check-existing       # Mevcut traefik sistemini kontrol et
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

### Mevcut Traefik ile SSL Sorunu

Eğer mevcut traefik kullanıyorsanız ve SSL sertifika hatası alırsanız:

```bash
# 1. CertResolver adını kontrol edin
docker logs traefik | grep certresolver

# 2. docker-compose.yml'de doğru certresolver'ı kullandığınızdan emin olun
# Mevcut sistemde: mytlschallenge
# Yeni sistemde: letsencrypt

# 3. Container'ları mevcut traefik network'üne bağlayın
docker network connect <traefik-network> moka-crm-app-customer1
```

### Container Başlamıyor

```bash
# Logları kontrol et
docker logs moka-crm-app-customer1
docker logs moka-crm-pb-customer1

# Container durumunu kontrol et
docker ps -a | grep customer1

# Network bağlantısını kontrol et
docker network inspect moka-network-customer1
```

### SSL Sertifika Hatası

Traefik loglarını kontrol edin:

```bash
# Mevcut traefik logları
docker logs $(docker ps -q -f name=traefik)

# Let's Encrypt rate limit kontrol
# Eğer rate limit'e takıldıysanız staging kullanın:
# .env dosyasında CERTRESOLVER=letsencrypt-staging ayarlayın
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

---

## Mevcut Sistem Referansı

Mevcut `docker-compose-current-system.yml` konfigürasyonu:

| Ayar | Değer |
|------|-------|
| Traefik Sürüm | v2.11 |
| CertResolver | mytlschallenge |
| EntryPoints | web (80), websecure (443) |
| SSL Email | `.env.current` → `SSL_EMAIL` |
| Volume | traefik_data (external) |
| Mevcut Domain | mokadijital.com |
| Mevcut Subdomain | ai (ai.mokadijital.com) |
