#!/bin/bash

###############################################################################
# Moka CRM - Multi-Instance Deployment Script
###############################################################################
# Bu script, aynı sunucuda birden fazla Moka CRM instance'ı ayağa kaldırır.
#
# Kullanım:
#   ./deploy.sh init                           # İlk instance için kurulum
#   ./deploy.sh add <instance-name>            # Yeni instance ekle (varsayılan: mevcut traefik ile)
#   ./deploy.sh add <instance-name> --new-traefik        # Yeni traefik ile
#   ./deploy.sh check-existing                 # Mevcut traefik sistemini kontrol et
#   ./deploy.sh list                           # Tüm instance'ları listele
#   ./deploy.sh restart <instance>             # Belirli instance'ı restart et
#   ./deploy.sh stop <instance>                # Instance'ı durdur
#   ./deploy logs <instance>                   # Instance loglarını görüntüle
###############################################################################

set -e

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Konfigürasyon
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTANCES_DIR="${SCRIPT_DIR}/instances"
TRAFIK_COMPOSE="${SCRIPT_DIR}/docker-compose-traefik.yml"
CURRENT_SYSTEM_COMPOSE="${SCRIPT_DIR}/docker-compose-current-system.yml"
TRAFIK_NETWORK="${TRAFIK_NETWORK:-base_default}"
TRAFIK_CERTRESOLVER="${TRAFIK_CERTRESOLVER:-letsencrypt}"

# Mevcut sistem kontrolü
check_existing_system() {
    # docker-compose-traefik.yml var mı ve traefik çalışıyor mu?
    if [ -f "$TRAFIK_COMPOSE" ]; then
        if docker ps --format '{{.Names}}' | grep -q "traefik"; then
            return 0
        fi
    fi
    return 1
}

# Mevcut sistemin traefik ayarlarını al
get_existing_traefik_config() {
    local certresolver="letsencrypt"
    local network="base_default"

    # docker-compose-traefik.yml'den ayarları al
    if [ -f "$TRAFIK_COMPOSE" ]; then
        # Network'ü al
        if grep -q "base_default" "$TRAFIK_COMPOSE"; then
            network="base_default"
        fi
        # CertResolver zaten letsencrypt
    fi

    # Mevcut network'ü doğrula
    local traefik_container=$(docker ps --format '{{.Names}}' | grep traefik | head -1)
    if [ -n "$traefik_container" ]; then
        # Container'ın network'lerini al
        local actual_network=$(docker inspect "$traefik_container" --format '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}' | head -1)
        if [ -n "$actual_network" ]; then
            network="$actual_network"
        fi
    fi

    echo "$certresolver|$network"
}

# Yardım mesajı
show_help() {
    cat << EOF
Moka CRM Multi-Instance Deployment

Kullanım:
    $0 init                         İlk kurulum (yeni traefik ile)
    $0 add <instance-name>          Yeni instance ekle (varsayılan: mevcut traefik ile)
    $0 add <instance-name> --new-traefik        Yeni traefik ile ekle
    $0 check-existing               Mevcut traefik sistemini kontrol et
    $0 list                         Tüm instance'ları listele
    $0 restart <instance-name>      Instance'ı restart et
    $0 stop <instance-name>         Instance'ı durdur
    $0 start <instance-name>        Instance'ı başlat
    $0 logs <instance-name>         Logları görüntüle
    $0 remove <instance-name>       Instance'ı sil (DİKKAT: veri silinir!)
    $0 backup <instance-name>       Yedek al

Örnek:
    $0 init
    $0 add customer1
    $0 add customer2 --new-traefik
    $0 list
    $0 check-existing

Ortam Değişkenleri:
    TRAFIK_NETWORK              Traefik network adı (default: base_default)
    TRAFIK_CERTRESOLVER          CertResolver adı (default: letsencrypt)

Yeni Yapı:
    - docker-compose-traefik.yml       Traefik reverse proxy
    - docker-compose-current-system.yml Diğer servisler (n8n, calcom, postgres)
    - Network: base_default (external)
    - CertResolver: letsencrypt
EOF
}

