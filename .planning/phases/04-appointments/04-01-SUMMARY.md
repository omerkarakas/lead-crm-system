---
phase: 04-appointments
plan: 01
subsystem: appointments, webhook, calcom-integration
tags: pocketbase, nextjs, typescript, calcom, webhook

# Dependency graph
requires:
  - phase: 02-whatsapp-qualification
    provides: Lead data model, lead matching patterns, webhook structure
provides:
  - Appointments collection in PocketBase with Cal.com integration fields
  - Cal.com webhook endpoint for receiving booking events
  - Appointment API functions with lead matching logic
  - Lead status auto-update to 'booked' on appointment creation
  - Failed booking tracking for manual reconciliation
affects:
  - 04-02: Appointment UI will use these API functions
  - 04-03: Reminder system will query appointments via getUpcomingAppointments
  - 04-04: Calendar sync will use appointment records

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Webhook endpoint with idempotency check
    - Phone-first lead matching with email fallback
    - Failed booking tracking with null lead_id
    - Status-based workflow (scheduled → completed/cancelled/rescheduled)
    - Cal.com booking payload parsing and mapping

key-files:
  created:
    - pb_migrations/1772622778_created_appointments.js
    - types/appointment.ts
    - lib/api/appointments.ts
    - app/api/webhooks/calcom/route.ts
  modified:
    - pb_schema.json (added appointments collection)

key-decisions:
  - "lead_id made optional to track failed bookings without lead match"
  - "Phone-first matching (Turkey market pattern from WhatsApp integration)"
  - "Return 200 OK for failed bookings to avoid webhook retries"
  - "Idempotency via getAppointmentByCalcomId before creating"
  - "Reminder timestamp fields for future automation (24h, 2h)"

patterns-established:
  - "Pattern: Webhook → Parse → Match Lead → Create/Update → Respond"
  - "Pattern: Phone normalization (strip +90, non-numeric chars)"
  - "Pattern: Idempotency check via unique external ID (calcom_booking_id)"

# Metrics
duration: 5min
completed: 2026-03-04
---

# Phase 4 Plan 1: Appointments Collection and Cal.com Webhook Summary

**PocketBase appointments collection with Cal.com webhook integration, lead matching by phone/email, and automated lead status updates to 'booked'**

## Performance

- **Duration:** 5 minutes
- **Started:** 2026-03-04T11:12:51Z
- **Completed:** 2026-03-04T11:17:00Z
- **Tasks:** 3/3 completed
- **Files modified:** 7

## Accomplishments

1. **Appointments Collection Created**
   - `appointments` collection with fields: lead_id (optional), calcom_booking_id (unique), calcom_event_id, scheduled_at, duration, location, meeting_url, status, source, confirmation_sent, reminder_24h_sent, reminder_2h_sent, notes
   - Added indexes on lead_id, scheduled_at, status for performance
   - lead_id made optional to track failed bookings without lead match
   - Supports both Cal.com and manual appointment sources

2. **Appointment Type Definitions**
   - AppointmentStatus enum: SCHEDULED, COMPLETED, CANCELLED, RESCHEDULED
   - AppointmentSource enum: CALCOM, MANUAL
   - Appointment interface with all fields
   - CreateAppointmentDto and UpdateAppointmentDto for API operations
   - CalcomBookingPayload interface for webhook parsing

3. **Appointment API Functions**
   - createAppointment: Creates appointment with optional lead_id
   - matchLeadToAppointment: Phone-first matching with email fallback
   - updateLeadStatusToBooked: Updates lead status to 'booked'
   - getAppointmentByCalcomId: Idempotency check by Cal.com booking ID
   - updateAppointmentStatus, getAppointmentsByLead, getUpcomingAppointments
   - fetchAppointment, updateAppointment, deleteAppointment, fetchAppointments

4. **Cal.com Webhook Endpoint**
   - POST /api/webhooks/calcom handler
   - Parses booking payload (uid, eventTypeId, startTime, endTime, attendee, location, status)
   - Matches leads by phone first, then email
   - Creates appointments and updates lead status to 'booked'
   - Idempotency via existing appointment check
   - Tracks failed bookings with null lead_id
   - Returns 200 OK for failed bookings to avoid webhook retries

5. **Phone Matching Logic**
   - Strips +90 prefix for Turkish market
   - Removes non-numeric characters
   - Tries exact match with multiple formats (with/without prefix)
   - Falls back to email case-insensitive match

## Task Commits

Each task was committed atomically:

1. **Task 1: Create appointments collection and type definitions** - `84c15ef` (feat)
2. **Task 2: Create appointment API functions with lead matching logic** - `f424610` (feat)
3. **Task 3: Create Cal.com webhook endpoint** - `6940fb0` (feat)

## Files Created/Modified

### Created

1. `pb_migrations/1772622778_created_appointments.js` - Migration for appointments collection
2. `types/appointment.ts` - Appointment type definitions and enums
3. `lib/api/appointments.ts` - Appointment API functions with lead matching
4. `app/api/webhooks/calcom/route.ts` - Cal.com webhook endpoint

### Modified

1. `pb_schema.json` - Added appointments collection schema

## Decisions Made

1. **Optional lead_id**: Made lead_id optional to track failed bookings without lead match for manual reconciliation
2. **Phone-first matching**: Uses phone number first (Turkey market pattern from WhatsApp integration), then email fallback
3. **200 OK on failure**: Returns 200 OK when lead not found to avoid webhook retries and spam
4. **Idempotency pattern**: Uses getAppointmentByCalcomId to check for existing appointments before creating
5. **Reminder flags**: Added confirmation_sent, reminder_24h_sent, reminder_2h_sent flags for future automation
6. **Status mapping**: Maps Cal.com status (ACCEPTED, CANCELLED, RESCHEDULED) to appointment status

## Deviations from Plan

**None - plan executed exactly as written.**

All tasks completed according to specifications with no unexpected issues or deviations.

## Issues Encountered

**None.**

Implementation was straightforward with no blocking issues.

## User Setup Required

1. **PocketBase Migration**: The `appointments` collection is created via migration. Run the migration to apply:
   ```bash
   # The migration will be applied automatically when PocketBase starts
   # Or manually via PocketBase admin panel
   ```

2. **Cal.com Webhook**: Configure the webhook URL in Cal.com settings:
   ```
   Webhook URL: https://your-domain.com/api/webhooks/calcom
   ```

3. **Test Lead**: Create a test lead with phone and email to verify webhook processing

## Next Phase Readiness

**Ready for 04-02 (Appointment UI)**

- Appointments collection exists with all required fields
- API functions provide full CRUD operations
- Webhook endpoint is ready to receive booking events
- Lead matching logic supports phone and email lookup

**Considerations for 04-02:**
- Build appointment list page with filters (date range, status, lead)
- Implement status badge components (scheduled, completed, cancelled, rescheduled)
- Add manual appointment creation form (source: manual)
- Consider view toggle pattern from email templates (table vs card)

**Considerations for 04-03 (Reminders):**
- getUpcomingAppointments function ready for reminder job
- Reminder flags (24h, 2h) in place for tracking sent status
- Will need WhatsApp integration for sending reminders

**Considerations for production:**
- Add webhook signature verification (X-Calcom-Signature header)
- Implement proper job queue for reminder scheduling
- Add retry logic for failed WhatsApp messages
- Monitor and reconcile failed bookings (null lead_id)
- Add rate limiting for webhook endpoint

---
*Phase: 04-appointments*
*Completed: 2026-03-04*
