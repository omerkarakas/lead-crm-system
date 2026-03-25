###############################################################################
# Moka CRM - Multi-Instance Deployment Script (PowerShell)
###############################################################################
# Bu script, aynı sunucuda birden fazla Moka CRM instance'ı ayağa kaldırır.
#
# Kullanım:
#   .\deploy.ps1 init                           # İlk kurulum
#   .\deploy.ps1 add <instance-name>            # Yeni instance ekle
#   .\deploy.ps1 add <instance-name> -ExistingTraefik  # Mevcut traefik ile
#   .\deploy.ps1 check-existing                 # Mevcut traefik kontrol et
#   .\deploy.ps1 list                           # Tüm instance'ları listele
###############################################################################

param(
    [Parameter(Position=0)]
    [ValidateSet("init", "add", "list", "restart", "stop", "start", "logs", "backup", "remove", "help", "check-existing")]
    [string]$Command,

    [Parameter(Position=1)]
    [string]$InstanceName,

    [Parameter(Position=2)]
    [switch]$ExistingTraefik
)

# Konfigürasyon
$ScriptDir = $PSScriptRoot
$InstancesDir = Join-Path $ScriptDir "instances"
$TraefikCompose = Join-Path $ScriptDir "docker-compose-traefik.yml"
$CurrentSystemCompose = Join-Path $ScriptDir "docker-compose-current-system.yml"
$TraefikNetwork = $env:TRAFIK_NETWORK ?? "base_default"
$TraefikCertResolver = $env:TRAFIK_CERTRESOLVER ?? "letsencrypt"

# Mevcut sistem kontrolü
function Test-ExistingSystem {
    if (Test-Path $TraefikCompose) {
        $traefikContainer = docker ps --format "{{.Names}}" | Select-String "traefik"
        if ($traefikContainer) {
            return $true
        }
    }
    return $false
}

# Mevcut traefik konfigürasyonunu al
function Get-ExistingTraefikConfig {
    $certresolver = "letsencrypt"
    $network = "base_default"

    if (Test-Path $TraefikCompose) {
        if (Select-String -Path $TraefikCompose -Pattern "base_default" -Quiet) {
            $network = "base_default"
        }
    }

    $traefikContainer = docker ps --format "{{.Names}}" | Select-String "traefik" | Select-Object -First 1
    if ($traefikContainer) {
        $containerName = $traefikContainer.ToString().Trim()
        try {
            $inspect = docker inspect $containerName --format '{{json .NetworkSettings.Networks}}' | ConvertFrom-Json
            if ($inspect) {
                $actualNetwork = ($inspect | Get-Member -MemberType NoteProperty | Select-Object -First 1).Name
                if ($actualNetwork) {
                    $network = $actualNetwork
                }
            }
        } catch {
            # Keep default network
        }
    }

    return "$certresolver|$network"
}

# Renkli output için helper fonksiyonlar
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Info { Write-ColorOutput "[INFO] $args" -Color Cyan }
function Write-Success { Write-ColorOutput "[OK] $args" -Color Green }
function Write-Warning { Write-ColorOutput "[WARN] $args" -Color Yellow }
function Write-Error { Write-ColorOutput "[ERROR] $args" -Color Red }

function Show-Help {
    Write-Host @"
Moka CRM Multi-Instance Deployment

Kullanım:
    .\deploy.ps1 init                         İlk kurulum (yeni traefik ile)
    .\deploy.ps1 add <instance-name>          Yeni instance ekle
    .\deploy.ps1 add <instance-name> -ExistingTraefik    Mevcut traefik ile ekle
    .\deploy.ps1 check-existing               Mevcut traefik sistemini kontrol et
    .\deploy.ps1 list                         Tüm instance'ları listele
    .\deploy.ps1 restart <instance-name>      Instance'ı restart et
    .\deploy.ps1 stop <instance-name>         Instance'ı durdur
    .\deploy.ps1 start <instance-name>        Instance'ı başlat
    .\deploy.ps1 logs <instance-name>         Logları görüntüle
    .\deploy.ps1 remove <instance-name>       Instance'ı sil (DİKKAT!)
    .\deploy.ps1 backup <instance-name>       Yedek al

Ortam Değişkenleri:
    TRAFIK_NETWORK              Traefik network adı (default: traefik-public)
    TRAFIK_CERTRESOLVER          CertResolver adı (default: letsencrypt veya mytlschallenge)

Mevcut Sistem (docker-compose-current-system.yml):
    Eğer mevcut sistem varsa, certresolver otomatik olarak "mytlschallenge" olur.
"@
}