# Log fonksiyonları
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Mevcut sistem bilgisini göster
show_existing_system_info() {
    log_info "Mevcut sistem kontrol ediliyor..."

    # Traefik dosyasını kontrol et
    if [ -f "$TRAFIK_COMPOSE" ]; then
        log_success "docker-compose-traefik.yml bulundu"
        echo ""
        echo "Traefik konfigürasyonu:"
        echo "  Network: base_default"
        echo "  CertResolver: letsencrypt"
        echo ""
    fi

    # Diğer servisleri kontrol et
    if [ -f "$CURRENT_SYSTEM_COMPOSE" ]; then
        log_success "docker-compose-current-system.yml bulundu"
        echo ""
        echo "Mevcut servisler:"
        grep -E "^\s+[a-z]+:" "$CURRENT_SYSTEM_COMPOSE" | sed 's/:.*//' | sed 's/^/  - /'
        echo ""

        # Traefik container'ını kontrol et
        local traefik_container=$(docker ps --format '{{.Names}}' | grep traefik | head -1)
        if [ -n "$traefik_container" ]; then
            log_success "Traefik container çalışıyor: $traefik_container"
            echo ""
            echo "Network bilgileri:"
            docker inspect "$traefik_container" --format='  Network: {{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}'
            echo ""
            echo "Port bilgileri:"
            docker port "$traefik_container" | sed 's/^/  /'
            echo ""
        fi

        # .env.current dosyasını oku
        if [ -f "${SCRIPT_DIR}/.env.current" ]; then
            echo "Environment değişkenleri (.env.current):"
            grep -E "^(DOMAIN_NAME|SUBDOMAIN|SSL_EMAIL|GENERIC_TIMEZONE)=" "${SCRIPT_DIR}/.env.current" | sed 's/^/  /'
            echo ""
        fi
    else
        log_warning "docker-compose-current-system.yml bulunamadı"
        log_info "Yeni bir sistem kurulacak veya mevcut traefik manuel olarak belirtilmeli"
    fi
}

# Instance dizinini oluştur
create_instance_dir() {
    local instance_name=$1
    local instance_dir="${INSTANCES_DIR}/${instance_name}"

    if [ -d "${instance_dir}" ]; then
        log_error "Instance '${instance_name}' zaten mevcut!"
        exit 1
    fi

    mkdir -p "${instance_dir}/pb_data"
    mkdir -p "${instance_dir}/pb_public"

    echo "${instance_dir}"
}

# İlk kurulum
do_init() {
    log_info "İlk kurulum başlatılıyor..."

    # Mevcut sistem kontrolü
    if check_existing_system; then
        log_warning "Mevcut sistemde traefik çalışıyor!"
        show_existing_system_info
        echo ""
        read -p "Yeni bir traefik network oluşturmak istediğinizden emin misiniz? (e/h): " confirm
        if [[ ! $confirm =~ ^[Ee]$ ]]; then
            log_info "Mevcut traefik'i kullanmak için: $0 add <instance-name>"
            exit 0
        fi
    fi

    # Traefik network kontrolü
    if ! docker network ls | grep -q "${TRAFIK_NETWORK}"; then
        log_warning "Traefik network bulunamadı: ${TRAFIK_NETWORK}"
        read -p "Traefik network oluşturulsun mu? (e/h): " create_network
        if [[ $create_network =~ ^[Ee]$ ]]; then
            docker network create "${TRAFIK_NETWORK}"
            log_success "Network oluşturuldu: ${TRAFIK_NETWORK}"
        else
            log_error "Traefik network olmadan devam edilemez."
            exit 1
        fi
    fi

    # Instance dizinleri
    mkdir -p "${INSTANCES_DIR}"

    log_success "İlk kurulum tamamlandı!"
    echo ""
    log_info "Şimdi ilk instance'ı ekleyin:"
    echo "  $0 add <instance-name>"
}

