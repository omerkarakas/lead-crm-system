# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2025-03-01)

**Core value:** Lead-to-Customer dönüşümünü otomatize eden tek platform.
**Current focus:** Phase 4.2 - Proposal Management

## Current Position

Phase: 05 of 9 (Phase 5: Campaigns & Nurturing)
Plan: 05 of 6
Status: In progress
Last activity: 2026-03-08 — Campaign performance reporting with visual charts and analytics

Progress: [████████░░] 73% (7/9 phases complete, 41/42 plans targeted)

## Performance Metrics

**Velocity:**

- Total plans completed: 41
- Average duration: 10.1 min
- Total execution time: 5 hours 19 min

**By Phase:**

| Phase                    | Plans     | Total     | Avg/Plan |
|--------------------------|-----------|-----------|----------|
| 01-foundation            | 4 of 4    | 60 min    | 15 min   |
| 02-whatsapp-qualification | 4 of 4    | 62 min    | 15.5 min  |
| 03-email-communication   | 3 of 3    | 17 min    | 5.7 min  |
| 04-appointments          | 4 of 4    | 20 min    | 5 min    |
| 04.1-lead-capture        | 4 of 4    | 46 min    | 11.5 min |
| 04.2-proposal-management | 5 of 5    | 74 min    | 14.8 min |
| 05-campaigns-nurturing   | 5 of 6    | 68 min    | 13.6 min  |

**Recent Trend:**

- Campaign and sequence data models with JSON fields for complex structures
- Audience segment builder with AND/OR operators
- Segment preview functionality with real-time lead count
- Campaign CRUD operations with admin-only access control
- CAN_MANAGE_CAMPAIGNS permission added to admin and marketing roles
- Campaign UI with type selection (email/whatsapp) and segment testing
- Campaign list view with status badges and action dropdown
- Appointment filtering with date range, status, and search
- View toggle between table and card layouts with localStorage persistence
- URL query params for filter state (shareable filtered views)
- Appointment detail modal with action buttons
- Lead detail page appointment history tab (Randevular)
- 30-second auto-refresh for appointment history
- WhatsApp confirmation messages with Turkish formatting
- 24-hour and 2-hour reminder message scheduling
- Cancellation and reschedule notice messaging
- Cron endpoint for automated reminder processing
- Status-based reminder filtering (scheduled only)
- Phone number normalization with +90 country code
- Fire-and-forget messaging pattern for WhatsApp errors
- Appointments collection with Cal.com integration fields
- Cal.com webhook endpoint for booking events
- Phone-first lead matching with email fallback
- Failed booking tracking with null lead_id
- Lead status auto-update to 'booked' on appointment creation
- Score display with breakdown by question and quality badge
- QA answers table showing question/answer/points for each response
- Admin-only manual poll trigger with "Tekrar Gönder" button
- QA scoring section with status timestamps (sent, completed)
- Chat-bubble WhatsApp message history UI with auto-refresh
- Message status badges (sent/delivered/read/failed) with Lucide icons
- Turkish locale timestamps for WhatsApp messages
- 30-second auto-refresh for real-time message updates
- WhatsApp webhook endpoint created for incoming messages
- Background job for delayed poll sending (1 minute after lead creation)
- Poll answer parser supporting multiple formats
- QA answers collection for storing responses
- Green API integration for WhatsApp messaging
- QA questions data model and collection created
- Admin UI for managing QA questions built
- Welcome message configuration implemented
- Permission-based access control for QA management added
- Phase 1 Foundation complete, all 4 plans completed
- User management with RBAC completed
- Permission-based navigation implemented
- Lead list API and UI with search/filter/pagination completed
- Lead CRUD operations with form validation completed
- Lead detail view with notes and tags management completed
- Fixed auth redirect issue in middleware (server-side token validation)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

