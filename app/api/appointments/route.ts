import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import type { CreateAppointmentDto } from '@/types/appointment';
import type { Appointment } from '@/types/appointment';
import { canViewAllLeads } from '@/lib/utils/permissions';

/**
 * GET /api/appointments - Get all appointments with filtering
 */
export async function GET(req: NextRequest) {
  try {
    const pb = await getServerPb();
    const user = pb.authStore.model as any;

    // Check if user has permission to view appointments (same as viewing leads)
    if (!user || !canViewAllLeads(user?.role)) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have permission to view appointments' },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '50');
    const leadId = searchParams.get('leadId') || undefined;
    const status = searchParams.get('status') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const sort = searchParams.get('sort') || '-scheduled_at';
    const expand = searchParams.get('expand') || undefined;

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

    // Add expand if provided
    if (expand) {
      options.expand = expand;
    }

    const response = await pb.collection<Appointment>('appointments').getList(page, perPage, options);

    // Manually expand lead data since PocketBase expand might not work
    let items: any[] = response.items;
    if (expand?.includes('lead_id')) {
      items = await Promise.all(
        response.items.map(async (apt) => {
          if (apt.lead_id) {
            try {
              const lead = await pb.collection('leads').getOne(apt.lead_id);
              return { ...apt, expand: { lead_id: lead } };
            } catch (e) {
              // Lead might be deleted - silently skip expand for this appointment
              return apt;
            }
          }
          return apt;
        })
      );
    }

    return NextResponse.json({
      page: response.page,
      perPage: response.perPage,
      totalItems: response.totalItems,
      totalPages: response.totalPages,
      items: items,
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
    const user = pb.authStore.model as any;

    // Check if user is authenticated (all authenticated roles can create appointments)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

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

    // Validate working hours (09:00 - 18:00)
    const scheduledAt = new Date(body.scheduled_at);
    const scheduledHour = scheduledAt.getHours();
    const scheduledMinutes = scheduledAt.getMinutes();

    if (scheduledHour < 9 || (scheduledHour === 18 && scheduledMinutes > 0) || scheduledHour > 18) {
      return NextResponse.json(
        {
          success: false,
          message: 'Toplantılar 09:00 - 18:00 saatleri arasında planlanabilir',
        },
        { status: 400 }
      );
    }

    // Check for scheduling conflicts
    const duration = body.duration || 60;
    const scheduledEnd = new Date(scheduledAt.getTime() + duration * 60 * 1000);

    // Fetch appointments on the same day (within a reasonable range)
    const dayStart = new Date(scheduledAt);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(scheduledAt);
    dayEnd.setHours(23, 59, 59, 999);

    const conflictingAppointments = await pb.collection('appointments').getList(1, 100, {
      filter: `scheduled_at >= "${dayStart.toISOString()}" && scheduled_at <= "${dayEnd.toISOString()}" && status != "cancelled"`,
    });

    // Check for overlaps
    for (const apt of conflictingAppointments.items) {
      const aptStart = new Date(apt.scheduled_at);
      const aptEnd = new Date(aptStart.getTime() + (apt.duration || 60) * 60 * 1000);

      // Check if time ranges overlap
      const hasOverlap = scheduledAt < aptEnd && scheduledEnd > aptStart;

      if (hasOverlap) {
        // Fetch lead name for better error message
        let leadName = 'İsimsiz';
        if (apt.lead_id) {
          try {
            const lead = await pb.collection('leads').getOne(apt.lead_id);
            leadName = lead.name;
          } catch (e) {
            // Ignore lead fetch errors
          }
        }

        const aptTime = aptStart.toLocaleString('tr-TR', {
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit',
        });

        return NextResponse.json(
          {
            success: false,
            message: `Bu saatte başka bir randevu var: ${leadName} (${aptTime})`,
            conflict: {
              appointmentId: apt.id,
              leadName,
              scheduledAt: apt.scheduled_at,
            },
          },
          { status: 409 } // Conflict status code
        );
      }
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

    // Update lead status to 'booked' and send confirmation message (fire-and-forget)
    if (appointment.lead_id) {
      const { sendAppointmentConfirmation, updateLeadStatusToBooked } = await import('@/lib/api/appointments');

      // Update lead status to 'booked'
      updateLeadStatusToBooked(appointment.lead_id).catch(error => {
        console.error('[POST /api/appointments] Lead status update error:', error);
      });

      // Send confirmation message
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
