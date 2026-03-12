# Phase 6: Polish & Integration - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Activity timeline shows complete lead history (notes, WhatsApp messages, emails, status changes, QA answers, appointments) on lead detail page. API webhooks enable n8n integration for external automation (create leads, update lead status). Lead quality status (qualified/pending) displays correctly based on score threshold (80 points).

</domain>

<decisions>
## Implementation Decisions

### Activity Timeline UI
- **Vertical timeline layout** — Left border line with event cards stacked below
- **Chronological ordering** — No grouping by day, pure chronological sequence
- **Type-based filters** — WhatsApp, Email, Not, Randevu filters available
- **Compact density** — Icon + title + timestamp only, click for details

### Quality Status Display
- **Multiple display locations** — Lead detail header, lead list, everywhere relevant
- **Color badges** — Green (qualified) / Yellow (pending) badge styling
- **Always visible score** — Score value always shown (e.g., 85/100)
- **Modal breakdown** — Click score to see per-question breakdown in modal

### Claude's Discretion
- API webhook authentication method and security approach
- Webhook retry logic and failure handling
- Event types that trigger webhooks
- Webhook payload format (JSON structure)
- Timeline event icon set and styling details
- Empty state handling for timeline
- Timeline pagination/scrolling behavior for large histories

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-polish-integration*
*Context gathered: 2026-03-12*
