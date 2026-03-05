import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { updateLeadStatusBasedOnProposal } from '@/lib/utils/status';
import type { Appointment, Lead } from '@/types/lead';

/**
 * POST /api/appointments/[id]/complete
 * Mark appointment as completed and check lead status based on proposal response
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

    // Check if lead has proposal response and update status
    const lead = appointment.expand?.lead_id;
    let statusUpdateInfo = null;

    if (lead) {
      // Check if status is already CUSTOMER or LOST from proposal response
      if (lead.status === 'customer' || lead.status === 'lost') {
        statusUpdateInfo = {
          status_updated: false,
          previousStatus: lead.status,
          newStatus: lead.status,
          reason: lead.status === 'customer'
            ? 'Durum zaten müşteri (teklif kabul edildi)'
            : 'Durum zaten kaybedildi (teklif reddedildi)'
        };
        console.log('[POST /api/appointments/[id]/complete] Status already updated from proposal response');
      } else {
        // Check if there's a proposal response and update status
        const statusUpdate = await updateLeadStatusBasedOnProposal(pb, appointment.lead_id);
        statusUpdateInfo = {
          status_updated: statusUpdate.updated,
          previousStatus: statusUpdate.previousStatus,
          newStatus: statusUpdate.newStatus,
          reason: statusUpdate.reason
        };
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment completed',
      appointment: updatedAppointment,
      lead_id: appointment.lead_id,
      status_update: statusUpdateInfo
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
