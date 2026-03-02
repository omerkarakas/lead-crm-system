---
phase: 01-foundation
plan: 03b
type: execute
wave: 4
depends_on: [01-03a]
files_modified:
  - src/views/LeadsView.vue
  - src/views/LeadDetailView.vue
  - src/components/leads/LeadForm.vue
  - src/components/leads/LeadModal.vue
  - src/components/leads/NotesSection.vue
  - src/components/leads/TagsManager.vue
  - src/components/leads/LeadInfo.vue
  - src/components/leads/LeadList.vue
  - src/router/index.ts
autonomous: true
must_haves:
  truths:
    - "User can create lead manually with name, phone, email, company, website, message, source"
    - "User can view lead detail page with all information"
    - "User can edit lead information"
    - "User can delete lead with confirmation"
    - "User can add notes to lead"
    - "User can add tags to lead"
    - "User can remove tags from lead"
    - "User can change lead status manually"
  artifacts:
    - path: "src/components/leads/LeadForm.vue"
      provides: "Lead creation/editing form"
      contains: "name, phone, email, company, website, message, source fields"
    - path: "src/components/leads/LeadModal.vue"
      provides: "Modal wrapper for lead form"
      contains: "backdrop, close button, ESC key handling"
    - path: "src/components/leads/NotesSection.vue"
      provides: "Notes functionality for leads"
      contains: "note input, note list with timestamps"
    - path: "src/components/leads/TagsManager.vue"
      provides: "Tag management for leads"
      contains: "tag display, add/remove tag"
    - path: "src/views/LeadDetailView.vue"
      provides: "Lead detail page layout"
      contains: "breadcrumb, lead info, notes section"
  key_links:
    - from: "src/components/leads/LeadForm.vue"
      to: "src/api/leads.ts"
      via: "call createLead or updateLead on submit"
      pattern: "createLead\\(|updateLead\\("
    - from: "src/views/LeadDetailView.vue"
      to: "src/stores/leads.ts"
      via: "fetch single lead by id"
      pattern: "fetchLead\\(id\\)"
    - from: "src/components/leads/NotesSection.vue"
      to: "src/api/leads.ts"
      via: "add note to lead via API"
      pattern: "addNote\\(leadId, content\\)"
    - from: "src/components/leads/TagsManager.vue"
      to: "src/stores/leads.ts"
      via: "update lead tags"
      pattern: "updateLead\\(id, { tags }\\)"
    - from: "src/components/leads/LeadList.vue"
      to: "src/views/LeadDetailView.vue"
      via: "view button navigates to detail"
      pattern: "router\\.push.*leads.*id"
---

<objective>
Lead creation, editing, deletion, and detail view with notes and tags management.

Purpose: Enable users to create new leads, edit existing lead information, delete leads with confirmation, and view detailed lead information with the ability to add notes and manage tags.

Output: Fully functional lead CRUD operations with form validation, detail view, notes, and tags management.
</objective>

