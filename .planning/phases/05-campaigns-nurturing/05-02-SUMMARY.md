---
phase: 05-campaigns-nurturing
plan: 02
subsystem: campaigns
tags: [zustand, sequence-builder, flow-chart, modal-form, turkish-ui]

# Dependency graph
requires:
  - phase: 05-campaigns-nurturing
    plan: 01
    provides: Campaign and Sequence types, campaign API functions, email templates API
provides:
  - Sequence builder TypeScript types and interfaces (BuilderViewMode, SequenceBuilderState, StepFormData, etc.)
  - Zustand store for sequence state management with persist middleware
  - Modal form component for adding/editing sequence steps with template selection
  - Table view component for displaying sequence steps with actions
  - Flow chart visualization component for visual sequence representation
affects: [05-03, sequence-execution, campaign-ui]

# Tech tracking
tech-stack:
  added: [zustand persist middleware for builder state]
  patterns: [modal-based CRUD operations, card-based UI for step type selection, persist middleware for data recovery]

key-files:
  created:
    - types/campaign.ts (builder types)
    - lib/stores/sequences.ts (Zustand store)
    - components/campaigns/SequenceStepForm.tsx (step form modal)
    - components/campaigns/SequenceList.tsx (table view)
    - components/campaigns/SequenceFlowChart.tsx (flow chart view)
  modified: []

key-decisions:
  - "Used Zustand persist middleware for builder state to prevent data loss on refresh"
  - "Separate components for table and flow chart views with view mode toggle"
  - "Card-based step type selection with color coding (blue for email, green for WhatsApp, gray for delay)"
  - "Relative delay with quick select buttons (15 dk, 1 saat, 1 gün, 1 hafta) for UX convenience"

patterns-established:
  - "Modal form pattern: Open with pre-populated data for editing, blank for new items"
  - "Table view pattern: Columns for order, type, content, delay with action buttons"
  - "Flow chart pattern: Vertical layout with connecting arrows and end indicator"
  - "Reorder pattern: Up/down buttons disabled at boundaries with visual feedback"
  - "Delete confirmation pattern: AlertDialog with cancel/confirm actions"

# Metrics
duration: 2min
completed: 2026-03-08
---

# Phase 05: Campaigns & Nurturing - Plan 02 Summary

**Sequence builder foundation with Zustand store, modal step form with template selection, table and flow chart views, and step reordering capabilities**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-08T08:53:45Z
- **Completed:** 2026-03-08T08:55:56Z
- **Tasks:** 5
- **Files modified:** 1 (types/campaign.ts)
- **Files created:** 5

## Accomplishments

- **Builder state management:** Zustand store with persist middleware for data recovery on refresh
- **Step form modal:** Card-based step type selection (Email, WhatsApp, Delay) with template dropdown and delay configuration
- **Table view:** Step list with order, type, content, delay columns and edit/delete/reorder actions
- **Flow chart visualization:** Visual step cards with connecting arrows, color-coded by type, with end indicator
- **Reordering support:** Up/down buttons for moving steps with boundary checking and validation

## Task Commits

Each task was committed atomically:

1. **Task 1: Update Sequence types and add builder-specific interfaces** - `f7dc285` (feat)
2. **Task 2: Create sequence Zustand store** - `caa8b9c` (feat)
3. **Task 3: Create SequenceStepForm modal component** - `26ad735` (feat)
4. **Task 4: Create SequenceList table view component** - `9ce4d1e` (feat)
5. **Task 5: Create flow chart visualization component** - `381d30a` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified

### Created

- `lib/stores/sequences.ts` - Zustand store with builder state, step operations, and persist middleware
- `components/campaigns/SequenceStepForm.tsx` - Modal form for adding/editing steps with type selection and template dropdown
- `components/campaigns/SequenceList.tsx` - Table view with step rows, actions, and reorder controls
- `components/campaigns/SequenceFlowChart.tsx` - Flow chart visualization with step cards and connecting arrows

### Modified

- `types/campaign.ts` - Added builder types (BuilderViewMode, SequenceBuilderState, StepFormData, StepValidationError, ReorderAction)

## Decisions Made

- **Zustand persist middleware:** Used to persist builder state to localStorage, preventing data loss on page refresh
- **Separate view components:** Created separate SequenceList and SequenceFlowChart components for table vs flow chart views, enabling easy toggling
- **Card-based step type selection:** Used clickable cards with icons instead of radio buttons for better UX and visual clarity
- **Quick select buttons for delays:** Added preset buttons (15 dk, 1 saat, 1 gün, 1 hafta) for common delay intervals
- **Color coding by step type:** Blue for email, green for WhatsApp, gray for delay - consistent across all components
- **Delete confirmation:** AlertDialog pattern to prevent accidental deletion

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all components compiled successfully without errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for next phase:**
- Sequence builder UI components complete and ready for integration into campaign detail pages
- Store provides all necessary actions for step management (add, update, delete, reorder)
- Modal form supports both create and edit workflows
- Table and flow chart views provide different visualization options

**Integration points needed:**
- Campaign detail page to use SequenceFlowChart/SequenceList with useSequencesStore
- "Add Step" button to open SequenceStepForm with appropriate stepType context
- View toggle button to switch between flow chart and table modes
- Save/discard buttons to persist or reset builder changes

**No blockers or concerns.**

---
*Phase: 05-campaigns-nurturing*
*Plan: 02*
*Completed: 2026-03-08*
