import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { cancelScheduledReminders } from '@/lib/api/appointments';
import type { Appointment, UpdateAppointmentDto } from '@/types/appointment';

/**
 * GET /api/appointments/[id] - Get single appointment by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const pb = await getServerPb();
    const { id } = await params;

    const appointment = await pb.collection<Appointment>('appointments').getOne(id);

    return NextResponse.json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error('[GET /api/appointments/[id]] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch appointment',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/appointments/[id] - Update appointment
 *
 * Supports:
 * - Status updates (cancel, complete, reschedule)
 * - Field updates (date, time, location, notes, etc.)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const pb = await getServerPb();
    const { id } = await params;
    const body = await req.json() as UpdateAppointmentDto;

    console.log('[PATCH /api/appointments/[id]] Request body:', body);

    // Update appointment using server-side PocketBase
    const updatedAppointment = await pb.collection<Appointment>('appointments').update(id, body);

    console.log('[PATCH /api/appointments/[id]] Updated appointment:', updatedAppointment);

    // If status changed to cancelled or completed, cancel scheduled reminders
    if (body.status === 'cancelled' || body.status === 'completed') {
      await cancelScheduledReminders(id);
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment updated',
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error('[PATCH /api/appointments/[id]] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update appointment',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/appointments/[id] - Delete appointment
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const pb = await getServerPb();
    const { id } = await params;

    await pb.collection('appointments').delete(id);

    console.log('[DELETE /api/appointments/[id]] Deleted appointment:', id);

    return NextResponse.json(
      {
        success: true,
        message: 'Appointment deleted'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[DELETE /api/appointments/[id]] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete appointment',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
