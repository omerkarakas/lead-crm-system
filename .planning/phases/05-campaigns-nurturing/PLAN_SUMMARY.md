# Phase 5: Campaigns & Nurturing - Plan Summary

**Created:** 2026-03-08
**Status:** Ready for execution
**Plans:** 5 plans in 5 waves

## Overview

Phase 5 implements multi-channel nurturing campaigns with automated enrollment, sequence execution, and performance reporting. Admins can create email and WhatsApp campaigns with flexible audience segmentation, build visual sequences with delays, automatically enroll leads based on qualification, and track comprehensive performance metrics.

## Plans

### Wave 1: Foundation (05-01)
**Campaign and Sequence Management**
- Create campaigns and sequences PocketBase collections
- Audience segmentation with AND/OR operators
- Segment preview with lead count
- Campaign CRUD with admin-only access
- Campaign management UI

**Dependencies:** None
**Estimate:** 45-60 minutes

### Wave 2: Sequence Builder (05-02)
**Visual Sequence Builder**
- Flow chart and table view toggle
- Step editor modal (email, WhatsApp, delay)
- Drag-and-drop reordering
- Relative and absolute delay scheduling
- Sequence management page

**Dependencies:** 05-01
**Estimate:** 60-90 minutes

### Wave 3: Enrollment Automation (05-03)
**Automatic Lead Enrollment**
- campaign_enrollments collection tracking
- Auto-enrollment on QA completion
- Manual enroll/unenroll endpoints
- Tag/score/status change triggers
- Lead enrollment status display
- Public unsubscribe page

**Dependencies:** 05-01, 05-02
**Estimate:** 60-90 minutes

### Wave 4: Sequence Execution (05-04)
**Sequence Execution Engine**
- sequence_messages tracking collection
- Step processing engine
- Cron endpoint for automated execution
- Delay calculation (relative/absolute)
- Error handling (fire-and-forget)
- Execution log UI
- Monitoring dashboard

**Dependencies:** 05-01, 05-02, 05-03
**Estimate:** 60-90 minutes

### Wave 5: Performance Reporting (05-05)
**Campaign Analytics Dashboard**
- Metrics calculation API
- Summary cards and charts
- Email/WhatsApp engagement metrics
- Conversion tracking
- Time-based filtering
- Lead-level performance views
- Timeline and list views

**Dependencies:** 05-01, 05-02, 05-03, 05-04
**Estimate:** 60-90 minutes

## Key Features

### Campaign Management
- Multi-channel campaigns (email/WhatsApp)
- Complex audience segmentation (score, status, source, tags)
- AND/OR operator combinations
- Segment preview before saving
- Auto-enroll based on minimum score

### Sequence Builder
- Visual flow chart or table view
- Email, WhatsApp, and Delay steps
- Drag-and-drop reordering
- Relative delays (X minutes after previous)
- Absolute delays (specific time)
- Template selection per step

### Enrollment Automation
- Triggers: QA completion, status change, tag change
- Campaign-based auto-enroll settings
- Duplicate prevention (one enrollment per campaign)
- Manual enroll/unenroll for admins
- Public unsubscribe page with campaign selection

### Sequence Execution
- Automated cron-based processing
- Email and WhatsApp message sending
- Fire-and-forget error handling
- Message tracking in sequence_messages
- Execution log with timeline view
- Manual retry and test execution

### Performance Reporting
- Summary metrics (enrollments, completions, failures)
- Channel-specific metrics (email opens, WhatsApp delivery)
- Conversion tracking (status changes)
- Time-based filtering (7d, 30d, 90d, all)
- Visual charts (bar, line, pie)
- Lead-level performance with timeline/list views

## Technical Decisions

### Claude's Discretion Used
- **Drag-and-drop library:** @dnd-kit (modern, TypeScript support, smaller bundle)
- **Chart library:** recharts (React-native, simpler API, sufficient for needs)
- **Timeline design:** Vertical flow with icons and status badges
- **Segmentation preview:** Show count + first 10 sample leads
- **Unsubscribe page:** Clean card layout with Turkish UI

### Implementation Patterns
- Follow existing PocketBase patterns from previous phases
- Use fire-and-forget for WhatsApp errors (don't throw)
- Soft delete pattern for campaigns (is_deleted flag)
- Token-based unsubscribe links (32-char random string)
- Auto-refresh every 30-60 seconds for real-time data
- Turkish language UI throughout

## User Setup Required

None - all dependencies are already installed from previous phases.

**Note:** Plan 05-02 and 05-05 have checkpoint:decision tasks for choosing libraries. If user doesn't provide input, Claude will use recommended options (@dnd-kit and recharts).

## Files Modified

### New Collections
- campaigns
- sequences
- campaign_enrollments
- sequence_messages

### New Type Files
- types/campaign.ts (extended with enrollment and execution types)

### New API Files
- lib/api/campaigns.ts
- lib/api/sequences.ts
- lib/api/enrollments.ts
- lib/api/sequence-executor.ts
- lib/api/campaign-analytics.ts

### New UI Files
- components/campaigns/CampaignForm.tsx
- components/campaigns/CampaignList.tsx
- components/campaigns/SequenceBuilder.tsx
- components/campaigns/SequenceFlowView.tsx
- components/campaigns/SequenceTableView.tsx
- components/campaigns/StepEditor.tsx
- components/campaigns/EnrollmentList.tsx
- components/campaigns/EnrollmentBadge.tsx
- components/campaigns/LeadEnrollments.tsx
- components/campaigns/ExecutionLog.tsx
- components/campaigns/SequenceScheduler.tsx
- components/campaigns/PerformanceDashboard.tsx
- components/campaigns/CampaignMetrics.tsx
- components/campaigns/EnrollmentPerformance.tsx
- components/campaigns/LeadEnrollmentTimeline.tsx
- components/campaigns/LeadPerformanceView.tsx

### New Pages
- app/(dashboard)/campaigns/page.tsx
- app/(dashboard)/campaigns/[id]/sequences/page.tsx
- app/(dashboard)/campaigns/[id]/execution/page.tsx
- app/(dashboard)/campaigns/[id]/analytics/page.tsx
- app/unsubscribe/[token]/page.tsx

### New API Routes
- app/api/campaigns/[id]/enroll/route.ts
- app/api/campaigns/[id]/unenroll/route.ts
- app/api/leads/[id]/enroll/route.ts
- app/api/sequences/[id]/start/route.ts
- app/api/enrollments/[id]/retry/route.ts
- app/api/cron/process-sequence/route.ts
- app/api/webhooks/qa-complete/route.ts
- app/api/unsubscribe/route.ts

## Success Criteria

Phase 5 is complete when:

1. Admin can create email/WhatsApp campaigns with audience segmentation
2. Admin can build multi-step sequences with visual builder
3. Low-score leads auto-enroll after QA completion
4. Sequences execute automatically with proper delays
5. Users can view comprehensive performance metrics
6. Leads can unsubscribe via public link
7. All features use Turkish language UI
8. Permission-based access control enforced

## Next Steps

Execute plans in wave order:
- Wave 1: 05-01 (Campaign Management)
- Wave 2: 05-02 (Sequence Builder)
- Wave 3: 05-03 (Enrollment Automation)
- Wave 4: 05-04 (Sequence Execution)
- Wave 5: 05-05 (Performance Reporting)

Each plan creates a SUMMARY.md after completion.
