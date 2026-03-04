#!/bin/bash
echo "=== QA Questions Check ==="
curl -s "http://127.0.0.1:8090/api/collections/qa_questions/records?perPage=5&sort=-created" | head -200

echo ""
echo "=== QA Answers Check ==="
curl -s "http://127.0.0.1:8090/api/collections/qa_answers/records?perPage=5&sort=-created" | head -200

echo ""
echo "=== Leads Check (qa_sent status) ==="
curl -s "http://127.0.0.1:8090/api/collections/leads/records?perPage=5&sort=-created" | head -300