function Show-ExistingSystemInfo {
    Write-Info "Mevcut sistem kontrol ediliyor..."

    if (Test-Path $CurrentSystemCompose) {
        Write-Success "docker-compose-current-system.yml bulundu"
        Write-Host ""
        Write-Host "Mevcut servisler:"

        $content = Get-Content $CurrentSystemCompose
        foreach ($line in $content) {
            if ($line -match '^\s+([a-z]+):') {
                Write-Host "  - $($matches[1])"
            }
        }
        Write-Host ""

        $traefikContainer = docker ps --format "{{.Names}}" | Select-String "traefik" | Select-Object -First 1
        if ($traefikContainer) {
            $containerName = $traefikContainer.ToString().Trim()
            Write-Success "Traefik container çalışıyor: $containerName"
            Write-Host ""
            Write-Host "Network bilgileri:"

            try {
                $networks = docker inspect $containerName --format 'Network: {{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}'
                Write-Host "  $networks"
            } catch {
                Write-Host "  Network bilgisi alınamadı"
            }

            Write-Host ""
            Write-Host "Port bilgileri:"
            docker port $containerName | ForEach-Object { Write-Host "  $_" }
            Write-Host ""
        }

        $envCurrent = Join-Path $ScriptDir ".env.current"
        if (Test-Path $envCurrent) {
            Write-Host "Environment değişkenleri (.env.current):"
            Get-Content $envCurrent | Where-Object { $_ -match '^(DOMAIN_NAME|SUBDOMAIN|SSL_EMAIL|GENERIC_TIMEZONE)=' } | ForEach-Object {
                Write-Host "  $_"
            }
            Write-Host ""
        }
    } else {
        Write-Warning "docker-compose-current-system.yml bulunamadı"
        Write-Info "Yeni bir sistem kurulacak veya mevcut traefik manuel olarak belirtilmeli"
    }
}

function Initialize-Setup {
    Write-Info "İlk kurulum başlatılıyor..."

    # Mevcut sistem kontrolü
    if (Test-ExistingSystem) {
        Write-Warning "Mevcut sistemde traefik çalışıyor!"
        Show-ExistingSystemInfo
        Write-Host ""
        $confirm = Read-Host "Yeni bir traefik network oluşturmak istediğinizden emin misiniz? (e/h)"
        if ($confirm -ne "e") {
            Write-Info "Mevcut traefik'i kullanmak için: .\deploy.ps1 add <instance-name> -ExistingTraefik"
            exit 0
        }
    }

    # Traefik network kontrolü
    $networkExists = docker network ls --format "{{.Name}}" | Select-String -Pattern $TraefikNetwork
    if (-not $networkExists) {
        Write-Warning "Traefik network bulunamadı: $TraefikNetwork"
        $createNetwork = Read-Host "Traefik network oluşturulsun mu? (e/h)"
        if ($createNetwork -eq "e") {
            docker network create $TraefikNetwork
            Write-Success "Network oluşturuldu: $TraefikNetwork"
        } else {
            Write-Error "Traefik network olmadan devam edilemez."
            exit 1
        }
    }

    # Instance dizinleri
    if (-not (Test-Path $InstancesDir)) {
        New-Item -ItemType Directory -Path $InstancesDir -Force | Out-Null
    }

    Write-Success "İlk kurulum tamamlandı!"
    Write-Host ""
    Write-Info "Şimdi ilk instance'ı ekleyin:"
    Write-Host "  .\deploy.ps1 add <instance-name>"
}

function Add-Instance {
    param([string]$Name)

    if ([string]::IsNullOrEmpty($Name)) {
        Write-Error "Instance adı belirtilmedi!"
        Write-Host "Kullanım: .\deploy.ps1 add <instance-name> [-ExistingTraefik]"
        exit 1
    }

    Write-Info "Yeni instance ekleniyor: $Name"

    # Instance adı validation
    if ($Name -notmatch '^[a-z0-9-]+$') {
        Write-Error "Instance adı sadece küçük harf, rakam ve tire içerebilir."
        exit 1
    }

    $instanceDir = Join-Path $InstancesDir $Name

    if (Test-Path $instanceDir) {
        Write-Error "Instance '$Name' zaten mevcut!"
        exit 1
    }

    # CertResolver ve Network belirle
    $certresolver = $env:TRAFIK_CERTRESOLVER ?? "letsencrypt"
    $traefikNetwork = $TraefikNetwork

    if ($ExistingTraefik -or (Test-ExistingSystem)) {
        $config = Get-ExistingTraefikConfig
        $parts = $config -split '\|'
        $certresolver = $parts[0]
        $traefikNetwork = $parts[1]
        Write-Info "Mevcut traefik kullanılacak:"
        Write-Host "  CertResolver: $certresolver"
        Write-Host "  Network: $traefikNetwork"
        Write-Host ""
    }

    # Instance dizini oluştur
    New-Item -ItemType Directory -Path $instanceDir -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $instanceDir "pb_data") -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $instanceDir "pb_public") -Force | Out-Null

    # Domain sor
    $domain = Read-Host "Domain adı (örn: crm.example.com)"
    if ([string]::IsNullOrEmpty($domain)) {
        Write-Error "Domain adı zorunludur!"
        exit 1
    }

    # Environment dosyası oluştur
    @"
