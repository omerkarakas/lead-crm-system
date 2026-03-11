---
phase: 05-campaigns-nurturing
plan: 04
subsystem: sequence-execution
tags: [pocketbase, typescript, nextjs, cron, automation, fire-and-forget, scheduling]

# Dependency graph
requires:
  - phase: 05-01
    provides: campaign and sequence data models
  - phase: 05-02
    provides: sequence builder with step types
  - phase: 05-03
    provides: enrollment system with enrollment tracking
  - phase: 05-06
    provides: enhanced sequence builder features
provides:
  - Sequence execution engine with step processing
  - Automated cron-based sequence processing
  - Manual sequence start and retry endpoints
  - Message tracking with sequence_messages collection
  - Execution log UI with timeline view
  - Execution monitoring page with stats and filters
affects: [05-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Fire-and-forget error handling for messaging
    - Batch processing with limited concurrency
    - Auto-refresh UI components (30-second intervals)
    - Timeline view for execution history
    - Relative and absolute delay scheduling
    - Template variable substitution with customVars

key-files:
  created:
    - pb_migrations/1772960688_created_sequence_messages.js
    - pb_migrations/1772960695_add_next_step_scheduled_to_campaign_enrollments.js
    - lib/api/sequence-executor.ts
    - app/api/cron/process-sequence/route.ts
    - app/api/sequences/[id]/start/route.ts
    - app/api/enrollments/[id]/retry/route.ts
    - components/campaigns/ExecutionLog.tsx
    - components/campaigns/SequenceScheduler.tsx
    - app/(dashboard)/campaigns/[id]/execution/page.tsx
    - app/(dashboard)/campaigns/[id]/execution/client.tsx
  modified:
    - types/campaign.ts

key-decisions:
  - Fire-and-forget error handling pattern for messaging to prevent cascade failures
  - Batch processing in groups of 50 to avoid cron timeouts
  - Auto-refresh every 30 seconds for real-time execution monitoring
  - Timeline view with vertical connecting line for execution history
  - Manual retry endpoint for failed enrollments
  - Both relative and absolute delay scheduling support
  - Template custom variables for unsubscribe links

patterns-established:
  - Pattern: Fire-and-forget messaging with error logging
  - Pattern: Cron-based batch processing with error handling
  - Pattern: Timeline UI for execution history
  - Pattern: Auto-refresh components for real-time data
  - Pattern: Manual control endpoints for admin operations

# Metrics
duration: 45min
completed: 2026-03-08
---

# Phase 05 Plan 04: Sequence Execution Engine Summary

**Automated sequence execution engine with scheduling, delay handling, message tracking, and monitoring UI**

## Performance

- **Duration:** 45 minutes
- **Started:** 2026-03-08T09:04:46Z
- **Completed:** 2026-03-08T09:49:00Z
- **Tasks:** 7
- **Files modified:** 12

## Accomplishments

- Created sequence_messages PocketBase collection for tracking sent messages
- Added next_step_scheduled field to campaign_enrollments for scheduling
- Implemented full sequence execution engine with step processing logic
- Created cron endpoint for automated batch processing
- Built manual sequence start and retry endpoints
- Developed execution log UI component with timeline view
- Created execution monitoring page with stats and filters

## Task Commits

Each task was committed atomically:

1. **Task 1: Create sequence_messages PocketBase collection** - `221da10` (feat)
2. **Task 2: Create sequence execution engine** - `7e58fc2` (feat)
3. **Task 3: Create cron endpoint for automated processing** - `24ab9c1` (feat)
4. **Task 4: Create manual sequence start endpoint** - `ca5f227` (feat)
5. **Task 5: Create execution log UI component** - `1b8e6b0` (feat)
6. **Task 6: Create sequence scheduler UI component** - `942bbb8` (feat)
7. **Task 7: Create execution monitoring page** - `a2aeece` (feat)

## Files Created/Modified

### Database
- `pb_migrations/1772960688_created_sequence_messages.js` - Sequence messages collection migration
- `pb_migrations/1772960695_add_next_step_scheduled_to_campaign_enrollments.js` - Add scheduling field to enrollments
- `sequence_messages` table - Tracks each message sent as part of a sequence
- `campaign_enrollments.next_step_scheduled` column - Schedules next step execution

### Types
- `types/campaign.ts` (modified) - Added SequenceMessageStatus, SequenceMessage, ExecutionResult interfaces

### API
- `lib/api/sequence-executor.ts` - Full execution engine with:
  - `startSequence()` - Initialize sequence, create message record for first step
  - `processNextStep()` - Process current step for enrollment with auto-advance
  - `sendStepMessage()` - Send message based on step type (email/whatsapp)
  - `scheduleNextStep()` - Calculate and update next step time
  - `calculateNextStepTime()` - Handle relative/absolute delays
  - `getRelativeDelayMinutes()` - Convert delay units to minutes
  - `validateDelaySettings()` - Check delay configuration validity
  - `sendEmailStep()` - Send email with template and custom variables
  - `sendWhatsAppStep()` - Send WhatsApp message with template
  - `createSequenceMessage()` - Create pending message record
  - `updateSequenceMessageStatus()` - Update message status with error tracking
  - `getExecutionHistory()` - Get all messages for enrollment
  - `executeStepWithErrorHandling()` - Fire-and-forget error handling

- `app/api/cron/process-sequence/route.ts` - Cron endpoint:
  - Protected by CRON_SECRET environment variable
  - Finds active enrollments where next_step_scheduled <= now
  - Processes in batches of 50 to avoid timeout
  - Returns { processed, successes, failures, errors, duration }
  - GET and POST methods supported

- `app/api/sequences/[id]/start/route.ts` - Manual start endpoint:
  - Authenticated endpoint requiring valid auth token
  - Body: { lead_id }
  - Finds or creates enrollment for lead
  - Resets failed/completed enrollments to active
  - Calls startSequence to begin execution
  - Returns { enrollment_id, first_step_scheduled }

- `app/api/enrollments/[id]/retry/route.ts` - Retry endpoint:
  - Authenticated endpoint for manual recovery
  - Resets status to active if failed or completed
  - Starts sequence from current step
  - Returns { enrollment_id }

### UI Components
- `components/campaigns/ExecutionLog.tsx` - Timeline view component:
  - Props: enrollmentId, autoRefresh (default: true)
  - Vertical timeline with connecting line
  - Step type icons (Mail/Message) with color coding
  - Status badges (Gönderildi/Başarısız/Bekliyor)
  - Turkish timestamps (DD.MM.YYYY HH:MM)
  - Error messages in red boxes
  - Auto-refresh every 30 seconds
  - Empty state: "Henüz mesaj gönderilmedi"

- `components/campaigns/SequenceScheduler.tsx` - Scheduler dashboard:
  - Props: sequenceId, campaignId
  - Stats cards (total, active, completed, failed) with color coding
  - "Şimdi İşle" button for manual cron trigger
  - Recent activity list (last 10 executions)
  - Relative timestamps ("5 dakika önce")
  - Toast notifications for actions

### Pages
- `app/(dashboard)/campaigns/[id]/execution/page.tsx` - Server component:
  - Fetches campaign, sequences, enrollments data
  - Calculates stats (total, active, completed, failed)
  - Passes data to client component

- `app/(dashboard)/campaigns/[id]/execution/client.tsx` - Client component:
  - Breadcrumb navigation
  - Page header with back button
  - Stats cards with color coding
  - SequenceScheduler component
  - Filters (search, status) with URL query params
  - Collapsible enrollment list
  - Expanded view shows ExecutionLog component
  - "Tekrar Dene" button for failed enrollments
  - Turkish UI throughout

## Decisions Made

- **Fire-and-forget error handling:** Messages log errors but don't throw to prevent cascade failures across enrollments
- **Batch processing:** Process enrollments in groups of 50 to avoid cron timeout limits
- **Auto-refresh pattern:** UI components refresh every 30 seconds for real-time monitoring without page reload
- **Timeline visualization:** Vertical timeline with icons and connecting lines for intuitive execution history
- **Manual control endpoints:** Admin can manually start sequences or retry failed enrollments for testing and recovery
- **Delay flexibility:** Support both relative (X minutes after previous) and absolute (specific time) delays
- **Template custom variables:** Extended variable system supports unsubscribe_link for email templates

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- **PocketBase migrations:** Migration files weren't being applied automatically. Fixed by manually creating tables in SQLite database.
- **Migration syntax error:** Initial migration file had syntax error (collection.add new Field). Fixed to use collection.addField(new Field()).
- **Typescript compilation:** Pre-existing TypeScript errors in other files, but not related to new code.

## User Setup Required

- **CRON_SECRET environment variable:** Optional, but recommended for production cron endpoint security
- **NEXT_PUBLIC_APP_URL environment variable:** Required for unsubscribe link generation in email templates

## Next Phase Readiness

- Sequence execution engine is ready for performance analytics (05-05)
- Message tracking is in place for engagement metrics
- Execution monitoring UI is ready for admin dashboard
- Manual control endpoints are ready for testing and recovery workflows

---
*Phase: 05-campaigns-nurturing*
*Plan: 04*
*Completed: 2026-03-08*
