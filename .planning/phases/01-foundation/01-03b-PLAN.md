---
phase: 01-foundation
plan: 03b
type: execute
wave: 4
depends_on: [01-03a]
files_modified:
  - app/leads/page.tsx
  - app/leads/[id]/page.tsx
  - components/leads/LeadForm.tsx
  - components/leads/LeadModal.tsx
  - components/leads/NotesSection.tsx
  - components/leads/TagsManager.tsx
  - components/leads/LeadInfo.tsx
  - components/leads/LeadList.tsx
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
    - path: "components/leads/LeadForm.tsx"
      provides: "Lead creation/editing form"
      contains: "name, phone, email, company, website, message, source fields"
    - path: "components/leads/LeadModal.tsx"
      provides: "Modal wrapper for lead form"
      contains: "backdrop, close button, ESC key handling"
    - path: "components/leads/NotesSection.tsx"
      provides: "Notes functionality for leads"
      contains: "note input, note list with timestamps"
    - path: "components/leads/TagsManager.tsx"
      provides: "Tag management for leads"
      contains: "tag display, add/remove tag"
    - path: "app/leads/[id]/page.tsx"
      provides: "Lead detail page layout"
      contains: "breadcrumb, lead info, notes section"
  key_links:
    - from: "components/leads/LeadForm.tsx"
      to: "lib/api/leads.ts"
      via: "call createLead or updateLead on submit"
      pattern: "createLead\\(|updateLead\\("
    - from: "app/leads/[id]/page.tsx"
      to: "lib/stores/leads.ts"
      via: "fetch single lead by id"
      pattern: "fetchLead\\(id\\)"
    - from: "components/leads/NotesSection.tsx"
      to: "lib/api/leads.ts"
      via: "add note to lead via API"
      pattern: "addNote\\(leadId, content\\)"
    - from: "components/leads/TagsManager.tsx"
      to: "lib/stores/leads.ts"
      via: "update lead tags"
      pattern: "updateLead\\(id, { tags }\\)"
    - from: "components/leads/LeadList.tsx"
      to: "app/leads/[id]/page.tsx"
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
  <files>components/leads/LeadForm.tsx, components/leads/LeadModal.tsx, app/leads/page.tsx, components/leads/LeadList.tsx</files>
  <action>
    1. Create LeadForm component (components/leads/LeadForm.tsx):
       - Props: mode ('create' | 'edit'), lead (for edit mode), onSubmit, onCancel
       - Form fields using react-hook-form + zod validation:
         - Name (text input, required)
         - Phone (tel input, required, Turkish format)
         - Email (email input, optional)
         - Company (text input, optional)
         - Website (url input, optional)
         - Message (textarea, optional)
         - Source (select: Web Form, API, Manual, WhatsApp)
         - Status (select: New, Qualified, Booked, Customer, Lost)
         - Tags (tag input with autocomplete)
       - Validation:
         - Name: required, min 2 chars
         - Phone: required, Turkish phone format
         - Email: valid email format if provided
         - Website: valid URL format if provided
       - Submit button: "Create Lead" or "Save Changes"
       - Cancel button
       - Error display below each field
       - Loading state during submission

    2. Create LeadModal component (components/leads/LeadModal.tsx):
       - Modal wrapper using shadcn/ui Dialog component
       - Backdrop click to close
       - ESC key to close
       - Title: "New Lead" or "Edit Lead"

    3. Update leads page (app/leads/page.tsx):
       - Add state for modalOpen, modalMode, selectedLead
       - Add "Add Lead" button that opens modal in create mode
       - Only show if canCreateLeads permission

    4. Update LeadList to connect Edit button:
       - Opens LeadModal with LeadForm in edit mode
       - Pass lead data to form
       - Only show Edit button if canEditLeads permission

    5. Form UX improvements:
       - Auto-focus on name field on mount
       - Tab navigation between fields
       - Enter key submits form
       - Show character count for message field
       - Format phone number as user types
  </action>
  <verify>Click "Add Lead", form appears in modal, fill all fields, submit - success message, lead appears in list. Click edit on lead, form appears with data pre-filled, modify fields, submit - lead updated in list. Validation works for invalid inputs.</verify>
  <done>Lead form creates and edits leads with validation</done>
</task>

<task type="auto">
  <name>Task 2: Create lead detail view with notes, tags, and full information</name>
  <files>app/leads/[id]/page.tsx, components/leads/LeadInfo.tsx, components/leads/NotesSection.tsx, components/leads/TagsManager.tsx, components/leads/LeadList.tsx</files>
  <action>
    1. Create dynamic route (app/leads/[id]/page.tsx):
       - Fetch lead by ID on server component
       - Breadcrumb: Leads > Lead Name
       - Back button to leads list
       - Two-column layout (desktop) or stacked (mobile)
       - Action buttons: Edit, Delete

    2. Create LeadInfo component (components/leads/LeadInfo.tsx):
       - Display all lead fields in organized sections
       - Section 1: Contact Information
         - Name, Phone (tel: link), Email (mailto: link)
       - Section 2: Company Information
         - Company name, Website (link)
       - Section 3: Lead Details
         - Status badge, Source badge, Score, Quality
         - Created/Updated dates
       - Section 4: Message and Tags

    3. Create TagsManager component (components/leads/TagsManager.tsx):
       - Display current tags as chips
       - "Add tag" input with autocomplete
       - Show existing tags from all leads
       - Remove tag button (X) on each chip

    4. Create NotesSection component (components/leads/NotesSection.tsx):
       - "Add note" textarea at top
       - Notes list below (reverse chronological)
       - Each note shows user, content, timestamp
       - Empty state message
       - Add note via leadsStore.addNote()

    5. Add activity timeline placeholder (for Phase 6):
       - Reserve space for future: WhatsApp messages, emails, status changes, appointments

    6. Add quick actions:
       - Call button (tel: link)
       - Email button (mailto: link)
       - WhatsApp button (wa.me link)

    7. Implement optimistic updates:
       - Show note immediately in list
       - If API fails, remove and show error

    8. Update LeadList View button:
       - Click View -> navigate to /leads/[id]
       - Use router.push from next/navigation
  </action>
  <verify>Click on a lead from list, detail view loads with all information. Add note, note appears in list. Add tag, tag chip appears. Remove tag, tag removed. Click phone number, phone app opens. Click email, email client opens.</verify>
  <done>Lead detail view shows full information with notes and tags management</done>
</task>

<task type="checkpoint:human-verify">
  <what-built>Lead CRUD operations (Create, Read, Update, Delete) with form validation and detail view</what-built>
  <how-to-verify>
    1. Navigate to /leads
    2. Click "Add Lead" button
    3. Fill form with test data
    4. Click "Create Lead"
    5. Verify: Success message, lead appears in list
    6. Click "View" on the lead
    7. Verify: Lead detail page opens
    8. Go back to list, click "Edit"
    9. Change status, click "Save Changes"
    10. Verify: Status badge updated
    11. Click "Delete" on the lead
    12. Confirm deletion
    13. Verify: Lead removed from list
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
7. Edit lead - update status, verify change reflects
8. Delete lead - verify confirmation, lead removed
9. Test validation: invalid phone number - error shown
10. Test validation: missing required fields - error shown
11. Test mobile responsive design
12. Test with different user roles
</verification>

<success_criteria>
1. User can create leads with all fields
2. User can view lead detail page
3. User can edit lead information
4. User can delete lead with confirmation
5. User can add/remove notes
6. User can add/remove tags
7. User can change lead status
8. Form validation works
9. Permissions respected
10. Responsive design works
11. Optimistic updates work
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
