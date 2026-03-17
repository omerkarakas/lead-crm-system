#!/bin/bash

# Moka CRM API Test Script
# Usage: ./test-lead.sh <email> <password>

EMAIL="${1:-admin@mokadijital.com}"
PASSWORD="${2:-your_password}"
PB_URL="${NEXT_PUBLIC_POCKETBASE_URL:-http://127.0.0.1:8090}"
API_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"

echo "=== Moka CRM API Test ==="
echo ""

# Step 1: Login ve token al
echo "1. Login oluyor..."
TOKEN_RESPONSE=$(curl -s -X POST "$PB_URL/api/collections/users/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "{\"identity\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Login başarısız! Email ve şifrenizi kontrol edin."
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi

echo "✅ Login başarılı! Token alındı."
echo ""

# Step 2: Yeni lead oluştur
echo "2. Yeni lead oluşturuluyor..."
LEAD_RESPONSE=$(curl -s -X POST "$API_URL/api/leads" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "API Test Lead",
    "email": "apitest@example.com",
    "phone": "+905551234567",
    "company": "Test Company",
    "source": "manual",
    "message": "API üzerinden test leadi"
  }')

echo "Response:"
echo "$LEAD_RESPONSE" | head -20
echo ""

# Step 3: Lead listesini al
echo "3. Lead listesi alınıyor..."
LEADS_RESPONSE=$(curl -s -X GET "$API_URL/api/leads?page=1&perPage=5" \
  -H "Authorization: Bearer $TOKEN")

echo "Toplam lead sayısı:"
echo "$LEADS_RESPONSE" | grep -o '"totalItems":[0-9]*' | cut -d':' -f2
echo ""

echo "=== Test Tamamlandı ==="
