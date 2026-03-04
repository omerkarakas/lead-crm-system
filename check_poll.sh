#!/bin/bash
echo "=== Check if QA questions exist ==="
curl -s "http://127.0.0.1:8090/api/collections/qa_questions/records?filter=is_active=true" 2>/dev/null | head -200

echo ""
echo "=== Check latest lead qa_sent status ==="
curl -s "http://127.0.0.1:8090/api/collections/leads/records?sort=-created&perPage=1" 2>/dev/null
