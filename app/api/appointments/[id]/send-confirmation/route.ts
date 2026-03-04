import { NextRequest, NextResponse } from 'next/server';
import { sendAppointmentConfirmation } from '@/lib/api/appointments';

/**
 * POST /api/appointments/[id]/send-confirmation
 *
 * Manual trigger for sending appointment confirmation message
 * Use for testing and manual resend of confirmations
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Appointment ID required' },
        { status: 400 }
      );
    }

    // Send confirmation message
    await sendAppointmentConfirmation(id);

    return NextResponse.json({
      success: true,
      message: 'Confirmation message sent'
    });
  } catch (error) {
    console.error('[POST /api/appointments/[id]/send-confirmation] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send confirmation',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