| Decision | Rationale | Date |
|----------|-----------|------|
| Next.js 14 + TypeScript | App Router, Server Components, RSC, better DX | 2026-03-02 |
| Tailwind CSS + shadcn/ui | Modern styling with pre-built components | 2026-03-02 |
| PocketBase as backend | Self-contained, Go-based, easy deployment | 2026-03-02 |
| Cookie-based auth persistence | Better UX, survives browser refresh | 2026-03-02 |
| Zustand for state management | Lightweight, simple API, no boilerplate | 2026-03-02 |
| Turkish language UI | Target audience language preference | 2026-03-02 |
| Role-based access control (RBAC) | Three roles (Admin, Sales, Marketing) with permission mapping | 2026-03-02 |
| Permission-based navigation | UI elements shown/hidden based on user role | 2026-03-02 |
| Session management | View and revoke active sessions across devices | 2026-03-02 |
| Dashboard route group layout | Consistent layout for protected pages | 2026-03-02 |
| Debounced search input (300ms) | Balance responsiveness with API calls | 2026-03-02 |
| URL query params for filters | Shareable links for filtered views | 2026-03-02 |
| Status badge color variants | Visual feedback for lead states | 2026-03-02 |
| Desktop table + mobile card pattern | Responsive design for lead list | 2026-03-02 |
| Modal-based CRUD operations | Consistent UI for create/edit actions | 2026-03-02 |
| Optimistic UI updates | Better UX with rollback on error | 2026-03-02 |
| Server-side auth validation | Using authRefresh() in middleware for security | 2026-03-02 |
| QA questions data model | PocketBase collection with JSON options/points fields | 2026-03-03 |
| Poll format for WhatsApp | Numbered questions with a/b/c options (30/60/100 points) | 2026-03-03 |
| Quality score threshold | 80 points required for lead qualification | 2026-03-03 |
| Admin-only QA management | Permission-based access control for QA questions | 2026-03-03 |
| Green API integration | WhatsApp messaging via Green API with webhook | 2026-03-03 |
| Poll sending delay | 1 minute delay after lead creation | 2026-03-03 |
| Answer format support | Multiple formats: '1a, 2b', '1a2b', 'ab', 'a b' | 2026-03-03 |
| Quality badge variants | shadcn/ui Badge for qualified/pending status | 2026-03-03 |
| Score breakdown display | Per-question points in ScoreDisplay component | 2026-03-03 |
| Manual poll trigger | Admin-only resend via POST /api/leads/[id]/send-poll | 2026-03-03 |
| Chat-bubble UI pattern | Left=incoming, right=outgoing with status badges | 2026-03-03 |
| WhatsApp auto-refresh | 30-second polling interval for message updates | 2026-03-03 |
| Turkish timestamp format | DD.MM.YYYY HH:MM using Intl.DateTimeFormat | 2026-03-03 |
| Resend email integration | Email API with variable substitution and logging | 2026-03-04 |
| Email template variables | {{variable}} syntax with Turkish translations | 2026-03-04 |
| Email messages collection | PocketBase email logging with status tracking | 2026-03-04 |
| TipTap rich text editor | WYSIWYG editor for email template body content | 2026-03-04 |
| Email template management | Admin-only CRUD with soft delete and test email | 2026-03-04 |
| Soft delete pattern | is_deleted boolean flag for archive/restore functionality | 2026-03-04 |
| Extendable template categories | Text field instead of enum for custom categories | 2026-03-04 |
| Email sending UI with live preview | SendEmailDialog with template selector and variable substitution | 2026-03-04 |
| Quick send functionality | One-click email send with last-used template | 2026-03-04 |
| Tab-based navigation | WhatsApp/Email/Notes tabs on lead detail page | 2026-03-04 |
| Zustand persist middleware | localStorage for last-used template retention | 2026-03-04 |
| Email history list pattern | Minimal info (Date, Subject, Status) with click-to-view modal | 2026-03-04 |
| Email templates permission fix | Allow all authenticated users to view templates (not just admin) | 2026-03-04 |
| Appointments collection schema | PocketBase collection with Cal.com integration fields and optional lead_id | 2026-03-04 |
| Phone-first lead matching | Phone number matching with +90 prefix stripping, email fallback | 2026-03-04 |
| Failed booking tracking | Create appointments with null lead_id for manual reconciliation | 2026-03-04 |
| Webhook idempotency | Check for existing appointment via calcom_booking_id before creating | 2026-03-04 |
| Lead status auto-update | Automatically update lead status to 'booked' when appointment created | 2026-03-04 |
| Campaign JSON field types | PocketBase JSON fields for audience_segment and steps to support nested structures | 2026-03-08 |
| Segment preview functionality | Real-time lead count preview to test audience segments before saving | 2026-03-08 |
| Admin-only campaign management | CAN_MANAGE_CAMPAIGNS permission for admin and marketing roles | 2026-03-08 |
| Campaign soft delete pattern | is_active flag instead of hard deletion for recovery capability | 2026-03-08 |
| Fire-and-forget messaging | Log WhatsApp errors but don't throw to prevent cascade failures | 2026-03-04 |
| WhatsApp confirmation flow | Send confirmation on appointment creation (manual and webhook) | 2026-03-04 |
| Turkish appointment messages | WhatsApp confirmations/reminders in Turkish with DD.MM.YYYY format | 2026-03-04 |
| 24h and 2h reminders | Automated reminder scheduling with status-based filtering | 2026-03-04 |
| Phone number normalization | Format phone numbers with +90 country code for Green API | 2026-03-04 |
| Optional cron secret | CRON_SECRET env var for production cron endpoint security | 2026-03-04 |
| Default appointment date range | Next 30 days from today for filter default | 2026-03-04 |
| Appointment view toggle | Table/card mode with localStorage persistence | 2026-03-04 |
| Debounced search for appointments | 300ms delay for lead name/phone filtering | 2026-03-04 |
| Appointment detail modal | Full info display with action buttons (edit, cancel, complete) | 2026-03-04 |
| Active filter badges | Individual clear buttons for each active filter | 2026-03-04 |
| Appointment history tab | Randevular tab on lead detail page with 30s auto-refresh | 2026-03-04 |
| RE_APPLY lead status | New status value for tracking duplicate leads from Meta Ads | 2026-03-05 |
| Configurable booking link | Booking link URL stored in app_settings collection, retrieved via async function | 2026-03-05 |
| Admin settings UI | Settings page with dynamic forms for service configuration (Green API, Cal.com, Resend) | 2026-03-05 |
| In-memory config caching | Booking link cached to avoid repeated database queries | 2026-03-05 |
| UTM tracking fields | 6 optional fields (source, medium, campaign, content, term, timestamp) for marketing attribution | 2026-03-05 |
| Duplicate detection logic | Phone OR email matching with flexible handling for web form submissions | 2026-03-05 |
| Duplicate lead updates | Old values stored in message field with Turkish date format, status set to 're-apply' | 2026-03-05 |
| Honeypot spam protection | Hidden 'fax_number' field with invisible styling to trap automated bots | 2026-03-05 |
| Public lead form | /lead-form route with no authentication, Turkish labels, responsive design | 2026-03-05 |
| Meta Ads webhook endpoint | /api/webhooks/meta-ads processes Facebook Lead Ads with field mapping and duplicate handling | 2026-03-05 |
| Shared lead creation helper | createOrUpdateLead() function consolidates duplicate detection logic for webhooks and forms | 2026-03-05 |
| Structured webhook logging | JSON-formatted logs with sanitized data for debugging and monitoring | 2026-03-05 |
| Proposal template management | TipTap/Markdown editors with custom variable system for proposal templates | 2026-03-05 |
| Proposal template permissions | Admin-only access control with CAN_MANAGE_PROPOSAL_TEMPLATES permission | 2026-03-05 |
| Custom variable definitions | JSON-based variable system (name, label, description, default_value) for template extensibility | 2026-03-05 |
| Soft delete for templates | is_deleted flag enables template recovery instead of permanent deletion | 2026-03-05 |
| Turkish date/time formatting | Appointment variables formatted with tr-TR locale for proposal content | 2026-03-05 |
| Proposal variable syntax | {variable} syntax for template substitution (not double braces) | 2026-03-05 |
| Token-based proposal links | Unique 32-character tokens for secure proposal access with expiration | 2026-03-05 |
| Proposal link expiration | 3-day default expiration with configurable option | 2026-03-05 |
| Fire-and-forget proposal sending | Log WhatsApp errors but don't throw to prevent cascade failures | 2026-03-05 |
| Proposal response tracking | Update both proposal record and lead record on response | 2026-03-05 |
| Sales team notifications | WhatsApp notification to sales team on lead response | 2026-03-05 |
| 30-second proposal auto-refresh | Auto-refresh proposal history every 30 seconds for real-time updates | 2026-03-05 |
| Public proposal viewing | No authentication required - token serves as access control | 2026-03-05 |
| Immediate status update | Lead status updates to CUSTOMER/LOST on proposal accept/reject (not wait for appointment) | 2026-03-05 |
| Role-based status override | Admin-only permission for overriding auto-updated status, sales blocked | 2026-03-05 |
| Status automation utilities | updateLeadStatusBasedOnProposal function with reason tracking | 2026-03-05 |
| Force override pattern | Force parameter required for admin to override auto-updated status | 2026-03-05 |
| Proposal status badges | Color-coded badges (green for kabul, red for red) shown throughout UI | 2026-03-05 |
| Auto-update reason display | "(Teklif kabul edildi)" or "(Teklif reddedildi)" shown in lead detail | 2026-03-05 |
| Multi-source sales team phones | Users collection (sales/admin roles) with app_settings override for notifications | 2026-03-05 |
| Sales team notification system | WhatsApp notifications on proposal accept/reject with Turkish messages and emoji | 2026-03-05 |
| Timeline view for proposals | Color-coded status icons (green/yellow/red) with filtering and sorting | 2026-03-05 |
| Proposal history audit trail | Full history tracking with created, responded_at, response, response_comment fields | 2026-03-05 |
| Notification settings configuration | Admin settings page for proposal notifications with test endpoint | 2026-03-05 |
| Single source of truth for sales phones | app_settings only - no users.phone dependency, no SALES_WHATSAPP_NUMBER env var | 2026-03-07 |
| Pre-send validation for proposals | Validate sales phones configured before allowing proposal send | 2026-03-07 |
| Auto-update tracking fields | auto_updated_status boolean and auto_updated_at timestamp for proposal-driven changes | 2026-03-07 |
| Appointment completion no status change | Randevu süreçleri statüyü etkilemez - only proposal responses affect status | 2026-03-07 |
| Admin-only status override | Force checkbox + permission check for auto-updated status changes | 2026-03-07 |
| Zustand persist for builder state | localStorage persistence prevents data loss on page refresh | 2026-03-08 |
| Separate view components for sequence builder | SequenceList (table) and SequenceFlowChart (visual) for different visualization needs | 2026-03-08 |
| Card-based step type selection | Clickable cards with icons for Email/WhatsApp/Delay step types | 2026-03-08 |
| Quick select delay buttons | Preset buttons (15 dk, 1 saat, 1 gün, 1 hafta) for common delay intervals | 2026-03-08 |
| Color-coded step types | Blue (email), green (WhatsApp), gray (delay) consistent across all components | 2026-03-08 |
| View mode toggle persistence | Toggle state persists in builder state for consistent user experience | 2026-03-08 |
| Inline builder mode | When inline=true, hide save/cancel buttons and simplify header for form integration | 2026-03-08 |
| URL-based routing for sequences | Query params (?new, ?edit=id) control sequence page mode | 2026-03-08 |
| Sequence validation in campaign form | Campaign form validates all steps before submission if builder is shown | 2026-03-08 |
| Campaign list sequence display | Sequence count and first sequence name shown in campaign list table | 2026-03-08 |
| Campaign enrollment collection | PocketBase collection with unique constraint on (lead_id, campaign_id) to prevent duplicates | 2026-03-08 |
| Enrollment count tracking | enrollment_count field on leads collection tracks total enrollments | 2026-03-08 |
| Auto-enrollment triggers | QA completion and lead data changes trigger automatic campaign enrollment | 2026-03-08 |
| Fire-and-forget enrollment webhook | Returns 200 OK even on errors to prevent retry storms | 2026-03-08 |
| Dynamic segmentation re-evaluation | ANY lead field change (score, status, tags, source) triggers re-evaluation | 2026-03-08 |
| Preserve existing enrollments | Re-evaluation only adds new enrollments, never removes existing ones | 2026-03-08 |
| Token-based public unsubscribe | 32-character random token for public unsubscribe page access | 2026-03-08 |
| Template custom variables | Extended template variable system to support custom variables like unsubscribe_link | 2026-03-08 |
| Enrollment UI integration | Kampanyalar tab on lead detail page with enrollment count badge | 2026-03-08 |
| Fire-and-forget sequence execution | Log errors but don't throw to prevent cascade failures across enrollments | 2026-03-08 |
| Batch processing for cron | Process enrollments in groups of 50 to avoid timeout limits | 2026-03-08 |
| Auto-refresh monitoring UI | 30-second polling for real-time execution updates | 2026-03-08 |
| Timeline execution history | Vertical timeline with icons and connecting lines for message tracking | 2026-03-08 |
| Relative and absolute delays | Support both X-minutes-after and specific-time scheduling | 2026-03-08 |
| Template custom variables | Extended variable system for unsubscribe_link in templates | 2026-03-08 |
| Manual sequence control | Admin can start sequences or retry failed enrollments | 2026-03-08 |
| Recharts for analytics | Chose recharts over chart.js for React-native design, simpler API, and TypeScript support | 2026-03-08 |
| Campaign analytics API | Comprehensive metrics calculation with 5-minute in-memory caching for performance | 2026-03-08 |
| Email engagement estimation | Using industry averages (20% open, 3% click) since Resend basic tier lacks tracking | 2026-03-08 |
| Multi-dimensional metrics | Delivery, engagement, conversion, and funnel metrics with time-based filtering | 2026-03-08 |
| Lead-level performance | Timeline and list views for enrollment history with stuck enrollment indicators | 2026-03-08 |
| Auto-refresh dashboard | 60-second interval with manual refresh and last updated timestamp | 2026-03-08 |

