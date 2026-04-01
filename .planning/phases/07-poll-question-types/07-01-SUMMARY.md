---
phase: 07-poll-question-types
plan: 01
subsystem: database
tags: pocketbase, typescript, discriminated-unions, validation, migration

# Dependency graph
requires:
  - phase: 06-polish-integration
    provides: QA system foundation with single-choice questions
provides:
  - Extended data model supporting 4 question types (single, multiple, likert, open)
  - Type-safe discriminated unions for question-specific data
  - Validation framework for question and answer integrity
  - Migration script ready for deployment
affects: [07-02-qa-form-ui, 07-03-whatsapp-integration, 08-whatsapp-inline-buttons]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Discriminated unions for type-safe question variants
    - Validation error class with structured error codes
    - Legacy DTOs for backward compatibility
    - JSON serialization for complex answer types (arrays)

key-files:
  created:
    - pb_migrations/07-add_question_types.js
  modified:
    - pb_schema.json
    - types/qa.ts
    - lib/api/qa.ts

key-decisions:
  - "Changed selected_answer from select to text field for flexibility"
  - "Used discriminated unions instead of base class with optional fields"
  - "Maintained backward compatibility with legacy DTO types"

patterns-established:
  - "Pattern: QuestionValidationError class with field and error codes"
  - "Pattern: validateQuestionData() routes to type-specific validators"
  - "Pattern: validateAnswerData() validates against question schema"
  - "Pattern: calculatePointsEarned() handles all question types"

# Metrics
duration: 7min
completed: 2026-04-01
---

# Phase 7 Plan 1: Poll Question Types Summary

**Extended QA data model with discriminated unions for single/multiple/likert/open question types, PocketBase migration, and comprehensive validation framework**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-01T09:51:48Z
- **Completed:** 2026-04-01T09:58:31Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Database schema extended with `question_type` field supporting single, multiple, likert, and open types
- TypeScript discriminated unions provide type safety for all question variants
- Validation functions enforce data integrity for each question type with structured error messages
- Migration script ready for deployment with rollback support
- Backward compatibility maintained - existing questions default to 'single' type

## Task Commits

Each task was committed atomically:

1. **Task 1: Create database migration for question types** - `be6f206` (feat)
2. **Task 2: Extend TypeScript types for question variants** - `bd0ace7` (feat)
3. **Task 3: Add validation functions for question types** - `f628cab` (feat)

**Plan metadata:** (to be committed after SUMMARY.md)

## Files Created/Modified

### Created
- `pb_migrations/07-add_question_types.js` - PocketBase migration adding question_type field to qa_questions collection

### Modified
- `pb_schema.json` - Added question_type field (values: single, multiple, likert, open), changed selected_answer to text type
- `types/qa.ts` - Added QuestionType, discriminated unions (SingleChoiceQuestion, MultipleChoiceQuestion, LikertQuestion, OpenQuestion), corresponding DTOs, and answer types
- `lib/api/qa.ts` - Added QuestionValidationError class, validation functions (validateQuestionData, validateAnswerData, calculatePointsEarned), updated createQuestion and saveAnswer

## Decisions Made

1. **Changed selected_answer field from select to text**
   - Rationale: Single select field cannot support multiple choice (arrays), Likert numbers, or open text. Text field with JSON serialization provides maximum flexibility.
   - Impact: Migration must handle existing data format gracefully

2. **Used discriminated unions instead of optional fields**
   - Rationale: TypeScript discriminated unions provide compile-time type safety based on question_type discriminator. Prevents accessing likert.scale_max on single choice questions.
   - Pattern: `SingleChoiceQuestion | MultipleChoiceQuestion | LikertQuestion | OpenQuestion` with common base fields

3. **Maintained backward compatibility with legacy types**
   - Rationale: Existing UI components use QAQuestion interface. Breaking change would require simultaneous updates across multiple files.
   - Solution: Created QAQuestionLegacy, CreateQAQuestionDtoLegacy types for gradual migration path

4. **Default question_type is 'single'**
   - Rationale: Existing questions are all single-choice format. Default ensures backward compatibility without data migration.
   - Migration: New field required=true with default='single'

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Changed selected_answer field type in schema**
- **Found during:** Task 1 (Database migration creation)
- **Issue:** Plan specified adding question_type field but didn't address selected_answer constraints. Existing select field with fixed values ["a", "b", "c"] cannot support new answer formats (arrays for multiple, numbers for likert, free text for open).
- **Fix:** Changed selected_answer from select to text field in pb_schema.json. Validation layer enforces type-specific constraints instead of database schema.
- **Files modified:** pb_schema.json
- **Verification:** Schema accepts all answer formats, validation functions enforce constraints per question type
- **Committed in:** be6f206 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Schema change was essential for supporting new question types. No scope creep, fundamental requirement for correct operation.

## Issues Encountered

None - all tasks executed as planned.

## User Setup Required

None - no external service configuration required. Migration will be applied when PocketBase restarts or via admin panel.

## Next Phase Readiness

- Database schema ready for migration (question_type field, flexible selected_answer)
- TypeScript types provide compile-time safety for all question variants
- Validation framework ready for UI integration
- QA form UI (07-02) can now build type-safe components for each question type
- WhatsApp integration (07-03) can format messages appropriately for each question type

**Blockers/Concerns:**
- Migration must be deployed before UI components can use new question types
- Existing QA questions will default to 'single' type - no data migration needed
- selected_answer stored as JSON arrays for multiple choice requires UI parsing

---
*Phase: 07-poll-question-types*
*Completed: 2026-04-01*