<execution_context>
@C:\Users\Omer\.claude\get-shit-done\workflows\execute-plan.md
@C:\Users\Omer\.claude\get-shit-done\templates\summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/01-foundation/01-CONTEXT.md
@.planning/phases/01-foundation/01-01-SUMMARY.md
@.planning/phases/01-foundation/01-02-SUMMARY.md
@.planning/phases/01-foundation/01-03a-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create lead form for creating and editing leads</name>
  <files>src/components/leads/LeadForm.vue, src/components/leads/LeadModal.vue, src/views/LeadsView.vue, src/components/leads/LeadList.vue</files>
  <action>
    1. Create LeadForm component (src/components/leads/LeadForm.vue):
       - Props: mode ('create' | 'edit'), lead (for edit mode)
       - Form fields:
         - Name (text input, required)
         - Phone (tel input, required, validate format)
         - Email (email input, optional, validate format)
         - Company (text input, optional)
         - Website (url input, optional, validate format)
         - Message (textarea, optional)
         - Source (select: Web Form, API, Manual, WhatsApp, default: Manual)
         - Status (select: New, Qualified, Booked, Customer, Lost, default: New)
         - Tags (tag input with autocomplete - type and press Enter to add)
       - Validation:
         - Name: required, min 2 chars
         - Phone: required, Turkish phone format (+90 XXX XXX XX XX or 10 digits)
         - Email: valid email format if provided
         - Website: valid URL format if provided
       - Submit button: "Create Lead" or "Save Changes"
       - Cancel button
       - Error display: Show validation or API errors below each field
       - Loading state during submission
       - Success message after creation/update
       - Call leadsStore.createLead() or updateLead() on submit

    2. Create LeadModal component (src/components/leads/LeadModal.vue):
       - Modal wrapper for LeadForm
       - Backdrop click to close
       - ESC key to close
       - Title: "New Lead" or "Edit Lead"
       - Emit close event

    3. Update LeadsView to integrate LeadModal:
       - Add state for modalOpen, modalMode, selectedLead
       - Add "Add Lead" button that opens modal in create mode
       - Only show if canCreateLeads permission

    4. Update LeadList to connect Edit button:
       - Add @edit event emitter
       - Opens LeadModal with LeadForm in edit mode
       - Pass lead data to form
       - Only show Edit button if canEditLeads permission

    5. Form UX improvements:
       - Auto-focus on name field on mount
       - Tab navigation between fields
       - Enter key submits form (unless in textarea)
       - Confirm before closing if form has changes
       - Show character count for message field
       - Format phone number as user types (optional - Turkish format)
  </action>
  <verify>Click "Add Lead", form appears in modal, fill all fields, submit - success message, lead appears in list. Click edit on lead, form appears with data pre-filled, modify fields, submit - lead updated in list. Validation works for invalid inputs.</verify>
  <done>Lead form creates and edits leads with validation</done>
</task>

<task type="auto">
  <name>Task 2: Create lead detail view with notes, tags, and full information</name>
  <files>src/views/LeadDetailView.vue, src/components/leads/LeadInfo.vue, src/components/leads/NotesSection.vue, src/components/leads/TagsManager.vue, src/router/index.ts, src/components/leads/LeadList.vue</files>
  <action>
    1. Add /leads/:id route to router (src/router/index.ts):
       - Route: /leads/:id with component LeadDetailView
       - Meta: { requiresAuth: true }
       - Fetch lead on route enter

    2. Create LeadDetailView (src/views/LeadDetailView.vue):
       - Breadcrumb: Leads > Lead Name
       - Back button to leads list
       - Two-column layout (desktop) or stacked (mobile):
         - Left: Lead information
         - Right: Notes and activity
       - Action buttons: Edit (if canEditLeads), Delete (if canDeleteLeads)
       - Delete confirmation: "Are you sure you want to delete this lead? This action cannot be undone."

    3. Create LeadInfo component (src/components/leads/LeadInfo.vue):
       - Display all lead fields in organized sections
       - Section 1: Contact Information
         - Name (large, bold)
         - Phone (clickable tel: link)
         - Email (clickable mailto: link)
       - Section 2: Company Information
         - Company name
         - Website (clickable link, opens in new tab)
       - Section 3: Lead Details
         - Status (badge with color)
         - Source (badge with icon)
         - Score (display if > 0, show quality indicator)
         - Quality (pending/qualified badge)
         - Created date (relative time: "2 days ago")
         - Updated date (relative time)
       - Section 4: Message
         - Display message text if exists
       - Section 5: Tags
         - Display as colored chips
         - Click tag to filter leads list by that tag

    4. Create TagsManager component (src/components/leads/TagsManager.vue):
       - Props: leadId, currentTags (string[])
       - Display current tags as chips
       - "Add tag" input:
         - Type tag name, press Enter or click "Add"
         - Show autocomplete with existing tags from all leads
         - Prevent duplicate tags
       - Remove tag button (X) on each chip
       - Update lead via leadsStore.updateLead(id, { tags })
       - Show success/error message

    5. Create NotesSection component (src/components/leads/NotesSection.vue):
       - Props: leadId
       - "Add note" textarea at top
       - "Add Note" button
       - Notes list below (reverse chronological - newest first)
       - Each note shows:
         - User name and avatar (who created note)
         - Note content (with line breaks preserved)
         - Timestamp (relative time: "2 hours ago")
       - Empty state: "No notes yet. Add your first note above."
       - Fetch notes from leadsStore.getNotes(leadId) on mount
       - Add note via leadsStore.addNote(leadId, content)
       - Auto-refresh notes after adding
       - Show success message after adding note

    6. Add activity timeline placeholder (for Phase 6):
       - Notes section header: "Activity Timeline"
       - Show notes as timeline items
       - Reserve space for future: WhatsApp messages, emails, status changes, appointments

    7. Add quick actions:
       - Call button (tel: link) for phone
       - Email button (mailto: link) for email
       - WhatsApp button (wa.me link) for phone (if has WhatsApp)

    8. Implement optimistic updates:
       - When adding note, show immediately in list
       - If API fails, remove and show error
       - When updating tags, show immediately

    9. Update LeadList View button:
       - Click View button -> navigate to /leads/:id
       - Pass lead ID to router
  </action>
  <verify>Click on a lead from list, detail view loads with all information. Add note, note appears in list. Add tag, tag chip appears. Remove tag, tag removed. Click phone number, phone app opens. Click email, email client opens. All information displays correctly.</verify>
  <done>Lead detail view shows full information with notes and tags management</done>
