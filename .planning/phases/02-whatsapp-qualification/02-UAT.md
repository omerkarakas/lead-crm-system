---
status: testing
phase: 02-whatsapp-qualification
source: 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md
started: 2026-03-15T10:00:00Z
updated: 2026-03-15T10:00:00Z
---

## Current Test

number: 1
name: Admin can access QA questions page
expected: |
  Log in as Admin user. Navigate to http://localhost:3000/admin/qa. You should see the QA questions management page with a list of questions, "Yeni Soru" button, and "Karşılama Mesajı" button. The sidebar should show "Nitelik Soruları" link.
awaiting: user response

## Tests

### 1. Admin can access /admin/qa page
expected: Log in as Admin, go to /admin/qa, see QA questions list with action buttons
result: pending

### 2. Admin can create QA questions
expected: Click "Yeni Soru", fill form (question text, options a/b/c with points), submit. Question appears in list.
result: pending

### 3. Admin can edit and delete questions
expected: Click edit button on a question, modify fields and save. Changes reflect. Click delete, confirm, question removed.
result: pending

### 4. Admin can activate/deactivate questions
expected: Click toggle switch on a question. is_active status changes. Only active questions are sent to leads.
result: pending

### 5. Admin can reorder questions
expected: Click up/down arrows on questions. Order field updates and list reflects new order.
result: pending

### 6. Admin can configure welcome message
expected: Click "Karşılama Mesajı" button. Modal appears with welcome message template. Edit and save.
result: pending

### 7. WhatsApp poll sent 1 min after lead creation
expected: Create a new lead. After ~1 minute, check WhatsApp messages. Poll message should be sent automatically.
result: pending

### 8. System receives WhatsApp answers via webhook
expected: Send answer via WhatsApp to test number. Webhook receives and processes the message.
result: pending

### 9. System parses multiple answer formats
expected: Try different answer formats: "1a, 2b", "1a2b", "ab", "a b". All should be parsed correctly.
result: pending

### 10. System calculates and saves score
expected: After valid answer, check lead record. total_score, qa_completed, qa_completed_at should be updated.
result: pending

### 11. Lead detail shows total score vs threshold
expected: Open lead detail page. QA Scoring section shows score (e.g., "75/80") and quality badge.
result: pending

### 12. Lead detail shows quality badge
expected: Quality badge displays "Kalifiye" (green) if score >= 80, "Beklemede" (yellow) if < 80.
result: pending

### 13. Lead detail shows score breakdown
expected: Score display shows points earned per question with visual breakdown.
result: pending

### 14. Lead detail shows QA answers table
expected: QA Answers section shows table with Question, Answer (option text), Points columns.
result: pending

### 15. Lead detail shows QA status timestamps
expected: Status card shows "Gönderildi: [date]" and "Tamamlandı: [date]" timestamps.
result: pending

### 16. Admin can manually resend poll
expected: On lead detail (admin only), click "Tekrar Gönder" button. Poll should be resent immediately.
result: pending

### 17. Lead detail shows WhatsApp conversation
expected: WhatsApp section on lead detail shows full conversation history in chat-bubble format.
result: pending

### 18. Chat-bubble UI left/right alignment
expected: Incoming messages align left (gray), outgoing messages align right (green).
result: pending

### 19. Message status badges on outgoing
expected: Outgoing messages show status icons: Check (sent), CheckCheck (delivered), AlertCircle (failed).
result: pending

### 20. Timestamps in Turkish format
expected: All message timestamps show in DD.MM.YYYY HH:MM format (Turkish locale).
result: pending

### 21. Auto-refresh every 30 seconds
expected: Wait 30+ seconds on lead detail page. New messages should appear automatically without refresh.
result: pending

## Summary

total: 21
passed: 0
issues: 0
pending: 21
skipped: 0

## Gaps

[none yet]
