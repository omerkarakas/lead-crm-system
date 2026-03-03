---
phase: 02-whatsapp-qualification
plan: 01
subsystem: qa, admin, data-model
tags: pocketbase, nextjs, shadcn-ui, typescript, zustand

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Lead CRUD, authentication, admin UI layout, RBAC
provides:
  - QA questions data model and collection
  - Admin UI for creating/managing QA questions
  - Welcome message configuration
  - Permission-based access control for QA management
affects:
  - 02-02: WhatsApp integration (uses questions and message format)
  - 02-03: Answer processing (uses question points and scoring)

# Tech tracking
tech-stack:
  added:
    - @radix-ui/react-switch
  patterns:
    - PocketBase collection for QA questions
    - Admin-only CRUD operations with permission check
    - Active/inactive toggle for questions
    - WhatsApp message preview formatting
    - LocalStorage for welcome message config
    - Zustand store for state management

key-files:
  created:
    - pb_migrations/1772534606_created_qa_questions.js
    - types/qa.ts
    - lib/api/qa.ts
    - lib/stores/qa.ts
    - lib/config/qa.ts
    - components/ui/switch.tsx
    - components/admin/qa/QuestionBuilder.tsx
    - components/admin/qa/QuestionList.tsx
    - components/admin/qa/WelcomeMessageConfig.tsx
    - app/(dashboard)/admin/qa/page.tsx
  modified:
    - pb_schema.json
    - lib/utils/permissions.ts
    - components/layout/Sidebar.tsx
    - package.json

key-decisions:
  - "Poll format: 2 questions in single message with numbered options"
  - "Fixed scoring: a=30, b=60, c=100 points (configurable per question)"
  - "Questions ordered by 'order' field"
  - "Only 'is_active' questions are sent to leads"
  - "Welcome message stored in localStorage for simplicity"
  - "Quality score threshold: 80 points for lead qualification"
  - "Admin-only access to QA question management"

patterns-established:
  - "Admin-only pages with permission check (canManageQAQuestions)"
  - "Reorderable list of questions with up/down buttons"
  - "Preview format for WhatsApp messages"
  - "Switch component for boolean toggles"
  - "Dialog-based CRUD operations"
  - "Toast notifications for user feedback"

# Metrics
estimated_tasks: 4
estimated_duration: 20 min
actual_duration: 3 min
started: 2026-03-03T10:43:12Z
completed: 2026-03-03T10:46:17Z
---

# Phase 2 Plan 1: QA Question Builder & Data Model Summary

**Admin'in QA sorularını oluşturup yönetebileceği bir sistem kuruldu ve veri modeli oluşturuldu.**

## Performance

- **Duration:** 3 minutes
- **Tasks:** 4/4 completed
- **Velocity:** ~45 min faster than estimated

## Accomplishments

1. **PocketBase Collection Created**
   - `qa_questions` collection with fields: question_text, options, points, order, is_active
   - Migration file created and seeded with 2 default questions
   - Schema added to pb_schema.json

2. **Type Definitions & API Layer**
   - Created `types/qa.ts` with QAQuestion, QAAnswer, WhatsAppMessage interfaces
   - Created `lib/api/qa.ts` with full CRUD operations
   - Added `CAN_MANAGE_QA_QUESTIONS` permission for Admin role

3. **State Management**
   - Created Zustand store (`lib/stores/qa.ts`) for QA questions
   - Handles fetch, create, update, delete, toggle active, and reorder operations

4. **Admin UI Components**
   - QuestionBuilder: Form for creating/editing questions with WhatsApp preview
   - QuestionList: Table with reorder, edit, delete, and toggle active actions
   - WelcomeMessageConfig: Modal for editing welcome message template
   - Added Nitelik Soruları link to sidebar for Admin users

5. **Configuration**
   - Created `lib/config/qa.ts` with QA constants and helper functions
   - Welcome message template with {name} and {company} variables
   - Poll footer for answer format instructions
   - Quality score threshold (80 points)
   - Helper functions for formatting messages and calculating scores

## Task Commits

| Commit | Message |
|--------|---------|
| f9880d5 | feat(02-01): create QA questions collection and types |
| 3283de6 | feat(02-01): create admin QA builder UI components |
| 6b3d893 | feat(02-01): add QA configuration and constants |

## Files Created

1. `pb_migrations/1772534606_created_qa_questions.js` - Migration for QA questions collection
2. `types/qa.ts` - QA type definitions
3. `lib/api/qa.ts` - QA API functions
4. `lib/stores/qa.ts` - QA Zustand store
5. `lib/config/qa.ts` - QA configuration constants
6. `components/ui/switch.tsx` - Switch UI component
7. `components/admin/qa/QuestionBuilder.tsx` - Question builder form
8. `components/admin/qa/QuestionList.tsx` - Question list table
9. `components/admin/qa/WelcomeMessageConfig.tsx` - Welcome message config modal
10. `app/(dashboard)/admin/qa/page.tsx` - Admin QA page

## Files Modified

1. `pb_schema.json` - Added qa_questions collection schema
2. `lib/utils/permissions.ts` - Added CAN_MANAGE_QA_QUESTIONS permission
3. `components/layout/Sidebar.tsx` - Added Nitelik Soruları link
4. `package.json` - Added @radix-ui/react-switch dependency

## Decisions Made

1. **Poll Format**: Questions sent in WhatsApp message format with numbered options (1a, 1b, 1c, etc.)
2. **Scoring System**: Default points a=30, b=60, c=100 but configurable per question
3. **Question Ordering**: Questions ordered by 'order' field for display
4. **Active Status**: Only questions with is_active=true are sent to leads
5. **Welcome Message Storage**: localStorage for simplicity (can be moved to PocketBase later)
6. **Quality Threshold**: 80 points required for lead to be marked as "qualified"
7. **Admin Access**: Only Admin role can manage QA questions

## Deviations from Plan

**None - plan executed exactly as written.**

All tasks completed according to specifications with no unexpected issues or deviations.

## Issues Encountered

**None.**

Implementation was straightforward with no blocking issues.

## User Setup Required

1. **PocketBase Collection**: The `qa_questions` collection is created via migration. Run the migration to apply:
   ```bash
   # The migration will be applied automatically when PocketBase starts
   # Or manually via PocketBase admin panel
   ```

2. **Admin Access**: Ensure user has Admin role to access `/admin/qa` page

## Next Phase Readiness

**Ready for 02-02 (WhatsApp Integration)**

- QA questions data model is in place
- Admin can create and manage questions
- Welcome message is configurable
- Question format is ready for WhatsApp sending

**Considerations for 02-02:**
- Need to integrate with WhatsApp Business API
- Use `formatPollMessage()` from lib/config/qa.ts to format messages
- Use `calculateScore()` to process lead answers
- Use `isQualified()` to determine lead quality status
- Welcome message with {name} variable ready for personalization

**Considerations for 02-03 (Answer Processing):**
- Need to parse WhatsApp responses (e.g., "1a, 2b")
- Need to create qa_answers collection to store responses
- Need to update lead quality status based on score
- Need to handle booking link for qualified leads
