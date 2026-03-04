#!/bin/bash
# Test poll sending for latest lead
LEAD_ID=$(curl -s "http://127.0.0.1:8090/api/collections/leads/records?sort=-created&perPage=1" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "Latest Lead ID: $LEAD_ID"
echo ""
echo "Sending poll request to API..."

# Send poll via API
curl -X POST "http://localhost:3000/api/leads/$LEAD_ID/send-poll" \
  -H "Content-Type: application/json" \
  -v 2>&1 | head -50
