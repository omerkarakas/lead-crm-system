import { NextRequest, NextResponse } from 'next/server';
import {
  createAppointment,
  matchLeadToAppointment,
  updateLeadStatusToBooked,
  getAppointmentByCalcomId,
  updateAppointmentStatus,
  sendAppointmentConfirmation
} from '@/lib/api/appointments';
import { AppointmentStatus, AppointmentSource, type CalcomBookingPayload } from '@/types/appointment';

/**
 * Cal.com Webhook endpoint for booking events
 * POST /api/webhooks/calcom
 *
 * TODO: Add webhook signature verification for production
 * Cal.com sends X-Calcom-Signature header for security
 */
export async function POST(req: NextRequest) {
  try {
    // Verify request method is POST
    if (req.method !== 'POST') {
      return NextResponse.json(
        { success: false, message: 'Method not allowed' },
        { status: 405 }
      );
    }

    // Parse webhook payload from request body
    const payload = await req.json() as CalcomBookingPayload;

    // Extract booking data from Cal.com payload
    const {
      uid: bookingId,
      eventTypeId: eventId,
      startTime,
      endTime,
      attendee,
      location,
      metadata = {},
      status: calcomStatus = 'ACCEPTED'
    } = payload;

    const { email, phone, name } = attendee;

    // Calculate duration in minutes
    const startDateTime = new Date(startTime);
    const endDateTime = new Date(endTime);
    const duration = Math.round((endDateTime.getTime() - startDateTime.getTime()) / 60000);

    // Determine appointment status from Cal.com status
    let appointmentStatus: AppointmentStatus = AppointmentStatus.SCHEDULED;
    if (calcomStatus === 'CANCELLED') {
      appointmentStatus = AppointmentStatus.CANCELLED;
    } else if (calcomStatus === 'RESCHEDULED') {
      appointmentStatus = AppointmentStatus.RESCHEDULED;
    }

    // Check for duplicate: Call getAppointmentByCalcomId(bookingId)
    const existingAppointment = await getAppointmentByCalcomId(bookingId);

    // Idempotency: If exists and status matches, return 200 OK
    if (existingAppointment) {
      // Update status if it changed
      if (existingAppointment.status !== appointmentStatus) {
        await updateAppointmentStatus(existingAppointment.id, appointmentStatus);
      }
      return NextResponse.json({
        success: true,
        message: 'Booking already processed',
        appointmentId: existingAppointment.id
      });
    }

    // Match lead: Call matchLeadToAppointment(phone, email)
    const lead = await matchLeadToAppointment(phone || '', email);

    if (lead) {
      // Lead found: Create appointment record and update lead status
      const appointment = await createAppointment({
        lead_id: lead.id,
        calcom_booking_id: bookingId,
        calcom_event_id: eventId,
        scheduled_at: startTime,
        duration,
        location: location || 'Online',
        meeting_url: (metadata as any).meetingUrl || null,
        status: appointmentStatus,
        source: AppointmentSource.CALCOM,
        notes: `Attendee: ${name} (${email}${phone ? ', ' + phone : ''})`
      });

      // Update lead status to 'booked' via updateLeadStatusToBooked()
      if (appointmentStatus === 'scheduled') {
        await updateLeadStatusToBooked(lead.id);
      }

      // Send confirmation message (fire-and-forget - don't fail webhook if confirmation errors)
      sendAppointmentConfirmation(appointment.id).catch(error => {
        console.error('[Cal.com Webhook] Confirmation error:', error);
      });

      return NextResponse.json({
        success: true,
        message: 'Appointment created',
        appointmentId: appointment.id,
        leadId: lead.id
      }, { status: 201 });
    } else {
      // Lead not found: Log failed booking and create appointment with lead_id = null
      console.warn(`[Cal.com Webhook] Lead not found for booking ${bookingId}. Phone: ${phone}, Email: ${email}`);

      // Create appointment record with lead_id = null to track failed bookings
      // This allows us to monitor and manually reconcile bookings
      const appointment = await createAppointment({
        lead_id: undefined, // No lead found
        calcom_booking_id: bookingId,
        calcom_event_id: eventId,
        scheduled_at: startTime,
        duration,
        location: location || 'Online',
        meeting_url: (metadata as any).meetingUrl || null,
        status: appointmentStatus,
        source: AppointmentSource.CALCOM,
        notes: `FAILED MATCH - Attendee: ${name} (${email}${phone ? ', ' + phone : ''})`
      });

      return NextResponse.json({
        success: false,
        message: 'Lead not found - appointment logged for review',
        appointmentId: appointment.id,
        bookingId,
        phone,
        email
      }, { status: 200 }); // Return 200 OK to don't fail the webhook
    }
  } catch (error) {
    console.error('Cal.com webhook error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for webhook verification (if needed by Cal.com)
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    webhook: 'calcom'
  });
}