# Moka CRM Instance: $Name
INSTANCE_NAME=$Name
DOMAIN=$domain
CERTRESOLVER=$certresolver
TRAFIK_NETWORK=$traefikNetwork

# PocketBase Data Paths
PB_DATA_PATH=./pb_data
PB_PUBLIC_PATH=./pb_public

# Email Service (Resend)
RESEND_API_KEY=`$env:RESEND_API_KEY
RESEND_FROM_EMAIL=`$env:RESEND_FROM_EMAIL
RESEND_FROM_NAME=Moka CRM

# WhatsApp API (Green API)
GREEN_API_INSTANCE_ID=`$env:GREEN_API_INSTANCE_ID
GREEN_API_TOKEN=`$env:GREEN_API_TOKEN
"@ | Out-File -FilePath (Join-Path $instanceDir ".env") -Encoding UTF8

    # Docker-compose oluştur
    $dockerComposeContent = @"
version: "3.8"

services:
  app:
    image: moka-crm-nextjs:$Name
    container_name: moka-crm-app-$Name
    restart: unless-stopped
    build:
      context: $ScriptDir
      dockerfile: $ScriptDir/Dockerfile
      target: nextjs
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_POCKETBASE_URL=http://pocketbase:8090
      - RESEND_API_KEY=`${RESEND_API_KEY}
      - RESEND_FROM_EMAIL=`${RESEND_FROM_EMAIL}
      - RESEND_FROM_NAME=`${RESEND_FROM_NAME}
      - GREEN_API_INSTANCE_ID=`${GREEN_API_INSTANCE_ID}
      - GREEN_API_TOKEN=`${GREEN_API_TOKEN}
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.$Name-app.rule=Host(``$domain``)"
      - "traefik.http.routers.$Name-app.entrypoints=websecure"
      - "traefik.http.routers.$Name-app.tls=true"
      - "traefik.http.routers.$Name-app.tls.certresolver=$certresolver"
      - "traefik.http.services.$Name-app.loadbalancer.server.port=3000"
      - "traefik.docker.network=$traefikNetwork"
    networks:
      - moka-network
    depends_on:
      pocketbase:
        condition: service_healthy

  pocketbase:
    image: moka-crm-pocketbase:$Name
    container_name: moka-crm-pb-$Name
    restart: unless-stopped
    build:
      context: $ScriptDir
      dockerfile: $ScriptDir/Dockerfile
      target: pocketbase
    volumes:
      - ./pb_data:/pb_data
      - ./pb_public:/pb_public
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.$Name-pb.rule=Host(``pb.$domain``)"
      - "traefik.http.routers.$Name-pb.entrypoints=websecure"
      - "traefik.http.routers.$Name-pb.tls=true"
      - "traefik.http.routers.$Name-pb.tls.certresolver=$certresolver"
      - "traefik.http.services.$Name-pb.loadbalancer.server.port=8090"
      - "traefik.docker.network=$traefikNetwork"
    networks:
      - moka-network
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:8090/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

networks:
  moka-network:
    name: moka-network-$Name
    external: false
"@

    $dockerComposeContent | Out-File -FilePath (Join-Path $instanceDir "docker-compose.yml") -Encoding UTF8

    # Build ve start
    Write-Info "Docker images build ediliyor..."
    Push-Location $instanceDir
    docker compose build

    Write-Info "Container'lar başlatılıyor..."
    docker compose up -d

    # Traefik network'e ekle
    $networkList = docker network ls --format "{{.Name}}"
    if ($networkList -match $traefikNetwork) {
        docker network connect $traefikNetwork "moka-crm-app-$Name" 2>$null
        docker network connect $traefikNetwork "moka-crm-pb-$Name" 2>$null
        Write-Success "Container'lar traefik network'üne bağlandı: $traefikNetwork"
    }

    Pop-Location

    Write-Success "Instance '$Name' başarıyla oluşturuldu!"
    Write-Host ""
    Write-Info "Erişim adresleri:"
    Write-Host "  - Uygulama: https://$domain"
    Write-Host "  - PocketBase Admin: https://pb.$domain"
    Write-Host ""
    Write-Info "Yapılandırma:"
    Write-Host "  - CertResolver: $certresolver"
    Write-Host "  - Network: $traefikNetwork"
}

function Show-Instances {
    Write-Info "Moka CRM Instance'ları:"
    Write-Host ""

    if (-not (Test-Path $InstancesDir)) {
        Write-Warning "Henüz hiç instance yok."
        return
    }

    $count = 0
    Get-ChildItem $InstancesDir -Directory | ForEach-Object {
        $instanceName = $_.Name
        $envFile = Join-Path $_.FullName ".env"

        # Container durumunu kontrol et
        $container = docker ps --format "{{.Names}}" | Select-String "moka-crm-app-$instanceName"
        $status = if ($container) { "running" } else { "stopped" }

        # Domain bilgisini al
        $domain = "unknown"
        if (Test-Path $envFile) {
            $domainLine = Get-Content $envFile | Select-String "^DOMAIN="
            if ($domainLine) {
                $domain = ($domainLine -split "=")[1]
            }
        }

        Write-Host "  $instanceName"
        Write-Host "    Domain: $domain"
        Write-Host "    Status: $status"
        Write-Host "    Path: $($_.FullName)"
        Write-Host ""
        $count++
    }

    if ($count -eq 0) {
        Write-Warning "Henüz hiç instance yok."
    } else {
        Write-Success "Toplam $count instance bulundu."
    }
}

function Restart-Instance {
    param([string]$Name)

    if ([string]::IsNullOrEmpty($Name)) {
        Write-Error "Instance adı belirtilmedi!"
        exit 1
    }

    $instanceDir = Join-Path $InstancesDir $Name

    if (-not (Test-Path $instanceDir)) {
        Write-Error "Instance bulunamadı: $Name"
        exit 1
    }

    Write-Info "Instance restart ediliyor: $Name"
    Push-Location $instanceDir
    docker compose restart
    Pop-Location

    Write-Success "Instance restart edildi!"
}

function Stop-Instance {
    param([string]$Name)

    if ([string]::IsNullOrEmpty($Name)) {
        Write-Error "Instance adı belirtilmedi!"
        exit 1
    }

    $instanceDir = Join-Path $InstancesDir $Name

    if (-not (Test-Path $instanceDir)) {
        Write-Error "Instance bulunamadı: $Name"
        exit 1
    }

    Write-Info "Instance durduruluyor: $Name"
    Push-Location $instanceDir
    docker compose stop
    Pop-Location

    Write-Success "Instance durduruldu!"
}

function Start-Instance {
    param([string]$Name)

    if ([string]::IsNullOrEmpty($Name)) {
        Write-Error "Instance adı belirtilmedi!"
        exit 1
    }

    $instanceDir = Join-Path $InstancesDir $Name

    if (-not (Test-Path $instanceDir)) {
        Write-Error "Instance bulunamadı: $Name"
        exit 1
    }

    Write-Info "Instance başlatılıyor: $Name"
    Push-Location $instanceDir
    docker compose start
    Pop-Location

    Write-Success "Instance başlatıldı!"
}

function Show-Logs {
    param([string]$Name)

    if ([string]::IsNullOrEmpty($Name)) {
        Write-Error "Instance adı belirtilmedi!"
        exit 1
    }

    $instanceDir = Join-Path $InstancesDir $Name

    if (-not (Test-Path $instanceDir)) {
        Write-Error "Instance bulunamadı: $Name"
        exit 1
    }

    Push-Location $instanceDir
    docker compose logs -f
    Pop-Location
}

# Ana program
switch ($Command) {
    "init" {
        Initialize-Setup
    }
    "add" {
        Add-Instance -Name $InstanceName
    }
    "check-existing" {
        Show-ExistingSystemInfo
    }
    "list" {
        Show-Instances
    }
    "restart" {
        Restart-Instance -Name $InstanceName
    }
    "stop" {
        Stop-Instance -Name $InstanceName
    }
    "start" {
        Start-Instance -Name $InstanceName
    }
    "logs" {
        Show-Logs -Name $InstanceName
    }
    "help" {
        Show-Help
    }
    default {
        Write-Error "Bilinmeyen komut: $Command"
        Write-Host ""
        Show-Help
        exit 1
    }
}
