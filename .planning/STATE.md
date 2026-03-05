# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2025-03-01)

**Core value:** Lead-to-Customer dönüşümünü otomatize eden tek platform.
**Current focus:** Phase 4 - Appointments

## Current Position

Phase: 4.1 of 9 (Phase 4.1: Lead Capture & Pipeline Automation - INSERTED)
Plan: 02 of 4 (in progress)
Status: Wave 1 execution
Last activity: 2026-03-05 — Completed 04.1-02: Booking link configuration

Progress: [███████░░░] 50% (4/9 phases complete, 23/26 plans targeted)

## Performance Metrics

**Velocity:**

- Total plans completed: 23
- Average duration: 11 min
- Total execution time: 2 hours 39 min

**By Phase:**

| Phase                    | Plans     | Total     | Avg/Plan |
|--------------------------|-----------|-----------|----------|
| 01-foundation            | 4 of 4    | 60 min    | 15 min   |
| 02-whatsapp-qualification | 4 of 4    | 62 min    | 15.5 min  |
| 03-email-communication   | 3 of 3    | 17 min    | 5.7 min  |
| 04-appointments          | 4 of 4    | 20 min    | 5 min    |

**Recent Trend:**

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

### Pending Todos

[From .planning/todos/pending/ — ideas captured during sessions]

None yet.

### Blockers/Concerns

[Issues that affect future work]

- **Phase 4 was approved without testing** — Need to verify Lead Scoring, WhatsApp, and Cal.com integrations before Phase 5
- Previous concern resolved: Auth redirect issue fixed with server-side token validation
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

Last session: 2026-03-05 (Phase 4.1 Plan 02 completed)
Stopped at: Completed 04.1-02 - Booking link configuration
Resume file: None
Dev server: Running at http://localhost:3000

**Note**: Phase 4.1 in progress - Booking link now configurable via admin settings.
