#!/bin/bash
# Seed script to add booking_link_url setting to app_settings
# This script uses the PocketBase API to create the setting

# Configuration
PB_URL="${NEXT_PUBLIC_POCKETBASE_URL:-http://127.0.0.1:8090}"
ADMIN_EMAIL="${POCKETBASE_ADMIN_EMAIL:-admin@mokadijital.com}"
ADMIN_PASSWORD="${POCKETBASE_ADMIN_PASSWORD:-}"

echo "PocketBase URL: $PB_URL"

# Login as admin and get token
LOGIN_RESPONSE=$(curl -s -X POST "$PB_URL/api/collections/users/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "{\"identity\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

echo "Login response: $LOGIN_RESPONSE"

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Failed to authenticate. Please set POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD"
  exit 1
fi

echo "Authenticated successfully"

# Check if setting exists
CHECK_RESPONSE=$(curl -s -X GET "$PB_URL/api/collections/app_settings/records?filter=(service_name='calcom'&&setting_key='booking_link_url')" \
  -H "Authorization: Bearer $TOKEN")

echo "Check response: $CHECK_RESPONSE"

# If setting exists, update it; otherwise create it
if echo "$CHECK_RESPONSE" | grep -q '"totalItems":0'; then
  echo "Creating new booking_link_url setting..."
  curl -s -X POST "$PB_URL/api/collections/app_settings/records" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "service_name": "calcom",
      "setting_key": "booking_link_url",
      "setting_value": "https://cal.mokadijital.com/moka/30min",
      "description": "Randevu booking link for qualified leads",
      "is_active": true
    }'
  echo ""
  echo "Setting created successfully"
else
  RECORD_ID=$(echo "$CHECK_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "Updating existing booking_link_url setting (ID: $RECORD_ID)..."
  curl -s -X PATCH "$PB_URL/api/collections/app_settings/records/$RECORD_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "setting_value": "https://cal.mokadijital.com/moka/30min",
      "description": "Randevu booking link for qualified leads",
      "is_active": true
    }'
  echo ""
  echo "Setting updated successfully"
fi