### Pending Todos

[From .planning/todos/pending/ — ideas captured during sessions]

None yet.

### Blockers/Concerns

[Issues that affect future work]

- **Phase 4 was approved without testing** — Need to verify Lead Scoring, WhatsApp, and Cal.com integrations before Phase 5
- Previous concern resolved: Sequence executor implemented with lib/api/sequence-executor.ts
- Previous concern resolved: Auth redirect issue fixed with server-side token validation
- Previous concern resolved: PocketBase API rules configuration - createdBy nonempty property removed
- Previous concern resolved: PocketBase migrations applied (UTM fields, message field, email optional)
- Notes stored in lead record - may need separate notes collection for Phase 6 (activity timeline)
- No file upload capability yet (needed for lead attachments in future phases)
- Tag autocomplete queries all leads - may need optimization for large datasets
- Welcome message stored in localStorage - consider moving to PocketBase config collection
- Background job uses setTimeout - should use proper job queue (Bull, Faktory, Vercel Cron) for production

### Roadmap Evolution

- **Phase 4.1 redesigned** (2026-03-05): Changed from Testing & Verification to Lead Capture & Pipeline Automation
  - Reason: Testing deferred, critical missing features needed first
  - Focus: Public lead form, booking link settings, status automation, Meta Ads webhook
  - Blocks: Phase 4.2 (Proposal Management) until complete
- **Phase 4.2 inserted** (2026-03-05): Proposal Management after Phase 4.1
  - Reason: Proposal workflow critical for sales process after appointments
  - Focus: Proposal templates, generation, sending, response tracking

## Session Continuity

Last session: 2026-03-08 (Phase 05-05 complete)
Stopped at: Completed campaign performance reporting with visual charts and analytics
Resume file: None
Dev server: Running at http://localhost:3001

**Note**: Phase 05-05 complete - Created comprehensive campaign analytics API with 7 metric functions, built recharts integration for visualizations (bar, line, pie charts), implemented time-based filtering (7d, 30d, 90d, all time), developed lead-level performance view with timeline and list views, added auto-refresh capability (60-second interval), created PerformanceDashboard component orchestrating all analytics, and built /campaigns/[id]/analytics page with breadcrumb navigation.
