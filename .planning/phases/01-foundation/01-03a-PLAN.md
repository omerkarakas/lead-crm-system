---
phase: 01-foundation
plan: 03a
type: execute
wave: 3
depends_on: [01-02]
files_modified:
  - lib/stores/leads.ts
  - lib/api/leads.ts
  - app/leads/page.tsx
  - components/leads/LeadList.tsx
  - components/leads/LeadCard.tsx
  - components/leads/LeadSearch.tsx
  - components/leads/LeadFilter.tsx
  - types/lead.ts
autonomous: true
must_haves:
  truths:
    - "User can view lead list with pagination (50 per page)"
    - "User can search leads by name, phone, or email"
    - "User can filter leads by status (new, qualified, booked, customer, lost)"
    - "User can filter leads by tags"
    - "Lead API supports CRUD operations with proper error handling"
    - "Non-Admin users see data according to their role permissions"
  artifacts:
    - path: "lib/stores/leads.ts"
      provides: "Lead management state and actions (Zustand)"
      exports: ["useLeadsStore", "fetchLeads", "createLead", "updateLead", "deleteLead", "searchLeads", "filterLeads"]
    - path: "lib/api/leads.ts"
      provides: "Lead API functions"
      exports: ["fetchLeads", "createLead", "updateLead", "deleteLead", "searchLeads"]
    - path: "components/leads/LeadSearch.tsx"
      provides: "Lead search functionality"
      contains: "search input for name, phone, email"
    - path: "components/leads/LeadFilter.tsx"
      provides: "Lead filtering by status and tags"
      contains: "status filter, tags filter"
    - path: "types/lead.ts"
      provides: "Lead TypeScript types"
      contains: "Lead interface, LeadStatus enum, LeadSource enum"
  key_links:
    - from: "app/leads/page.tsx"
      to: "lib/stores/leads.ts"
      via: "fetch leads on mount and on search/filter changes"
      pattern: "fetchLeads\\("
    - from: "components/leads/LeadList.tsx"
      to: "lib/stores/leads.ts"
      via: "display leads from store"
      pattern: "leads"
    - from: "components/leads/LeadSearch.tsx"
      to: "lib/stores/leads.ts"
      via: "trigger search on input"
      pattern: "searchLeads\\("
    - from: "components/leads/LeadFilter.tsx"
      to: "lib/stores/leads.ts"
      via: "trigger filter on selection"
      pattern: "filterLeads\\("
---

<objective>
Lead management API with list view, search, filtering, and pagination - the foundation for viewing and browsing leads.

Purpose: Enable users to browse and search through their leads effectively with a responsive list view that supports searching by name/phone/email and filtering by status and tags.

Output: Working lead list with search, filtering, pagination, and responsive design.
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
</context>

<tasks>

<task type="auto">
  <name>Task 1: Build Lead CRUD API and store</name>
  <files>types/lead.ts, lib/api/leads.ts, lib/stores/leads.ts</files>
  <action>
    1. Define Lead types (types/lead.ts):
       ```typescript
       export enum LeadStatus {
         NEW = 'new',
         QUALIFIED = 'qualified',
         BOOKED = 'booked',
         CUSTOMER = 'customer',
         LOST = 'lost'
       }

       export enum LeadSource {
         WEB_FORM = 'web_form',
         API = 'api',
         MANUAL = 'manual',
         WHATSAPP = 'whatsapp'
       }

       export interface Lead {
         id: string
         name: string
         phone: string
         email?: string
         company?: string
         website?: string
         message?: string
         source: LeadSource
         status: LeadStatus
         score: number
         quality: 'pending' | 'qualified'
         tags: string[]
         createdById: string
         createdBy?: User
         createdAt: string
         updatedAt: string
       }

       export interface CreateLeadDto {
         name: string
         phone: string
         email?: string
         company?: string
         website?: string
         message?: string
         source?: LeadSource
         status?: LeadStatus
         tags?: string[]
       }

       export interface UpdateLeadDto extends Partial<CreateLeadDto> {
         id: string
       }

       export interface Note {
         id: string
         leadId: string
         userId: string
         user?: User
         content: string
         createdAt: string
       }
       ```

    2. Create Lead API functions (lib/api/leads.ts):
       - fetchLeads(params): GET with pagination, search, filter params
         - page: number (default 1)
         - perPage: number (default 50)
         - search: string (searches name, phone, email)
         - status: LeadStatus
         - tags: string[]
         - sort: string (e.g., '-createdAt', 'name')
       - fetchLead(id): GET single lead by ID
       - createLead(data): POST new lead
       - updateLead(id, data): PATCH existing lead
       - deleteLead(id): DELETE lead
       - addNote(leadId, content): POST add note to lead
       - getNotes(leadId): GET notes for lead

    3. Create Zustand store (lib/stores/leads.ts):
       - State: leads[], currentLead, loading, error, pagination (page, totalPages, totalItems)
       - Actions:
         - fetchLeads(params) - with pagination support
         - fetchLead(id) - for detail view
         - createLead(data) - creates lead and adds to list
         - updateLead(id, data) - updates lead in list
         - deleteLead(id) - removes from list
         - addNote(leadId, content) - adds note to currentLead
         - fetchNotes(leadId) - loads notes for currentLead
       - Use PocketBase SDK with proper error handling

    4. Set up PocketBase API rules for leads collection (document in README):
       For Phase 1, all authenticated users can see and edit all leads.

       Example PocketBase rules:
       ```
       // Create rule (all authenticated)
       @request.auth.id != ""

       // Read rule (all authenticated users see all leads for Phase 1)
       @request.auth.id != ""

       // Update rule (all authenticated users can update)
       @request.auth.id != ""

       // Delete rule (all authenticated users can delete)
       @request.auth.id != ""
       ```

    5. Set up PocketBase API rules for notes collection:
       - Create: All authenticated users
       - Read: All authenticated users (notes are visible to team)
       - Update: Only note creator
       - Delete: Only note creator or Admin
  </action>
  <verify>TypeScript compiles, API functions work with PocketBase SDK, store actions complete without errors</verify>
  <done>Lead types defined, API functions created, store implements lead CRUD, PocketBase rules documented</done>
