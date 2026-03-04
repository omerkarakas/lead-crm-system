#!/bin/bash
echo "=== 1. Latest Lead Status ==="
curl -s "http://127.0.0.1:8090/api/collections/leads/records?sort=-created&perPage=1" | head -300

echo ""
echo "=== 2. Active QA Questions ==="
curl -s "http://127.0.0.1:8090/api/collections/qa_questions/records?filter=is_active=true" | head -200

echo ""
echo "=== 3. WhatsApp Messages (any) ==="
curl -s "http://127.0.0.1:8090/api/collections/whatsapp_messages/records?perPage=3" | head -200
