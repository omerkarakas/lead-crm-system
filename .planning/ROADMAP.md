# Roadmap: Moka CRM

## Overview

Moka CRM transforms lead-to-customer conversion through automation. We build from foundation infrastructure (auth, basic lead management) to the core differentiator (WhatsApp-first qualification), through communication channels (email, appointments), to nurturing automation (campaigns), and finally to integration polish (webhooks, activity timeline). Each phase delivers a complete, verifiable capability that unblocks the next phase.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Authentication, roles, and basic lead management ✅ Completed 2026-03-02
- [x] **Phase 2: WhatsApp & Qualification** - QA system with automated WhatsApp scoring ✅ Completed 2026-03-03
- [x] **Phase 3: Email Communication** - Email sending, templates, and manual messaging ✅ Completed 2026-03-04
- [x] **Phase 4: Appointments** - Cal.com integration with booking workflow ✅ Completed 2026-03-04
- [x] **Phase 4.1: Lead Capture & Pipeline Automation** - Public form, booking link settings, Meta Ads webhook ✅ Completed 2026-03-05
- [ ] **Phase 4.2: Proposal Management** - Proposal templates, sending, response tracking
- [ ] **Phase 5: Campaigns & Nurturing** - Multi-channel sequences and automation
- [ ] **Phase 6: Polish & Integration** - Webhooks, activity timeline, and final touches

## Phase Details

### Phase 1: Foundation

**Goal**: Users can securely log in and manage basic lead information.

**Depends on**: Nothing (first phase)

**Requirements**: AUTH-01 to AUTH-06, LEAD-01 to LEAD-16

**Success Criteria** (what must be TRUE):
1. User can log in with email/password and stay logged in across browser refreshes
2. User can reset password via email link
3. User can view and revoke active sessions on other devices
4. Admin can create users and assign them roles (Admin, Sales, Marketing)
5. System restricts access based on user role (Admin sees all, Sales limited, Marketing limited)
6. User can create, view, edit, and delete leads with all standard fields (name, phone, email, company, website, message, source, status)
7. User can search leads by name/phone/email and filter by status and tags
8. User can view lead detail page with all information and add notes/tags

**Plans**: 4 plans in 4 waves

Plans:
- [x] 01-01-PLAN.md — Foundation setup & authentication (Next.js 14 + PocketBase, email/password + OAuth, password reset) ✅
- [x] 01-02-PLAN.md — User management & RBAC (Admin can create users, assign roles, device management) ✅
- [x] 01-03a-PLAN.md — Lead API & list view (CRUD API, search, filtering, pagination) ✅
- [x] 01-03b-PLAN.md — Lead form & detail view (create/edit forms, detail page, notes, tags) ✅

### Phase 2: WhatsApp & Qualification

**Goal**: System automatically qualifies leads via WhatsApp Q&A and scores them.

**Depends on**: Phase 1 (need leads and users to manage qualification)

**Requirements**: LEAD-17, LEAD-18, QUAL-01 to QUAL-17, WHATS-01 to WHATS-10

**Success Criteria** (what must be TRUE):
1. Admin can create QA questions with answer options, point values, weights, and activate/deactivate them
2. When lead is created, system sends first QA question via WhatsApp (Green API integration)
3. When lead responds via WhatsApp, system receives answer, calculates score, saves answer with timestamp, and sends next question
4. System displays lead's total score, quality status (qualified/pending), and score breakdown per question on lead detail page
5. User can view full WhatsApp conversation history on lead detail page with message direction (incoming/outgoing) and status

**Plans**: 4 plans in 4 waves

Plans:

- [x] 02-01-PLAN.md — QA question builder & data model (PocketBase collection, admin UI, welcome message config) ✅
- [x] 02-02-PLAN.md — WhatsApp integration & QA flow engine (webhook, background job, poll sender, answer parser) ✅
- [x] 02-03-PLAN.md — Lead scoring display & completion flow (score display, quality badge, answers table, manual trigger) ✅
- [x] 02-04-PLAN.md — WhatsApp message history UI (chat-bubble interface, status badges, auto-refresh) ✅

