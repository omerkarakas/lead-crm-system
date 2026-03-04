import { NextRequest, NextResponse } from 'next/server';
import { createAppointment } from '@/lib/api/appointments';
import { sendAppointmentConfirmation } from '@/lib/api/appointments';
import type { CreateAppointmentDto } from '@/types/appointment';

/**
 * GET /api/appointments - Get all appointments with filtering
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '50');
    const leadId = searchParams.get('leadId') || undefined;
    const status = searchParams.get('status') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const sort = searchParams.get('sort') || '-scheduled_at';

    const { fetchAppointments } = await import('@/lib/api/appointments');
    const result = await fetchAppointments({
      page,
      perPage,
      leadId,
      status: status as any,
      startDate,
      endDate,
      sort
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[GET /api/appointments] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch appointments',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/appointments - Create a new appointment (manual)
 *
 * Creates appointment and sends WhatsApp confirmation message
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as CreateAppointmentDto;

    // Validate required fields
    if (!body.calcom_booking_id) {
      return NextResponse.json(
        { success: false, message: 'calcom_booking_id is required' },
        { status: 400 }
      );
    }

    if (!body.scheduled_at) {
      return NextResponse.json(
        { success: false, message: 'scheduled_at is required' },
        { status: 400 }
      );
    }

    // Create appointment
    const appointment = await createAppointment({
      ...body,
      source: 'manual',
      status: body.status || 'scheduled'
    });

    // Send confirmation message (fire-and-forget - don't fail if confirmation errors)
    if (appointment.lead_id) {
      sendAppointmentConfirmation(appointment.id).catch(error => {
        console.error('[POST /api/appointments] Confirmation error:', error);
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment created',
      appointment
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/appointments] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create appointment',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
