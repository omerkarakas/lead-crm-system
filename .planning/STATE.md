# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2025-03-01)

**Core value:** Lead-to-Customer dönüşümünü otomatize eden tek platform.
**Current focus:** Phase 3 - Email Communication

## Current Position

Phase: 3 of 6 (Email Communication)
Plan: 3 of 3
Status: Complete ✅
Last activity: 2026-03-04 — Completed Phase 3: Email Communication

Progress: [████████████] 50% (3/6 phases complete, 18/24 plans complete)

## Performance Metrics

**Velocity:**

- Total plans completed: 13
- Average duration: 11 min
- Total execution time: 2 hours 19 min

**By Phase:**

| Phase                    | Plans     | Total     | Avg/Plan |
|--------------------------|-----------|-----------|----------|
| 01-foundation            | 4 of 4    | 60 min    | 15 min   |
| 02-whatsapp-qualification | 4 of 4    | 62 min    | 15.5 min  |
| 03-email-communication   | 2 of TBD  | 17 min    | 8.5 min  |

**Recent Trend:**

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

### Pending Todos

[From .planning/todos/pending/ — ideas captured during sessions]

None yet.

### Blockers/Concerns

[Issues that affect future work]

- None currently blocking
- Previous concern resolved: Auth redirect issue fixed with server-side token validation
- Notes stored in lead record - may need separate notes collection for Phase 6 (activity timeline)
- No file upload capability yet (needed for lead attachments in future phases)
- Tag autocomplete queries all leads - may need optimization for large datasets
- Welcome message stored in localStorage - consider moving to PocketBase config collection
- Background job uses setTimeout - should use proper job queue (Bull, Faktory, Vercel Cron) for production

## Session Continuity

Last session: 2026-03-04 (Phase 3 Plan 3: Email Sending UI and History)
Stopped at: Completed 03-03 - Email Sending UI and History
Resume file: None
Dev server: Running at http://localhost:3000

**Note**: Phase 3 complete. Next phase: Appointments (Cal.com integration).