# Instance ekle
do_add() {
    local instance_name=$1
    local use_existing_traefik=true  # Varsayılan: mevcut traefik kullan

    # Parametre kontrolü
    if [ "${2:-}" == "--new-traefik" ]; then
        use_existing_traefik=false
    fi

    if [ -z "${instance_name}" ]; then
        log_error "Instance adı belirtilmedi!"
        echo "Kullanım: $0 add <instance-name> [--new-traefik]"
        exit 1
    fi

    log_info "Yeni instance ekleniyor: ${instance_name}"

    # Instance adı kontrolü (sadece alfanumerik ve tire)
    if [[ ! "${instance_name}" =~ ^[a-z0-9-]+$ ]]; then
        log_error "Instance adı sadece küçük harf, rakam ve tire içerebilir."
        exit 1
    fi

    local instance_dir=$(create_instance_dir "${instance_name}")

    # Mevcut traefik kontrolü
    if $use_existing_traefik || check_existing_system; then
        local config=$(get_existing_traefik_config)
        local certresolver=$(echo "$config" | cut -d'|' -f1)
        local traefik_network=$(echo "$config" | cut -d'|' -f2)
        log_info "Mevcut traefik kullanılacak:"
        echo "  CertResolver: $certresolver"
        echo "  Network: $traefik_network"
        echo ""
    fi

    # Domain sor
    read -p "Domain adı (örn: crm.example.com): " domain
    if [ -z "${domain}" ]; then
        log_error "Domain adı zorunludur!"
        exit 1
    fi

    # Environment dosyası oluştur
    cat > "${instance_dir}/.env" << ENVINST
# Moka CRM Instance: ${instance_name}
INSTANCE_NAME=${instance_name}
DOMAIN=${domain}

# PocketBase Data Paths
PB_DATA_PATH=./pb_data
PB_PUBLIC_PATH=./pb_public

# Email Service (Resend)
RESEND_API_KEY=\${RESEND_API_KEY:-}
RESEND_FROM_EMAIL=\${RESEND_FROM_EMAIL:-noreply@${domain}}
RESEND_FROM_NAME=Moka CRM

# WhatsApp API (Green API)
GREEN_API_INSTANCE_ID=\${GREEN_API_INSTANCE_ID:-}
GREEN_API_TOKEN=\${GREEN_API_TOKEN:-}
ENVINST

    # Docker-compose oluştur
    cat > "${instance_dir}/docker-compose.yml" << YAML
services:
  app:
    image: moka-crm-nextjs:${instance_name}
    container_name: moka-crm-app-${instance_name}
    restart: unless-stopped
    build:
      context: ${SCRIPT_DIR}
      dockerfile: ${SCRIPT_DIR}/Dockerfile
      target: nextjs
      args:
        NEXT_PUBLIC_POCKETBASE_URL: https://pb.${domain}
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_POCKETBASE_URL=https://pb.${domain}
      - POCKETBASE_INTERNAL_URL=http://pocketbase:8090
      - RESEND_API_KEY=\${RESEND_API_KEY}
      - RESEND_FROM_EMAIL=\${RESEND_FROM_EMAIL}
      - RESEND_FROM_NAME=\${RESEND_FROM_NAME}
      - GREEN_API_INSTANCE_ID=\${GREEN_API_INSTANCE_ID}
      - GREEN_API_TOKEN=\${GREEN_API_TOKEN}
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.${instance_name}-app.rule=Host(\`${domain}\`)"
      - "traefik.http.routers.${instance_name}-app.entrypoints=websecure"
      - "traefik.http.routers.${instance_name}-app.tls=true"
      - "traefik.http.routers.${instance_name}-app.tls.certresolver=letsencrypt"
      - "traefik.http.services.${instance_name}-app.loadbalancer.server.port=3000"
    networks:
      - moka-network
      - base_default
    depends_on:
      pocketbase:
        condition: service_healthy

  pocketbase:
    image: moka-crm-pocketbase:${instance_name}
    container_name: moka-crm-pb-${instance_name}
    hostname: moka-crm-pb-${instance_name}
    restart: unless-stopped
    build:
      context: ${SCRIPT_DIR}
      dockerfile: ${SCRIPT_DIR}/Dockerfile
      target: pocketbase
    environment:
      - POCKETBASE_URL=https://pb.${domain}
    volumes:
      - ./pb_data:/pb_data
      - ./pb_public:/pb_public
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.${instance_name}-pb.rule=Host(\`pb.${domain}\`)"
      - "traefik.http.routers.${instance_name}-pb.entrypoints=websecure"
      - "traefik.http.routers.${instance_name}-pb.tls=true"
      - "traefik.http.routers.${instance_name}-pb.tls.certresolver=letsencrypt"
      - "traefik.http.services.${instance_name}-pb.loadbalancer.server.port=8090"
      # CORS headers
      - "traefik.http.middlewares.${instance_name}-pb-cors.headers.accesscontrolallowmethods=GET,POST,PUT,PATCH,DELETE,OPTIONS"
      - "traefik.http.middlewares.${instance_name}-pb-cors.headers.accesscontrolallowheaders=Authorization,Content-Type"
      - "traefik.http.middlewares.${instance_name}-pb-cors.headers.accesscontrolalloworiginlist=https://${domain},https://pb.${domain}"
      - "traefik.http.middlewares.${instance_name}-pb-cors.headers.addvaryheader=true"
      - "traefik.http.routers.${instance_name}-pb.middlewares=${instance_name}-pb-cors"
    networks:
      - moka-network
      - base_default
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:8090/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

networks:
  moka-network:
    name: moka-network-${instance_name}
  base_default:
    external: true
YAML

    # Build ve start
    log_info "Docker images build ediliyor..."
    cd "${instance_dir}"

    # PocketBase volume klasörlerini oluştur (permission sorununu önlemek için)
    log_info "PocketBase volume klasörleri oluşturuluyor..."
    mkdir -p pb_data pb_public
    chmod -R 777 pb_data pb_public 2>/dev/null || true

    # Varsayılan pb_data dosyalarını kopyala (init data varsa)
    if [ -d "${SCRIPT_DIR}/pb_init_data/pb_data" ]; then
        log_info "Varsayılan veritabanı şablonu kopyalanıyor..."

        # Tüm dosyaları kopyala (recursive)
        cp -r "${SCRIPT_DIR}/pb_init_data/pb_data"/. pb_data/ 2>/dev/null || true

        # Kopyalanan dosyaları listele
        local copied_count=$(find pb_data -type f | wc -l)
        log_success "Veritabanı şablonu kopyalandı: ${copied_count} dosya"

        # En önemli dosyaların varlığını kontrol et
        if [ -f "pb_data/data.db" ]; then
            log_success "✓ data.db kopyalandı"
        else
            log_warning "✗ data.db bulunamadı!"
        fi
    elif [ -d "${SCRIPT_DIR}/pb_data" ]; then
        log_info "Yerel pb_data referans olarak kullanılıyor..."
        log_warning "Üretim için pb_init_data/pb_data kullanın"
    fi

    docker compose build

    log_info "Container'lar başlatılıyor..."
    docker compose up -d

    # base_default network'e bağlanmasını doğrula
    if docker network ls | grep -q "base_default"; then
        log_success "Container'lar base_default network'ünde çalışıyor"
    else
        log_warning "base_default network bulunamadı!"
    fi

    log_success "Instance '${instance_name}' başarıyla oluşturuldu!"
    echo ""
    log_info "Erişim adresleri:"
    echo "  - Uygulama: https://${domain}"
    echo "  - PocketBase Admin: https://pb.${domain}"
    echo ""
    log_info "Yapılandırma:"
    echo "  - CertResolver: letsencrypt"
    echo "  - Network: base_default"
}

# Instance listele
do_list() {
    log_info "Moka CRM Instance'ları:"
    echo ""

    if [ ! -d "${INSTANCES_DIR}" ]; then
        log_warning "Henüz hiç instance yok."
        return
    fi

    local count=0
    for instance_dir in "${INSTANCES_DIR}"/*; do
        if [ -d "${instance_dir}" ]; then
            local instance_name=$(basename "${instance_dir}")
            local status="stopped"

            # Container durumunu kontrol et
            if docker ps --format '{{.Names}}' | grep -q "moka-crm-app-${instance_name}"; then
                status="${GREEN}running${NC}"
            elif docker ps -a --format '{{.Names}}' | grep -q "moka-crm-app-${instance_name}"; then
                status="${YELLOW}stopped${NC}"
            fi

            # Domain bilgisini al
            local domain=$(grep "^DOMAIN=" "${instance_dir}/.env" 2>/dev/null | cut -d'=' -f2 || echo "unknown")

            echo "  ${instance_name}"
            echo "    Domain: ${domain}"
            echo "    Status: ${status}"
            echo "    Path: ${instance_dir}"
            echo ""
            ((count++))
        fi
    done

    if [ $count -eq 0 ]; then
        log_warning "Henüz hiç instance yok."
    else
        log_success "Toplam ${count} instance bulundu."
    fi
}

# Instance restart
do_restart() {
    local instance_name=$1

    if [ -z "${instance_name}" ]; then
        log_error "Instance adı belirtilmedi!"
        exit 1
    fi

    local instance_dir="${INSTANCES_DIR}/${instance_name}"

    if [ ! -d "${instance_dir}" ]; then
        log_error "Instance bulunamadı: ${instance_name}"
        exit 1
    fi

    log_info "Instance restart ediliyor: ${instance_name}"
    cd "${instance_dir}"
    docker compose restart

    log_success "Instance restart edildi!"
}

# Instance durdur
do_stop() {
    local instance_name=$1

    if [ -z "${instance_name}" ]; then
        log_error "Instance adı belirtilmedi!"
        exit 1
    fi

    local instance_dir="${INSTANCES_DIR}/${instance_name}"

    if [ ! -d "${instance_dir}" ]; then
        log_error "Instance bulunamadı: ${instance_name}"
        exit 1
    fi

    log_info "Instance durduruluyor: ${instance_name}"
    cd "${instance_dir}"
    docker compose stop

    log_success "Instance durduruldu!"
}

# Instance başlat
do_start() {
    local instance_name=$1

    if [ -z "${instance_name}" ]; then
        log_error "Instance adı belirtilmedi!"
        exit 1
    fi

    local instance_dir="${INSTANCES_DIR}/${instance_name}"

    if [ ! -d "${instance_dir}" ]; then
        log_error "Instance bulunamadı: ${instance_name}"
        exit 1
    fi

    log_info "Instance başlatılıyor: ${instance_name}"
    cd "${instance_dir}"
    docker compose start

    log_success "Instance başlatıldı!"
}

# Log görüntüle
do_logs() {
    local instance_name=$1

    if [ -z "${instance_name}" ]; then
        log_error "Instance adı belirtilmedi!"
        exit 1
    fi

    local instance_dir="${INSTANCES_DIR}/${instance_name}"

    if [ ! -d "${instance_dir}" ]; then
        log_error "Instance bulunamadı: ${instance_name}"
        exit 1
    fi

    cd "${instance_dir}"
    docker compose logs -f
}

# Yedek al
do_backup() {
    local instance_name=$1
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_dir="${SCRIPT_DIR}/backups"
    local backup_file="${backup_dir}/${instance_name}_${timestamp}.tar.gz"

    if [ -z "${instance_name}" ]; then
        log_error "Instance adı belirtilmedi!"
        exit 1
    fi

    local instance_dir="${INSTANCES_DIR}/${instance_name}"

    if [ ! -d "${instance_dir}" ]; then
        log_error "Instance bulunamadı: ${instance_name}"
        exit 1
    fi

    mkdir -p "${backup_dir}"

    log_info "Yedek alınıyor: ${instance_name}"

    # Container'ı durdur (data consistency için)
    cd "${instance_dir}"
    docker compose stop pocketbase

    # Yedek al
    tar -czf "${backup_file}" -C "${instance_dir}" pb_data .env docker-compose.yml

    # Container'ı başlat
    docker compose start pocketbase

    log_success "Yedek oluşturuldu: ${backup_file}"
}

# Instance sil
do_remove() {
    local instance_name=$1

    if [ -z "${instance_name}" ]; then
        log_error "Instance adı belirtilmedi!"
        exit 1
    fi

    local instance_dir="${INSTANCES_DIR}/${instance_name}"

    if [ ! -d "${instance_dir}" ]; then
        log_error "Instance bulunamadı: ${instance_name}"
        exit 1
    fi

    log_warning "DİKKAT! Bu işlem tüm verileri silecektir!"
    read -p "Devam etmek istediğinizden emin misiniz? (evet yazın): " confirm

    if [ "${confirm}" != "evet" ]; then
        log_info "İptal edildi."
        exit 0
    fi

    log_info "Instance siliniyor: ${instance_name}"
    cd "${instance_dir}"
    docker compose down -v

    cd "${SCRIPT_DIR}"
    rm -rf "${instance_dir}"

    log_success "Instance silindi: ${instance_name}"
}

# Ana program
main() {
    case "${1:-}" in
        init)
            do_init
            ;;
        add)
            do_add "${2:-}" "${3:-}"
            ;;
        check-existing)
            show_existing_system_info
            ;;
        list)
            do_list
            ;;
        restart)
            do_restart "${2:-}"
            ;;
        stop)
            do_stop "${2:-}"
            ;;
        start)
            do_start "${2:-}"
            ;;
        logs)
            do_logs "${2:-}"
            ;;
        backup)
            do_backup "${2:-}"
            ;;
        remove)
            do_remove "${2:-}"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "Bilinmeyen komut: ${1:-}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

main "$@"
