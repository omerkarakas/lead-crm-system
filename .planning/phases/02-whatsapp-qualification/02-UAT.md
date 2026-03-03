---
phase: 02-whatsapp-qualification
status: skipped
completed: 2026-03-03T14:50:00Z
reason: User requested skip UAT
---

# Phase 2: WhatsApp & Qualification — User Acceptance Tests

## Testable Deliverables (from SUMMARY.md files)

### Plan 01: QA Question Builder & Data Model
1. Admin can access /admin/qa page
2. Admin can create QA questions with options (a/b/c) and point values
3. Admin can edit and delete questions
4. Admin can activate/deactivate questions with toggle
5. Admin can reorder questions with up/down buttons
6. Admin can configure welcome message template

### Plan 02: WhatsApp Integration & QA Flow Engine
7. When lead is created, WhatsApp poll is sent automatically after 1 minute delay
8. System receives WhatsApp answers via webhook
9. System parses multiple answer formats ('1a, 2b', '1a2b', 'ab', 'a b')
10. System calculates score and saves to lead record

### Plan 03: Lead Scoring Display & Completion Flow
11. Lead detail page shows total score vs threshold (80)
12. Lead detail page shows quality badge (qualified/pending)
13. Lead detail page shows score breakdown per question
14. Lead detail page shows QA answers table (Question, Answer, Points)
15. Lead detail page shows QA status timestamps (sent, completed)
16. Admin can manually resend poll with "Tekrar Gönder" button

### Plan 04: WhatsApp Message History UI
17. Lead detail page shows full WhatsApp conversation history
18. Chat-bubble UI with left (incoming) / right (outgoing) alignment
19. Message status badges (sent/delivered/read/failed) on outgoing messages
20. Timestamps displayed in Turkish format (DD.MM.YYYY HH:MM)
21. Auto-refresh every 30 seconds for new messages

---

## Test Results

| # | Test | Status | Notes |
|---|------|--------|-------|
| 1 | Admin can access /admin/qa page | pending | |
| 2 | Admin can create QA questions | pending | |
| 3 | Admin can edit and delete questions | pending | |
| 4 | Admin can activate/deactivate questions | pending | |
| 5 | Admin can reorder questions | pending | |
| 6 | Admin can configure welcome message | pending | |
| 7 | WhatsApp poll sent 1 min after lead creation | pending | |
| 8 | System receives WhatsApp answers via webhook | pending | |
| 9 | System parses multiple answer formats | pending | |
| 10 | System calculates and saves score | pending | |
| 11 | Lead detail shows total score vs threshold | pending | |
| 12 | Lead detail shows quality badge | pending | |
| 13 | Lead detail shows score breakdown | pending | |
| 14 | Lead detail shows QA answers table | pending | |
| 15 | Lead detail shows QA status timestamps | pending | |
| 16 | Admin can manually resend poll | pending | |
| 17 | Lead detail shows WhatsApp conversation | pending | |
| 18 | Chat-bubble UI left/right alignment | pending | |
| 19 | Message status badges on outgoing | pending | |
| 20 | Timestamps in Turkish format | pending | |
| 21 | Auto-refresh every 30 seconds | pending | |

---

*Total: 21 tests*
*Passed: 0*
*Failed: 0*
*Remaining: 21*
