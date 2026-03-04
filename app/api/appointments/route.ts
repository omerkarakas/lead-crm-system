import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import type { CreateAppointmentDto } from '@/types/appointment';
import type { Appointment } from '@/types/appointment';

/**
 * GET /api/appointments - Get all appointments with filtering
 */
export async function GET(req: NextRequest) {
  try {
    const pb = await getServerPb();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '50');
    const leadId = searchParams.get('leadId') || undefined;
    const status = searchParams.get('status') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const sort = searchParams.get('sort') || '-scheduled_at';

    const filterParts: string[] = [];

    // Lead filter
    if (leadId) {
      filterParts.push(`lead_id = "${leadId}"`);
    }

    // Status filter
    if (status) {
      filterParts.push(`status = "${status}"`);
    }

    // Date range filter
    if (startDate) {
      filterParts.push(`scheduled_at >= "${startDate}"`);
    }
    if (endDate) {
      filterParts.push(`scheduled_at <= "${endDate}"`);
    }

    const options: any = { sort };

    if (filterParts.length > 0) {
      options.filter = filterParts.join(' && ');
    }

    const response = await pb.collection<Appointment>('appointments').getList(page, perPage, options);

    return NextResponse.json({
      page: response.page,
      perPage: response.perPage,
      totalItems: response.totalItems,
      totalPages: response.totalPages,
      items: response.items,
    });
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
    const pb = await getServerPb();
    const body = await req.json() as CreateAppointmentDto;

    console.log('[POST /api/appointments] Request body:', body);

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
    const createData: Record<string, unknown> = {
      calcom_booking_id: body.calcom_booking_id,
      scheduled_at: body.scheduled_at,
      status: body.status || 'scheduled',
      source: 'manual',
      duration: body.duration || 60,
      confirmation_sent: false,
      reminder_24h_sent: false,
      reminder_2h_sent: false
    };

    if (body.lead_id) createData.lead_id = body.lead_id;
    if (body.location) createData.location = body.location;
    if (body.meeting_url) createData.meeting_url = body.meeting_url;
    if (body.notes) createData.notes = body.notes;
    if (body.calcom_event_id) createData.calcom_event_id = body.calcom_event_id;

    console.log('[POST /api/appointments] Create data:', createData);
    console.log('[POST /api/appointments] PB auth valid:', pb.authStore.isValid);

    const appointment = await pb.collection('appointments').create<Appointment>(createData);

    console.log('[POST /api/appointments] Created appointment:', appointment);

    // Send confirmation message (fire-and-forget - don't fail if confirmation errors)
    if (appointment.lead_id) {
      const { sendAppointmentConfirmation } = await import('@/lib/api/appointments');
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
    console.error('[POST /api/appointments] Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create appointment',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
