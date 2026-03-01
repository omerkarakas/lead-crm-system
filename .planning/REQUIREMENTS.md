# Requirements: Moka CRM

**Defined:** 2025-03-01
**Core Value:** Lead-to-Customer dönüşümünü otomatize eden tek platform.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Users

- [ ] **AUTH-01**: User can log in with email and password via PocketBase auth
- [ ] **AUTH-02**: User session persists across browser refresh
- [ ] **AUTH-03**: User can log out from any page
- [ ] **AUTH-04**: Admin can create new users (Admin, Sales, Marketing roles)
- [ ] **AUTH-05**: Admin can assign roles to users
- [ ] **AUTH-06**: System restricts access based on user role

### Lead Management

- [ ] **LEAD-01**: User can create lead manually (name, phone, email, company, website, message, source)
- [ ] **LEAD-02**: User can view lead list with pagination (50 per page)
- [ ] **LEAD-03**: User can search leads by name, phone, email
- [ ] **LEAD-04**: User can filter leads by status (new, qualified, booked, customer, lost)
- [ ] **LEAD-05**: User can filter leads by tags
- [ ] **LEAD-06**: User can view lead detail page with all information
- [ ] **LEAD-07**: User can edit lead information
- [ ] **LEAD-08**: User can delete lead (with confirmation)
- [ ] **LEAD-09**: User can add notes to lead
- [ ] **LEAD-10**: System displays lead activity timeline (notes, messages, status changes)
- [ ] **LEAD-11**: User can add tags to lead
- [ ] **LEAD-12**: User can remove tags from lead
- [ ] **LEAD-13**: System displays lead score (calculated from QA answers)
- [ ] **LEAD-14**: System displays lead quality (pending/qualified based on score threshold)
- [ ] **LEAD-15**: User can change lead status manually
- [ ] **LEAD-16**: System records lead source (web_form, api, manual, whatsapp)
- [ ] **LEAD-17**: API can create lead via webhook (for n8n integration)
- [ ] **LEAD-18**: API can update lead status (for n8n automation)

### Lead Qualification

- [ ] **QUAL-01**: Admin can create QA question (question text, answer options, scoring rules, weight)
- [ ] **QUAL-02**: Admin can edit QA question
- [ ] **QUAL-03**: Admin can delete QA question
- [ ] **QUAL-04**: Admin can set answer options with point values
- [ ] **QUAL-05**: Admin can define scoring rules (answer → points mapping)
- [ ] **QUAL-06**: Admin can set question weight for scoring
- [ ] **QUAL-07**: Admin can activate/deactivate questions
- [ ] **QUAL-08**: System displays list of QA questions
- [ ] **QUAL-09**: System sends first QA question via WhatsApp when lead is created (n8n integration)
- [ ] **QUAL-10**: System receives WhatsApp answer and calculates score
- [ ] **QUAL-11**: System saves QA answer with timestamp
- [ ] **QUAL-12**: System updates lead total score after each answer
- [ ] **QUAL-13**: System sends next question if available
- [ ] **QUAL-14**: System sends Cal.com link if score exceeds threshold (high score)
- [ ] **QUAL-15**: System sends "received" message if score below threshold (low score)
- [ ] **QUAL-16**: User can view lead's QA answers on lead detail page
- [ ] **QUAL-17**: User can view lead's score breakdown per question

### WhatsApp Communication

- [ ] **WHATS-01**: System receives incoming WhatsApp messages via Green API webhook
- [ ] **WHATS-02**: System matches incoming message to lead by phone number
- [ ] **WHATS-03**: System saves incoming message to messages table
- [ ] **WHATS-04**: System can send WhatsApp message via Green API
- [ ] **WHATS-05**: User can view WhatsApp conversation history on lead detail page
- [ ] **WHATS-06**: User can send manual WhatsApp message to lead from UI
- [ ] **WHATS-07**: System displays message direction (incoming/outgoing)
- [ ] **WHATS-08**: System displays message status (sent, delivered, failed)
- [ ] **WHATS-09**: System logs all WhatsApp messages (automated and manual)
- [ ] **WHATS-10**: System handles unknown sender messages (no matching lead)

### Email Communication

- [ ] **EMAIL-01**: System can send email via Resend API
- [ ] **EMAIL-02**: User can send manual email to lead from UI
- [ ] **EMAIL-03**: User can use email template when sending manual email
- [ ] **EMAIL-04**: System saves sent email to messages table
- [ ] **EMAIL-05**: User can view email history on lead detail page
- [ ] **EMAIL-06**: Admin can create email template (subject, body, variables)
- [ ] **EMAIL-07**: Admin can edit email template
- [ ] **EMAIL-08**: Admin can delete email template
- [ ] **EMAIL-09**: System supports template variables ({{name}}, {{company}}, etc.)
- [ ] **EMAIL-10**: System displays email delivery status

### Appointments

