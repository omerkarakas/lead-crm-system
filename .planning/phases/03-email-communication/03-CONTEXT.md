# Phase 3: Email Communication - Context

**Gathered:** 2026-03-04
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
- Email attachments (future phase)

</domain>

<decisions>
## Implementation Decisions

### Email Provider
- **Resend API** — Modern, developer-friendly email API with good Next.js integration
- Environment variables: `RESEND_API_KEY`
- From email/name configurable in settings
- Reason: Resend has excellent DX, good React ecosystem support, reasonable pricing

### Email Sending UI
- **Location:** Lead detail page → "Email gönder" button
- **Form fields:** Template selector + editable subject + editable body (flexible approach)
- **Preview:** Live HTML preview shown while composing
- **Quick send:** One-click send option for last-used template
- **Modal/Page layout:** Claude's discretion (modal preferred for quick actions)

### Template Editor
- **Editor type:** Rich text WYSIWYG editor (Word-like visual experience)
- **Variable insertion:** Dropdown/selector for available variables (not manual typing)
- **Test/Preview:** Send test email to own address for validation
- **Categories:** Admin can add new categories beyond base list (Welcome, Follow-up, Qualification, Generic)

### Template Organization
- **Filtering:** Category filter + Name search
- **View toggle:** Table view / Card view — user can switch between them
- **Active/Inactive:** Toggle switch for quick enable/disable
- **Deletion:** Archive (not hard delete) — templates can be restored

### Email History Display
- **Location:** Separate "Email" tab on lead detail page
- **List info:** Minimal — Date, Subject, Status badge
- **Status display:** Colored badge (sent/delivered/failed) — similar to WhatsApp style
- **Content viewing:** Click opens modal with full email content
- **Position:** WhatsApp section → Email tab (same level as other tabs)

### Template Variables
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
- Tab implementation detail (separate tabs vs section-based navigation)
- Rich text editor library choice
- Email preview rendering approach
- Error handling for failed sends (retry logic, user feedback)

</decisions>

<specifics>
## Specific Ideas

- Keep email sending simple — modal dialog for quick actions
- Rich text editor should feel familiar (Word/Google Docs-like)
- Variable insertion should be intuitive — dropdown with descriptions
- Test email feature is important for template validation
- Tab-based navigation on lead detail for clean separation (Info | WhatsApp | Email | Notes)
- Status badges should match WhatsApp visual style for consistency
- Archive instead of delete — prevent accidental template loss
- Table/Card toggle — table for power users, cards for visual browsing

</specifics>

<deferred>
## Deferred Ideas

- Email attachments — future phase
- Automated email sequences/campaigns — Phase 5
- Email delivery tracking via webhooks — Phase 5
- BCC/CC support — future enhancement
- Email reply tracking — future phase
- Email templates with conditional logic — Phase 5
- Bulk email sending — Phase 5

</deferred>

---

*Phase: 03-email-communication*
*Context gathered: 2026-03-04*
