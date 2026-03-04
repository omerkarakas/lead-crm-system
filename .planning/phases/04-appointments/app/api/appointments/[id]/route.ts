import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import type { Appointment } from '@/types/appointment';

/**
 * GET /api/appointments/[id] - Get single appointment
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pb = await getServerPb();

    const appointment = await pb.collection<Appointment>('appointments').getOne<Appointment>(id);

    return NextResponse.json(appointment);
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
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pb = await getServerPb();
    const body = await request.json();

    const appointment = await pb.collection('appointments').update<Appointment>(id, body);

    return NextResponse.json({
      success: true,
      message: 'Appointment updated',
      appointment
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pb = await getServerPb();

    await pb.collection('appointments').delete(id);

    return NextResponse.json({
      success: true,
      message: 'Appointment deleted'
    });
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
