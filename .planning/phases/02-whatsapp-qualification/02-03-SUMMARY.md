---
phase: 02-whatsapp-qualification
plan: 03
subsystem: leads, ui, scoring
tags: scoring, lead-detail, pocketbase, nextjs

# Dependency graph
requires:
  - phase: 02-02
    provides: WhatsApp integration, answer saving, scoring logic
provides:
  - Lead detail page with score display
  - QA answers table
  - Quality status badge
  - Manual QA trigger option

affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Score breakdown by question
    - Quality status badge with variants
    - Answers table with question text
    - Manual poll trigger from UI

key-files:
  created:
    - components/leads/ScoreDisplay.tsx
    - components/leads/QualityBadge.tsx
    - components/leads/QAAnswersTable.tsx
    - components/leads/ManualPollTrigger.tsx
  modified:
    - app/(dashboard)/leads/[id]/page.tsx
    - lib/api/qa.ts
    - types/qa.ts

key-decisions:
  - "Score display: total + breakdown per question"
  - "Quality badge: qualified (green), pending (yellow)"
  - "Manual trigger: Admin can resend poll"
  - "QA status indicators: sent, completed, etc."

patterns-established:
  - "Section-based lead detail layout"
  - "Status badge variants"
  - "Action buttons for manual operations"

# Metrics
estimated_tasks: 4
estimated_duration: 20 min
completed_tasks: 4
duration: 1 min
completed: 2026-03-03
---

# Phase 2 Plan 3: Lead Scoring Display & Completion Flow Summary

Display QA qualification scores, answers, and status on lead detail pages with admin manual trigger capability.

## One-Liner

Built complete QA scoring display system with score breakdown, quality badges, answers table, and admin-only manual poll trigger functionality.

## What Was Built

### Components Created

1. **ScoreDisplay** (`components/leads/ScoreDisplay.tsx`)
   - Shows total qualification score vs threshold
   - Displays quality badge (qualified/pending)
   - Optional breakdown by question with points earned
   - Clean card-based design

2. **QualityBadge** (`components/leads/QualityBadge.tsx`)
   - Reusable badge component using shadcn/ui Badge
   - Two variants: qualified (default), pending (secondary)
   - Simple text labels for Turkish UI

3. **QAAnswersTable** (`components/leads/QAAnswersTable.tsx`)
   - Server component fetching answers with question expansion
   - Three columns: Question, Answer (with option text), Points
   - Footer row showing total score
   - Empty state when no answers
   - Turkish labels throughout

4. **ManualPollTrigger** (`components/leads/ManualPollTrigger.tsx`)
   - Client component for admin actions
   - "Tekrar Gönder" (Resend) button
   - Disabled when QA completed or loading
   - Toast notifications for feedback
   - Auto-refresh after success

### API Endpoint

**POST /api/leads/[id]/send-poll**
- Admin-only access (role check)
- Sends poll immediately without delay
- Returns 400 if QA already completed
- Proper error handling with status codes

### Page Integration

Updated `app/(dashboard)/leads/[id]/page.tsx`:
- QA Scoring Section (shown when `qa_sent`)
  - ScoreDisplay with breakdown
  - Status card with timestamps
- QA Answers Section (shown when `qa_sent`)
  - Full QAAnswersTable
- Admin Actions Section (admin-only)
  - ManualPollTrigger button

### API Updates

Enhanced `lib/api/qa.ts`:
- `getLeadAnswers()` now expands question data
- Added `QAAnswerWithQuestion` type
- Better data fetching for table display

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Badge uses shadcn variants | Consistency with existing UI components |
| Server component for answers table | Better performance, no client JS needed |
| Admin-only manual trigger | Prevents abuse, maintains workflow integrity |
| Conditional section display | Clean UI, only show relevant info |
| Toast notifications | Immediate user feedback on actions |

## Files Changed

**Created:**
- `components/leads/ScoreDisplay.tsx`
- `components/leads/QualityBadge.tsx`
- `components/leads/QAAnswersTable.tsx`
- `components/leads/ManualPollTrigger.tsx`
- `app/api/leads/[id]/send-poll/route.ts`

**Modified:**
- `app/(dashboard)/leads/[id]/page.tsx` - Added QA sections and admin actions
- `lib/api/qa.ts` - Enhanced with question expansion
- `types/qa.ts` - Added QAAnswerWithQuestion type

## Deviations from Plan

**None** - Plan executed exactly as specified. All four tasks completed successfully with no deviations required.

## Authentication Gates

None encountered during this execution.

## Success Criteria Met

- [x] Lead detay sayfasında toplam skor görünüyor
- [x] Quality status badge (qualified/pending)
- [x] QA answers table: Question, Answer, Points
- [x] QA status indicators (poll sent, completed)
- [x] Admin "Tekrar Gönder" butonu ile manuel trigger

## Next Phase Readiness

All components are ready for Phase 2 Plan 4 (UAT). The QA scoring flow is now complete:

1. Poll sending via background job (02-02)
2. Webhook receiving answers (02-02)
3. Score calculation and saving (02-02)
4. Display on lead detail page (02-03) ← Current
5. Manual admin trigger (02-03) ← Current

No blockers identified.