### Phase 3: Email Communication

**Goal**: Users can send emails manually using templates, system logs all email activity.

**Depends on**: Phase 1 (need leads to send emails to)

**Requirements**: EMAIL-01 to EMAIL-10

**Success Criteria** (what must be TRUE):
1. User can send manual email to lead from UI using email templates
2. Admin can create, edit, and delete email templates with subject, body, and variable support ({{name}}, {{company}}, etc.)
3. System saves sent emails to messages table with delivery status
4. User can view email history on lead detail page

**Plans**: 3 plans in 2 waves

Plans:
- [x] 03-01-PLAN.md — Resend email integration with variable substitution and logging ✅
- [x] 03-02-PLAN.md — Email template management (admin-only CRUD) ✅
- [x] 03-03-PLAN.md — Email sending UI and history display on lead detail ✅

### Phase 4: Appointments

**Goal**: System integrates with Cal.com for booking, sends confirmations and reminders via WhatsApp.

**Depends on**: Phase 1 (leads), Phase 2 (WhatsApp integration)

**Requirements**: APPT-01 to APPT-14

**Success Criteria** (what must be TRUE):
1. When Cal.com booking webhook is received, system matches to lead by email, creates appointment record, updates lead status to "booked"
2. System sends WhatsApp confirmation after booking and WhatsApp reminder X hours before appointment
3. User can view appointments list filtered by date range with status (scheduled, completed, cancelled)
4. User can manually create, edit, and cancel appointments from UI

**Plans**: 4 plans in 4 waves

Plans:
- [x] 04-01-PLAN.md — Cal.com webhook integration (appointments collection, webhook endpoint, lead matching) ✅
- [x] 04-02-PLAN.md — Appointment CRUD and status management (API endpoints, form, list view, manual appointments) ✅
- [x] 04-03-PLAN.md — WhatsApp confirmations and reminders (message templates, automated sending, cron job) ✅
- [x] 04-04-PLAN.md — Appointment list view with filtering (advanced filters, view toggle, detail modal, lead integration) ✅

### Phase 4.1: Lead Capture & Pipeline Automation (INSERTED)

**Goal**: Public lead form, configurable booking link, and Meta Ads webhook integration.

**Depends on**: Phase 4 (Appointments)

**Success Criteria** (what must be TRUE):
1. Public can submit leads via web form (name, phone, email, company, message)
2. Admin can configure booking link URL from settings UI (not hardcoded)
3. Meta Ads webhook can create leads via Facebook Lead Ads integration
4. Duplicate lead submissions update existing record with 're-apply' status

**Focus Areas**:
- Lead Capture: Public form with validation, source tracking, honeypot spam protection
- Settings Integration: Booking URL in app_settings, admin UI configuration
- Meta Ads Integration: Facebook Lead Ads webhook endpoint
- Status Enhancement: New 're-apply' status for duplicate leads

**Plans**: 4 plans in 3 waves

Plans:
- [x] 04.1-01-PLAN.md — Add 're-apply' status to LeadStatus enum and update all UI components ✅
- [x] 04.1-02-PLAN.md — Booking link settings integration (database field, remove hardcoded, admin UI) ✅
- [x] 04.1-03-PLAN.md — Public lead capture form (page, validation, UTM tracking, duplicate handling, honeypot) ✅
- [x] 04.1-04-PLAN.md — Meta Ads webhook integration (Facebook Lead Ads endpoint, payload transformation) ✅

**Reason for Insertion**: Complete lead-to-customer flow before testing phase. Missing pieces: public form, configurable booking link, Meta Ads integration.

### Phase 4.2: Proposal Management (INSERTED)

**Goal**: Sales can create, send, and track proposals with document templates and response tracking.

**Depends on**: Phase 4.1 (lead capture complete)