- [ ] **APPT-01**: System receives Cal.com booking webhook
- [ ] **APPT-02**: System matches booking to lead by email
- [ ] **APPT-03**: System creates appointment record (lead_id, scheduled_at, duration, meeting_url)
- [ ] **APPT-04**: System updates lead status to "booked" after appointment created
- [ ] **APPT-05**: System sends WhatsApp confirmation after booking
- [ ] **APPT-06**: User can view appointments list filtered by date range
- [ ] **APPT-07**: User can view appointment details on lead detail page
- [ ] **APPT-08**: System calculates reminder time (configurable hours before)
- [ ] **APPT-09**: System sends WhatsApp reminder X hours before appointment
- [ ] **APPT-10**: System marks reminder as sent after sending
- [ ] **APPT-11**: User can manually create appointment for lead
- [ ] **APPT-12**: User can edit appointment details
- [ ] **APPT-13**: User can cancel appointment (updates status)
- [ ] **APPT-14**: System displays appointment status (scheduled, completed, cancelled)

### Campaign & Nurturing

- [ ] **CAMP-01**: Admin can create email campaign (name, description)
- [ ] **CAMP-02**: Admin can create WhatsApp campaign (name, description)
- [ ] **CAMP-03**: Admin can define audience segment for campaign (filter criteria)
- [ ] **CAMP-04**: Admin can create time-based sequence (series of messages)
- [ ] **CAMP-05**: Admin can add step to sequence (channel: email/WhatsApp, delay, template)
- [ ] **CAMP-06**: Admin can edit sequence step
- [ ] **CAMP-07**: Admin can delete sequence step
- [ ] **CAMP-08**: Admin can reorder sequence steps
- [ ] **CAMP-09**: System supports message delays (e.g., "send 3 days after previous step")
- [ ] **CAMP-10**: System can assign sequence to lead
- [ ] **CAMP-11**: System automatically enrolls low-score leads to nurturing sequence
- [ ] **CAMP-12**: System sends sequence messages based on schedule
- [ ] **CAMP-13**: System tracks which messages sent to each lead
- [ ] **CAMP-14**: User can view lead's campaign enrollment status
- [ ] **CAMP-15**: User can view campaign performance stats (total sent, delivered, failed)
- [ ] **CAMP-16**: User can manually enroll lead to sequence
- [ ] **CAMP-17**: User can manually unsubscribe lead from sequence

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Reporting & Analytics

- **ANAL-01**: Dashboard displays lead funnel (new → qualified → booked → customer)
- **ANAL-02**: Dashboard displays conversion rates by stage
- **ANAL-03**: Dashboard displays lead source attribution
- **ANAL-04**: Dashboard displays QA performance (answer distribution, score distribution)
- **ANAL-05**: Dashboard displays campaign stats (open rate, click rate, conversion)
- **ANAL-06**: User can export lead data to CSV
- **ANAL-07**: User can view date-range filtered reports

### Multi-Tenant / White-Label

- **TENANT-01**: System supports multiple customer instances
- **TENANT-02**: Each customer has separate PocketBase database
- **TENANT-03**: Customer can set custom logo
- **TENANT-04**: Customer can set custom colors (primary, secondary)
- **TENANT-05**: Customer can set custom company name
- **TENANT-06**: Customer accesses via subdomain (tenant-name.mokacrm.com)
- **TENANT-07**: Admin can create new customer instance
- **TENANT-08**: Admin can view all customer instances
- **TENANT-09**: System provisions customer database on signup

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Billing/Subscription Management | v1'de manuel abone yönetimi, faturalama sistemi v2'de |
| Mobile Apps (iOS/Android) | v1 sadece web, responsive design yeterli |
| Voice/VOIP Integration | v1'de sadece WhatsApp/Email |
| Social Media Integration | v2'de |
| Visual Campaign Builder | v1'de simple sequence builder yeterli |
| Behavior-Based Triggers | v1'de time-based sequences yeterli |
| Predictive Lead Scoring | v1'de rule-based scoring yeterli |
| Custom Domain Mapping | v1'de subdomain yeterli |
| Advanced Analytics | v1'de temel listeler yeterli, dashboard v2'de |
| Multi-Language | v1 Türkçe, İngilizce v2'de |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 to AUTH-06 | Phase 1 | Pending |
| LEAD-01 to LEAD-16 | Phase 1 | Pending |
| LEAD-17, LEAD-18 | Phase 2 | Pending |
| QUAL-01 to QUAL-17 | Phase 2 | Pending |
| WHATS-01 to WHATS-10 | Phase 2 | Pending |
| EMAIL-01 to EMAIL-10 | Phase 3 | Pending |
| APPT-01 to APPT-14 | Phase 4 | Pending |
| QUAL-14, QUAL-15, CAMP-01 to CAMP-17 | Phase 5 | Pending |
| LEAD-09, LEAD-10, LEAD-13, LEAD-14 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 98 total
- Mapped to phases: 98
- Unmapped: 0 ✓

---
*Requirements defined: 2025-03-01*
*Last updated: 2025-03-01 after roadmap creation*
