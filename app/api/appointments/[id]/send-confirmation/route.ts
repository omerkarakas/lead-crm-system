import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';

/**
 * POST /api/appointments/[id]/send-confirmation
 * Send WhatsApp confirmation message for an appointment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pb = await getServerPb();
    const user = pb.authStore.model as any;

    // Check if user is authenticated
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    // Fetch appointment (without expand - PocketBase expand doesn't work)
    const appointment = await pb.collection('appointments').getOne(id);

    if (!appointment.lead_id) {
      return NextResponse.json(
        { error: 'No lead associated with this appointment' },
        { status: 400 }
      );
    }

    // Manually fetch lead
    const lead = await pb.collection('leads').getOne(appointment.lead_id);

    // Import WhatsApp functions
    const { sendWhatsAppMessage, logWhatsAppMessage } = await import('@/lib/api/whatsapp');
    const { formatConfirmationMessage } = await import('@/lib/whatsapp/appointment-messages');

    // Format phone number for WhatsApp (Green API format: no + sign)
    const formatPhoneForWhatsApp = (phone: string): string => {
      const cleanPhone = phone.replace(/\D/g, '');
      // Green API wants: country_code + number @c.us (no + sign)
      if (cleanPhone.startsWith('90') && cleanPhone.length === 12) {
        return cleanPhone; // Already has 90 prefix
      }
      if (cleanPhone.length === 10) {
        return `90${cleanPhone}`; // Add 90 prefix
      }
      return cleanPhone;
    };

    const chatId = formatPhoneForWhatsApp(lead.phone) + '@c.us';
    console.log('[send-confirmation] Lead phone:', lead.phone);
    console.log('[send-confirmation] Formatted chatId:', chatId);

    // Format confirmation message
    const messageText = formatConfirmationMessage(lead.name, appointment);
    console.log('[send-confirmation] Message:', messageText);

    // Send WhatsApp message
    const result = await sendWhatsAppMessage(chatId, messageText);

    if (result) {
      // Log message
      await logWhatsAppMessage({
        lead_id: lead.id,
        direction: 'outgoing',
        message_text: messageText,
        message_type: 'info',
        status: 'sent',
        sent_at: new Date().toISOString(),
        green_api_id: result.idMessage
      });

      // Update confirmation_sent flag
      await pb.collection('appointments').update(id, {
        confirmation_sent: true
      });

      return NextResponse.json({
        success: true,
        message: 'Confirmation sent successfully'
      });
    }

    return NextResponse.json(
      { error: 'Failed to send WhatsApp message' },
      { status: 500 }
    );
  } catch (error) {
    console.error('[POST /api/appointments/[id]/send-confirmation] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send confirmation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
