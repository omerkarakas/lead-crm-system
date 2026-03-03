# Phase 3: Email Communication - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can send manual emails to leads using templates, admins can manage email templates, and all email activity is logged to the messages table for history viewing on lead detail pages.

This phase covers:
- Manual email sending from UI using templates
- Email template CRUD (create, read, update, delete) for admins
- Variable substitution in templates ({{name}}, {{company}}, etc.)
- Email logging to messages table with delivery status
- Email history display on lead detail page

**Out of scope:**
- Automated email sequences (Phase 5)
- Email campaigns (Phase 5)
- Email attachments/future phases

</domain>

<decisions>
## Implementation Decisions

### Email Provider
- **Resend API** — Modern, developer-friendly email API with good Next.js integration
- Environment variables: `RESEND_API_KEY`
- From email/name configurable in settings
- Reason: Resend has excellent DX, good React ecosystem support, reasonable pricing

### Email UI Pattern
- **Send from lead detail page** — "Email gönder" button on lead detail opens a modal/dialog
- Modal includes: template selector, subject (editable), body (editable with preview), send button
- **Template management** — Admin-only page at `/admin/email-templates`
- Email history section on lead detail (below WhatsApp section, above notes)

### Template Management
- PocketBase collection: `email_templates`
- Fields: name, subject, body, category, is_active, created_at, updated_at
- Categories: welcome, follow_up, qualification, generic (expandable)
- Admin UI: Table with actions (edit, delete, toggle active), create button opens modal
- Template variables use `{{variable}}` syntax (e.g., `{{name}}`, `{{company}}`)

### Variables & Placeholders
Supported template variables:
- `{{name}}` — Lead's full name
- `{{first_name}}` — Lead's first name (derived from name)
- `{{company}}` — Lead's company
- `{{email}}` — Lead's email
- `{{phone}}` — Lead's phone
- `{{website}}` — Lead's website
- `{{message}}` — Lead's original message
- `{{source}}` — Lead source (web_form, api, manual, whatsapp)
- `{{status}}` — Lead's current status

### Email Logging
- Save to `messages` collection (reuse existing or create email_messages)
- Fields: lead_id, direction (outgoing), subject, body, template_id, status (sent, delivered, failed), sent_at
- Status tracking: Resend provides delivery status via webhooks (Phase 5 enhancement)
- Display in email history section on lead detail page

### Claude's Discretion
- Exact modal layout and styling (shadcn/ui Dialog pattern)
- Email template preview rendering (rich text vs plain text)
- Error handling for failed sends (retry logic, user feedback)
- Template categories organization (tags vs dropdown vs separate lists)

</decisions>

<specifics>
## Specific Ideas

- Keep email sending simple — modal dialog, not a full page
- Templates should feel like WhatsApp questions — simple CRUD with table view
- Email history should match WhatsApp conversation style visually (but no bubbles, just list)
- Turkish language support for template content
- Resend API is simple: `POST https://api.resend.com/emails` with `{ from, to, subject, html }`

</specifics>

<deferred>
## Deferred Ideas

- Email attachments — future phase
- Automated email sequences/campaigns — Phase 5
- Email delivery tracking via webhooks — Phase 5
- BCC/CC support — future enhancement
- Email reply tracking — future phase
- Rich text editor for templates — Phase 5 (plain text/Markdown for now)

</deferred>

---

*Phase: 03-email-communication*
*Context gathered: 2026-03-03*