</task>

<task type="checkpoint:human-verify">
  <what-built>Lead CRUD operations (Create, Read, Update, Delete) with form validation and detail view</what-built>
  <how-to-verify>
    1. Navigate to /leads
    2. Click "Add Lead" button
    3. Fill form with test data:
       - Name: "John Doe"
       - Phone: "+905551234567"
       - Email: "john@example.com"
       - Company: "Acme Corp"
       - Website: "https://acme.com"
       - Message: "Interested in premium package"
       - Source: "Manual"
       - Status: "New"
       - Tags: "hot-lead" (type and press Enter)
    4. Click "Create Lead"
    5. Verify: Success message, lead appears in list
    6. Click "View" on the lead
    7. Verify: Lead detail page opens with all information
    8. Go back to list, click "Edit"
    9. Change status to "Qualified"
    10. Click "Save Changes"
    11. Verify: Status badge updated to blue "Qualified"
    12. Click "Delete" on the lead
    13. Confirm deletion
    14. Verify: Confirmation dialog appears, lead removed from list
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues with CRUD operations</resume-signal>
</task>

</tasks>

<verification>
1. Navigate to /leads
2. Create 3-5 test leads with different statuses and tags
3. Click on a lead - detail view loads
4. Add a note - note appears in timeline
5. Add a tag - tag appears in tags section
6. Remove a tag - tag disappears
7. Edit lead - update status, verify change reflects in detail and list
8. Delete lead - verify confirmation, lead removed from list
9. Test validation: try to create lead with invalid phone number - error shown
10. Test validation: try to create lead without required fields - error shown
11. Test mobile responsive design - view detail on small screen
12. Test with different user roles - verify permissions work correctly
</verification>

<success_criteria>
1. User can create leads with all fields (name, phone, email, company, website, message, source, status, tags)
2. User can view lead detail page with all information
3. User can edit lead information
4. User can delete lead with confirmation
5. User can add notes to lead
6. User can add tags to lead
7. User can remove tags from lead
8. User can change lead status manually
9. Form validation works correctly
10. All functionality respects user permissions (Admin/Sales/Marketing)
11. Responsive design works on mobile devices
12. Optimistic updates work for notes and tags
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation/01-03b-SUMMARY.md` with:
- Lead CRUD implementation details
- Form validation details
- Detail view layout and features
- Notes and tags implementation
- UI/UX decisions made
- Known issues or next steps
</output>