</task>

<task type="auto">
  <name>Task 2: Create lead list with search, filtering, and pagination</name>
  <files>app/leads/page.tsx, components/leads/LeadList.tsx, components/leads/LeadCard.tsx, components/leads/LeadSearch.tsx, components/leads/LeadFilter.tsx</files>
  <action>
    1. Create leads page (app/leads/page.tsx):
       - Page title: "Leads"
       - Action buttons: "Add Lead" (if canCreateLeads) - placeholder for now (form in Plan 03b)
       - Search and filter section
       - Lead list component
       - Breadcrumb navigation

    2. Create LeadSearch component (components/leads/LeadSearch.tsx):
       - Search input field
       - Placeholder: "Search by name, phone, or email..."
       - Debounced search (300ms delay)
       - Clear button (X) to reset search
       - Uses useState + useEffect for search

    3. Create LeadFilter component (components/leads/LeadFilter.tsx):
       - Status filter: dropdown or button group
         - Options: All, New, Qualified, Booked, Customer, Lost
         - Show count per status (e.g., "New (12)")
       - Tags filter: multi-select or tag chips
         - Show available tags from all leads
         - Allow selecting multiple tags
         - Clear filters button

    4. Create LeadList component (components/leads/LeadList.tsx):
       - Table layout for desktop:
         - Columns: Name, Phone, Email, Company, Status, Tags, Source, Created, Actions
         - Status badges with colors (New: gray, Qualified: blue, Booked: yellow, Customer: green, Lost: red)
         - Tags as chips with colors
         - Source badges (web_form: purple, api: cyan, manual: gray, whatsapp: green)
         - Actions: View button, Edit button, Delete button
       - Pagination controls:
         - Page info: "Showing 1-50 of 123 leads"
         - Previous/Next buttons
         - Page number buttons
       - Empty state: "No leads found"
       - Loading state: Spinner or skeleton rows
       - Fetch leads from leadsStore on mount
       - Watch for search/filter changes and refetch

    5. Create LeadCard component (components/leads/LeadCard.tsx):
       - Card layout for mobile responsive
       - Same information as table row
       - Expandable for more details

    6. Implement sorting:
       - Click column headers to sort
       - Toggle between ascending/descending
       - Visual indicator (arrow) for sort direction

    7. Handle search/filter:
       - Maintain local state for searchQuery, statusFilter, tagFilters
       - Update URL query params for shareable links (?status=new&search=john)
       - Use useSearchParams from next/navigation

    Note: Create/Edit/Delete buttons are placeholders that will be implemented in Plan 03b.
  </action>
  <verify>Visit /leads, see lead list, search works, filter by status works, filter by tags works, pagination works, sorting works, responsive design works on mobile</verify>
  <done>Lead list displays with search, filtering, sorting, and pagination</done>
</task>

</tasks>

<verification>
1. Navigate to /leads
2. Create test leads via PocketBase admin or API
3. Test search: search for lead name - result filters correctly
4. Test search: search for phone number - result filters correctly
5. Test search: search for email - result filters correctly
6. Test status filter: Click "Qualified" - only qualified leads show
7. Test tag filter: Click a tag chip - only leads with that tag show
8. Test pagination: If 50+ leads, verify pagination controls work
9. Test sorting: Click column headers - sort order changes
10. Test mobile responsive design - view on small screen, verify cards layout
11. Test with different user roles - verify permissions work correctly
</verification>

<success_criteria>
1. User can view lead list with pagination (50 per page)
2. User can search leads by name, phone, or email
3. User can filter leads by status
4. User can filter leads by tags
5. Pagination works correctly
6. Sorting works correctly
7. Responsive design works on mobile devices
8. All functionality respects user permissions (Admin/Sales/Marketing)
9. URL query params work for shareable filtered links
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation/01-03a-SUMMARY.md` with:
- Lead API implementation details
- List view, search, and filter functionality details
- Pagination and sorting implementation
- UI/UX decisions made
- Known issues or next steps (form and detail view in Plan 03b)
</output>