**Success Criteria** (what must be TRUE):
1. Admin can create proposal templates with variable support ({{company}}, {{budget}}, etc.)
2. Sales can generate proposal from template and send unique link to lead via WhatsApp
3. Lead's response status is tracked (CEVAP_BEKLENIYOR / KABUL / RED)
4. Lead records show offer_document_url, offer_date, offer_response, offer_responded_at
5. When appointment completes, lead status auto-updates to CUSTOMER or LOST (based on proposal response)

**Focus Areas**:
- Proposal Templates: CRUD for templates with TipTap editor, variable system
- Proposal Generation: Template → filled content → unique link generation
- Response Tracking: Lead status update on response, response timestamp
- Status Automation: Appointment completion triggers lead status update (CUSTOMER/LOST)
- UI Integration: "Teklif" tab on appointment detail/lead detail

**Plans**: 5 plans in 3 waves

Plans:
- [x] 04.2-01-PLAN.md — Proposal template management (collection, UI, editor) ✅
- [x] 04.2-02-PLAN.md — Proposal generation and sending (fill variables, generate link, WhatsApp send) ✅
- [x] 04.2-03-PLAN.md — Response tracking and sales team notifications ✅
- [x] 04.2-04-PLAN.md — Status automation (appointment completion → CUSTOMER/LOST) and UI integration ✅
- [x] 04.2-05-PLAN.md — Fix sales team phone notification approach (remove users.phone dependency, single source of truth) ✅

**Reason for Insertion**: Proposal workflow is critical part of sales process after appointment booking.

### Phase 5: Campaigns & Nurturing

**Goal**: Admins can create multi-channel sequences that automatically nurture leads based on qualification score.

**Depends on**: Phase 2 (qualification score), Phase 3 (email), Phase 4 (appointments - full pipeline context)

**Requirements**: QUAL-14, QUAL-15, CAMP-01 to CAMP-17

**Success Criteria** (what must be TRUE):
1. Admin can create email/WhatsApp campaigns with audience segments and time-based sequences
2. Admin can add steps to sequences (channel, delay, template) and reorder them
3. System automatically enrolls low-score leads to nurturing sequence after qualification completes
4. System sends sequence messages based on schedule with proper delays between steps
5. User can view lead's campaign enrollment status and campaign performance stats

**Plans**: TBD

Plans:
- [ ] 05-01: Campaign and sequence management
- [ ] 05-02: Sequence builder (steps, delays, reordering)
- [ ] 05-03: Automatic lead enrollment based on qualification
- [ ] 05-04: Sequence execution engine with scheduling
- [ ] 05-05: Campaign enrollment and performance views

### Phase 6: Polish & Integration

**Goal**: Activity timeline shows complete lead history, webhooks enable n8n integration.

**Depends on**: Phase 5 (all features complete, need comprehensive timeline)

**Requirements**: LEAD-09, LEAD-10, LEAD-13, LEAD-14

**Success Criteria** (what must be TRUE):
1. Lead detail page displays complete activity timeline (notes, WhatsApp messages, emails, status changes, QA answers, appointments)
2. API webhooks allow n8n to create leads and update lead status for external automation
3. Lead quality status (qualified/pending) displays correctly based on score threshold

**Plans**: TBD

Plans:
- [ ] 06-01: Activity timeline aggregation and display
- [ ] 06-02: API webhooks for n8n integration
- [ ] 06-03: Lead quality status display logic

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 4.1 → 4.2 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 4/4 | ✅ Complete | 2026-03-02 |
| 2. WhatsApp & Qualification | 4/4 | ✅ Complete | 2026-03-03 |
| 3. Email Communication | 3/3 | ✅ Complete | 2026-03-04 |
| 4. Appointments | 4/4 | ✅ Complete | 2026-03-04 |
| 4.1 Lead Capture & Pipeline | 4/4 | ✅ Complete | 2026-03-05 |
| 4.2 Proposal Management | 5/5 | ✅ Complete | 2026-03-07 |
| 5. Campaigns & Nurturing | 0/5 | Not started | - |
| 6. Polish & Integration | 0/3 | Not started | - |
