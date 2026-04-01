# Roadmap: Moka CRM

## Overview

Moka CRM transforms lead-to-customer conversion through automation. We build from foundation infrastructure (auth, basic lead management) to the core differentiator (WhatsApp-first qualification), through communication channels (email, appointments), to nurturing automation (campaigns), and finally to integration polish (webhooks, activity timeline).

## Milestones

- ✅ **v1.0 MVP** — Phases 1-6 (shipped 2026-03-15)
- 🚧 **v1.0.1** — Phases 7-8 (in progress)
- 📋 **v1.1** — Performance, analytics, reporting (planned)

---

<details>
<summary>✅ v1.0 MVP (Phases 1-6) — SHIPPED 2026-03-15</summary>

**Full roadmap archived:** [milestones/v1.0-ROADMAP.md](.planning/milestones/v1.0-ROADMAP.md)

**Quick summary:**
- Phase 1: Foundation (4 plans) — Authentication, RBAC, lead CRUD
- Phase 2: WhatsApp & Qualification (4 plans) — QA system, automated scoring
- Phase 3: Email Communication (3 plans) — Email templates, sending
- Phase 4: Appointments (4 plans) — Cal.com integration, reminders
- Phase 4.1: Lead Capture (4 plans) — Public form, Meta Ads webhook
- Phase 4.2: Proposal Management (5 plans) — Templates, sending, tracking
- Phase 5: Campaigns & Nurturing (6 plans) — Sequences, enrollment, analytics
- Phase 6: Polish & Integration (3 plans) — Activity timeline, webhooks, quality badges

</details>

---

## 🚧 v1.0.1 Poll Question Types (In Progress)

**Milestone Goal:** Extend WhatsApp QA system with new question types (multiple choice, Likert scale, open-ended) and inline button support for better lead qualification flexibility.

### Phase 7: Poll Question Types
**Goal**: Admins can create and use multiple poll question types beyond single-answer format
**Depends on**: v1.0 MVP (Phases 1-6 complete)
**Requirements**: POLL-01, POLL-02, POLL-03, POLL-04, POLL-05, POLL-07, POLL-08, POLL-09, POLL-10
**Success Criteria** (what must be TRUE):
  1. Admin can create multiple choice questions where leads select more than one option
  2. Admin can create Likert scale questions (1-5 rating) with automatic scoring
  3. Admin can create open-ended questions with free text input
  4. System correctly processes and scores responses for all question types
  5. Open-ended answers receive automatic scores based on answer length/quality
**Plans**: TBD

Plans:
- [ ] 07-01: Question type data model and validation
- [ ] 07-02: Admin UI for creating new question types
- [ ] 07-03: Response processing and scoring logic

### Phase 8: WhatsApp Inline Buttons
**Goal**: Leads can respond to polls using native WhatsApp inline buttons for better UX
**Depends on**: Phase 7
**Requirements**: POLL-06
**Success Criteria** (what must be TRUE):
  1. Poll messages display with interactive inline buttons instead of text-only responses
  2. Button clicks are captured and processed as poll answers
  3. All question types work with inline buttons (single/multiple choice, Likert)
  4. Fallback to text responses for WhatsApp accounts that don't support buttons
**Plans**: TBD

Plans:
- [ ] 08-01: Green API inline button integration
- [ ] 08-02: Button layout and configuration for question types
- [ ] 08-03: Button response handling and fallback logic

---

## 📋 v1.1 Performance & Analytics (Planned)

Coming soon...

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 4/4 | ✅ Complete | 2026-03-02 |
| 2. WhatsApp & Qualification | v1.0 | 4/4 | ✅ Complete | 2026-03-03 |
| 3. Email Communication | v1.0 | 3/3 | ✅ Complete | 2026-03-04 |
| 4. Appointments | v1.0 | 4/4 | ✅ Complete | 2026-03-04 |
| 4.1 Lead Capture | v1.0 | 4/4 | ✅ Complete | 2026-03-05 |
| 4.2 Proposal Management | v1.0 | 5/5 | ✅ Complete | 2026-03-07 |
| 5. Campaigns & Nurturing | v1.0 | 6/6 | ✅ Complete | 2026-03-08 |
| 6. Polish & Integration | v1.0 | 3/3 | ✅ Complete | 2026-03-12 |
| 7. Poll Question Types | v1.0.1 | 0/3 | Not started | - |
| 8. WhatsApp Inline Buttons | v1.0.1 | 0/3 | Not started | - |
