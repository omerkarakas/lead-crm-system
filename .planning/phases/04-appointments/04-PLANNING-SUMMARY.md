# Phase 4: Appointments - Planning Summary

**Planned:** 2026-03-04
**Status:** Ready for execution
**Total Plans:** 4
**Estimated Waves:** 4

## Overview

Phase 4 implements Cal.com integration for appointment booking, automated WhatsApp confirmations and reminders, and full appointment management UI. Users can manage appointments manually (CRUD) and the system automatically handles webhook bookings from Cal.com with lead matching and status updates.

## Plans

### Wave 1: Foundation
**04-01: Cal.com Webhook Integration**
- Creates appointments PocketBase collection
- Implements Cal.com webhook endpoint for booking events
- Lead matching logic (phone first, then email)
- Appointment record creation and lead status updates

### Wave 2: CRUD Operations
**04-02: Appointment CRUD and Status Management**
- Appointment API endpoints (GET, POST, PATCH, DELETE)
- Appointment form component with lead selection
- Appointment list component with responsive layout
- Appointments page with create/edit functionality
- Manual appointments trigger WhatsApp confirmation

### Wave 3: Automation
**04-03: WhatsApp Confirmations and Reminders**
- WhatsApp message formatters (confirmation, 24h reminder, 2h reminder)
- Automated confirmation sending on appointment creation
- Reminder scheduling system with cron endpoint
- Cancellation and reschedule notices
- Integration with appointment creation workflow

### Wave 4: UI Polish
**04-04: Appointment List View with Filtering**
- Advanced filters (date range, status, search)
- View toggle (table/card)
- URL query param persistence
- Appointment detail modal
- Lead detail page integration (appointments tab)

## Dependency Graph

```
04-01 (Webhook + Data Model)
    ↓
04-02 (CRUD API + UI)
    ↓
04-03 (WhatsApp Automation)
    ↓
04-04 (Filtering + Lead Integration)
```

## Key Technical Decisions

1. **Lead matching**: Phone number first (Turkey WhatsApp usage), then email fallback
2. **Status badges**: Color + Lucide icon combination (scheduled=green+clock, completed=blue+check, cancelled=red+x, rescheduled=orange+refresh)
3. **Reminder timing**: Multiple reminders (24h before + 2h before)
4. **View patterns**: Desktop table + mobile card, same as email templates
5. **Filter persistence**: URL query params for shareable filtered views
6. **Manual appointments**: Same WhatsApp confirmation flow as webhook bookings
7. **Reminder templates**: Customizable, admin-managed like email templates

## Files Modified (Estimated)

**New Collections:**
- pb_migrations/[timestamp]_created_appointments.js

**New Types:**
- types/appointment.ts

**New API Routes:**
- app/api/webhooks/calcom/route.ts
- app/api/appointments/route.ts
- app/api/appointments/[id]/route.ts
- app/api/appointments/[id]/send-confirmation/route.ts
- app/api/cron/send-reminders/route.ts

**New Components:**
- components/appointments/AppointmentForm.tsx
- components/appointments/AppointmentModal.tsx
- components/appointments/AppointmentList.tsx
- components/appointments/AppointmentFilters.tsx
- components/appointments/AppointmentDetailModal.tsx
- components/appointments/LeadAppointments.tsx

**New Libraries:**
- lib/api/appointments.ts
- lib/whatsapp/appointment-messages.ts

**Modified:**
- lib/api/whatsapp.ts (may need updates for appointment messages)
- app/(dashboard)/appointments/page.tsx (new page)
- app/(dashboard)/leads/[id]/page.tsx (add appointments tab)
- pb_schema.json (add appointments collection)

## Success Criteria

When all plans complete, the following must be TRUE:

1. Cal.com webhook creates appointment records and updates lead status to "booked"
2. WhatsApp confirmation sent after booking (webhook or manual)
3. WhatsApp reminders sent 24 hours and 2 hours before appointment
4. User can filter appointments by date range, status, and search
5. User can create, edit, cancel, and complete appointments via UI
6. Appointment list shows in table/card view toggle
7. Lead detail page shows appointment history
8. All appointment status transitions handled (scheduled, completed, cancelled, rescheduled)

## User Setup Required

**Cal.com Integration:**
1. Configure Cal.com webhook URL in Cal.com settings
   - Webhook URL: https://your-domain.com/api/webhooks/calcom
2. Ensure Green API credentials are set (from Phase 2)
   - GREEN_API_INSTANCE_ID
   - GREEN_API_TOKEN

**Reminder Cron Job:**
1. Set up external cron service to call GET /api/cron/send-reminders
   - Recommended: Every 15 minutes
   - Options: Vercel Cron, GitHub Actions, cron-job.org
2. Set CRON_SECRET environment variable for security (optional but recommended)

## Next Phase Readiness

**Ready for Phase 5: Campaigns & Nurturing**
- Appointment data available for campaign triggers
- WhatsApp messaging infrastructure established
- Lead status workflow complete (new -> qualified -> booked -> customer)

---

*Phase: 04-appointments*
*Planning Complete: 2026-03-04*
*Plans: 4 created, ready for execution*
