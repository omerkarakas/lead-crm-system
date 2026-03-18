#!/bin/bash

###############################################################################
# Moka CRM - Multi-Instance Deployment Script
###############################################################################
# Bu script, aynı sunucuda birden fazla Moka CRM instance'ı ayağa kaldırır.
#
# Kullanım:
#   ./deploy.sh init                   # İlk instance için kurulum
#   ./deploy.sh add <instance-name>    # Yeni instance ekle
#   ./deploy.sh list                   # Tüm instance'ları listele
#   ./deploy.sh restart <instance>     # Belirli instance'ı restart et
#   ./deploy.sh stop <instance>        # Instance'ı durdur
#   ./deploy logs <instance>           # Instance loglarını görüntüle
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
TRAFFIK_NETWORK="${TRAFFIK_NETWORK:-traefik-public}"

# Yardım mesajı
show_help() {
    cat << EOF
Moka CRM Multi-Instance Deployment

Kullanım:
    $0 init                         İlk kurulum
    $0 add <instance-name>          Yeni instance ekle
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
    $0 add customer2
    $0 list

Ortam Değişkenleri:
    TRAFIK_NETWORK              Traefik network adı (default: traefik-public)
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

    # Traefik network kontrolü
    if ! docker network ls | grep -q "${TRAFFIK_NETWORK}"; then
        log_warning "Traefik network bulunamadı: ${TRAFFIK_NETWORK}"
        read -p "Traefik network oluşturulsun mu? (e/h): " create_network
        if [[ $create_network =~ ^[Ee]$ ]]; then
            docker network create "${TRAFFIK_NETWORK}"
            log_success "Network oluşturuldu: ${TRAFFIK_NETWORK}"
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

    if [ -z "${instance_name}" ]; then
        log_error "Instance adı belirtilmedi!"
        echo "Kullanım: $0 add <instance-name>"
        exit 1
    fi

    log_info "Yeni instance ekleniyor: ${instance_name}"

    # Instance adı kontrolü (sadece alfanumerik ve tire)
    if [[ ! "${instance_name}" =~ ^[a-z0-9-]+$ ]]; then
        log_error "Instance adı sadece küçük harf, rakam ve tire içerebilir."
        exit 1
    fi

    local instance_dir=$(create_instance_dir "${instance_name}")

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
RESEND_FROM_EMAIL=\${RESEND_FROM_EMAIL:-noreply@\${domain}}
RESEND_FROM_NAME=Moka CRM

# WhatsApp API (Green API)
GREEN_API_INSTANCE_ID=\${GREEN_API_INSTANCE_ID:-}
GREEN_API_TOKEN=\${GREEN_API_TOKEN:-}
ENVINST

    # Docker-compose oluştur
    cat > "${instance_dir}/docker-compose.yml" << YAML
version: "3.8"

services:
  app:
    image: moka-crm-nextjs:${instance_name}
    container_name: moka-crm-app-${instance_name}
    restart: unless-stopped
    build:
      context: ../
      dockerfile: Dockerfile
      target: nextjs
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_POCKETBASE_URL=http://pocketbase:8090
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
      - "traefik.docker.network=${TRAFFIK_NETWORK}"
    networks:
      - moka-network
    depends_on:
      pocketbase:
        condition: service_healthy

  pocketbase:
    image: moka-crm-pocketbase:${instance_name}
    container_name: moka-crm-pb-${instance_name}
    restart: unless-stopped
    build:
      context: ../
      dockerfile: Dockerfile
      target: pocketbase
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
      - "traefik.docker.network=${TRAFFIK_NETWORK}"
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
    name: moka-network-${instance_name}
    external: false
YAML

    # Build ve start
    log_info "Docker images build ediliyor..."
    cd "${instance_dir}"
    docker compose build

    log_info "Container'lar başlatılıyor..."
    docker compose up -d

    # Traefik network'e ekle
    docker network connect "${TRAFFIK_NETWORK}" "moka-crm-app-${instance_name}" 2>/dev/null || true
    docker network connect "${TRAFFIK_NETWORK}" "moka-crm-pb-${instance_name}" 2>/dev/null || true

    log_success "Instance '${instance_name}' başarıyla oluşturuldu!"
    echo ""
    log_info "Erişim adresleri:"
    echo "  - Uygulama: https://${domain}"
    echo "  - PocketBase Admin: https://pb.${domain}"
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
            do_add "${2:-}"
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
