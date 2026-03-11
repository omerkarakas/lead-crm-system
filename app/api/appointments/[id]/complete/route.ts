import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import type { Appointment } from '@/types/appointment';
import type { Lead } from '@/types/lead';

/**
 * POST /api/appointments/[id]/complete
 * Mark appointment as completed
 * IMPORTANT: Does NOT update lead status - only proposal responses affect lead status
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const pb = await getServerPb();
    const { id } = await params;

    // Get appointment with lead relation
    const appointment = await pb.collection<Appointment & { expand?: { lead_id?: Lead } }>('appointments').getOne(id, {
      expand: 'lead_id'
    });

    if (!appointment.lead_id) {
      return NextResponse.json(
        {
          success: false,
          message: 'No lead associated with this appointment'
        },
        { status: 400 }
      );
    }

    // Update appointment status to completed
    const updatedAppointment = await pb.collection('appointments').update(id, {
      status: 'completed'
    });

    // Get current lead status for response (read-only, no update)
    const lead = appointment.expand?.lead_id;
    const currentLeadStatus = lead?.status;

    console.log(`[POST /api/appointments/[id]/complete] Appointment ${id} completed. Lead ${appointment.lead_id} status remains: ${currentLeadStatus} (appointment completion does not change lead status)`);

    return NextResponse.json({
      success: true,
      message: 'Randevu tamamlandı',
      appointment: updatedAppointment,
      lead_id: appointment.lead_id,
      lead_status: currentLeadStatus,
      note: 'Randevu tamamlanması lead statüsünü değiştirmez. Sadece teklif cevabı statüyü günceller.'
    });
  } catch (error) {
    console.error('[POST /api/appointments/[id]/complete] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to complete appointment',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
