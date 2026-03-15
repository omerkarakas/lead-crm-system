# Phase 6: Polish & Integration - Plan Summary

**Created:** 2026-03-12
**Plans:** 3
**Waves:** 2
**Estimated Duration:** ~30 minutes

## Overview

Phase 6 completes the Moka CRM v1 with three polish and integration features:

1. **Activity Timeline** — Comprehensive lead history aggregation and display
2. **API Webhooks** — External integration endpoints for n8n automation
3. **Quality Status Display** — Consistent lead quality badges across all views

## Plans

### Plan 01: Activity Timeline Aggregation and Display
**Wave:** 1
**Dependencies:** None
**Files:** types/activity.ts, lib/api/activity.ts, components/leads/ActivityTimeline.tsx, app/(dashboard)/leads/[id]/page.tsx

**Tasks:**
1. Create ActivityEvent TypeScript types for all event types
2. Create activity aggregation API that fetches events from multiple collections
3. Create ActivityTimeline component with filters and pagination
4. Integrate timeline into lead detail page

**Success Criteria:**
- Lead detail page displays complete activity timeline
- Timeline shows events chronologically with type-based filters
- Clicking event shows details in expanded view
- Empty state and pagination handled gracefully

### Plan 02: API Webhooks for n8n Integration
**Wave:** 2
**Dependencies:** 06-01
**Files:** app/api/webhooks/leads/route.ts, app/api/webhooks/leads/[id]/route.ts, lib/utils/webhook-auth.ts, types/webhook.ts

**Tasks:**
1. Create webhook TypeScript types (DTOs, responses, errors)
2. Create webhook authentication utilities (API key, HMAC, bearer token)
3. Create lead creation webhook endpoint (POST)
4. Create lead status update webhook endpoint (PATCH)

**Success Criteria:**
- Webhook creates leads with authentication
- Webhook updates lead status with validation
- Proper error responses for all scenarios
- CORS support for cross-origin requests

### Plan 03: Lead Quality Status Display Logic
**Wave:** 2
**Dependencies:** None
**Files:** lib/utils/lead-scoring.ts, components/leads/LeadQualityBadge.tsx, components/leads/ScoreDisplay.tsx, components/leads/LeadList.tsx, app/(dashboard)/leads/[id]/page.tsx

**Tasks:**
1. Create lead scoring utilities with threshold constant
2. Create LeadQualityBadge component with color variants
3. Update ScoreDisplay component with modal breakdown
4. Integrate quality badges into lead list
5. Integrate quality badges into lead detail page

**Success Criteria:**
- Quality status calculated from 80-point threshold
- Color-coded badges (green qualified, yellow pending)
- Score always visible on badges
- Modal shows per-question breakdown
- Consistent display across all views

## Execution Order

```
Wave 1 (parallel):
├── 06-01: Activity Timeline

Wave 2 (parallel):
├── 06-02: API Webhooks (depends on: 06-01)
└── 06-03: Quality Status Display
```

## Requirements Coverage

| Requirement | Plan | Status |
|-------------|------|--------|
| LEAD-10: Activity timeline | 06-01 | Pending |
| LEAD-17: API create lead webhook | 06-02 | Pending |
| LEAD-18: API update status webhook | 06-02 | Pending |
| LEAD-14: Quality status display | 06-03 | Pending |

**Total:** 4 requirements
**Mapped:** 4 requirements

## Quality Gates

Before declaring Phase 6 complete:

- [ ] All 3 plans executed successfully
- [ ] Activity timeline shows all event types
- [ ] Webhooks work with authentication
- [ ] Quality badges display consistently
- [ ] All verification criteria passed
- [ ] No blockers or pending todos

---

*Last updated: 2026-03-12*
