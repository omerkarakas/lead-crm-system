# Roadmap: Moka CRM

## Overview

Moka CRM transforms lead-to-customer conversion through automation. We build from foundation infrastructure (auth, basic lead management) to the core differentiator (WhatsApp-first qualification), through communication channels (email, appointments), to nurturing automation (campaigns), and finally to integration polish (webhooks, activity timeline). Each phase delivers a complete, verifiable capability that unblocks the next phase.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Authentication, roles, and basic lead management
- [ ] **Phase 2: WhatsApp & Qualification** - QA system with automated WhatsApp scoring
- [ ] **Phase 3: Email Communication** - Email sending, templates, and manual messaging
- [ ] **Phase 4: Appointments** - Cal.com integration with booking workflow
- [ ] **Phase 5: Campaigns & Nurturing** - Multi-channel sequences and automation
- [ ] **Phase 6: Polish & Integration** - Webhooks, activity timeline, and final touches

## Phase Details

### Phase 1: Foundation

**Goal**: Users can securely log in and manage basic lead information.

**Depends on**: Nothing (first phase)

**Requirements**: AUTH-01 to AUTH-06, LEAD-01 to LEAD-16

**Success Criteria** (what must be TRUE):
1. User can log in with email/password and stay logged in across browser refreshes
2. Admin can create users and assign them roles (Admin, Sales, Marketing)
3. System restricts access based on user role (Admin sees all, Sales limited, Marketing limited)
4. User can create, view, edit, and delete leads with all standard fields (name, phone, email, company, website, message, source, status)
5. User can search leads by name/phone/email and filter by status and tags
6. User can view lead detail page with all information and add notes/tags

**Plans**: TBD

Plans:
- [ ] 01-01: Authentication & user roles
- [ ] 01-02: Lead CRUD operations
- [ ] 01-03: Lead search, filtering, and detail view

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

**Plans**: TBD

Plans:
- [ ] 02-01: QA question builder and management
- [ ] 02-02: WhatsApp integration for Q&A flow
- [ ] 02-03: Lead scoring calculation and display
- [ ] 02-04: WhatsApp message history UI

### Phase 3: Email Communication

**Goal**: Users can send emails manually using templates, system logs all email activity.

**Depends on**: Phase 1 (need leads to send emails to)

**Requirements**: EMAIL-01 to EMAIL-10

**Success Criteria** (what must be TRUE):
1. User can send manual email to lead from UI using email templates
2. Admin can create, edit, and delete email templates with subject, body, and variable support ({{name}}, {{company}}, etc.)
3. System saves sent emails to messages table with delivery status
4. User can view email history on lead detail page

**Plans**: TBD

Plans:
- [ ] 03-01: Email sending via Resend API
- [ ] 03-02: Email template management
- [ ] 03-03: Email history display on lead detail

### Phase 4: Appointments

**Goal**: System integrates with Cal.com for booking, sends confirmations and reminders via WhatsApp.

**Depends on**: Phase 1 (leads), Phase 2 (WhatsApp integration)

**Requirements**: APPT-01 to APPT-14

**Success Criteria** (what must be TRUE):
1. When Cal.com booking webhook is received, system matches to lead by email, creates appointment record, updates lead status to "booked"
2. System sends WhatsApp confirmation after booking and WhatsApp reminder X hours before appointment
3. User can view appointments list filtered by date range with status (scheduled, completed, cancelled)
4. User can manually create, edit, and cancel appointments from UI

**Plans**: TBD

Plans:
- [ ] 04-01: Cal.com webhook integration
- [ ] 04-02: Appointment CRUD and status management
- [ ] 04-03: WhatsApp confirmations and reminders
- [ ] 04-04: Appointment list view with filtering

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
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/3 | Not started | - |
| 2. WhatsApp & Qualification | 0/4 | Not started | - |
| 3. Email Communication | 0/3 | Not started | - |
| 4. Appointments | 0/4 | Not started | - |
| 5. Campaigns & Nurturing | 0/5 | Not started | - |
| 6. Polish & Integration | 0/3 | Not started | - |
