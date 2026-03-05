import { NextRequest, NextResponse } from 'next/server';
import { updateProposalResponse } from '@/lib/api/proposals';
import { getProposalByToken } from '@/lib/api/proposals';
import { updateLeadStatusBasedOnProposal } from '@/lib/utils/status';
import pb from '@/lib/pocketbase';
import { sendWhatsAppMessage, logWhatsAppMessage } from '@/lib/api/whatsapp';

/**
 * POST /api/proposals/respond
 * Handle proposal response (accept/reject)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.token || !body.response) {
      return NextResponse.json(
        { error: 'token and response are required' },
        { status: 400 }
      );
    }

    // Validate response value
    if (!['kabul', 'red'].includes(body.response)) {
      return NextResponse.json(
        { error: 'response must be either "kabul" or "red"' },
        { status: 400 }
      );
    }

    // Get proposal by token
    const proposal = await getProposalByToken(body.token);

    if (!proposal) {
      return NextResponse.json(
        { error: 'Invalid or expired proposal token' },
        { status: 404 }
      );
    }

    // Check if already responded
    if (proposal.response !== 'cevap_bekleniyor') {
      return NextResponse.json(
        { error: 'Proposal already responded' },
        { status: 400 }
      );
    }

    // Update proposal response
    await updateProposalResponse(pb, body.token, body.response as any, body.comment);

    // Update lead status immediately based on proposal response (per CONTEXT)
    const statusUpdate = await updateLeadStatusBasedOnProposal(pb, proposal.lead_id);
    console.log('[POST /api/proposals/respond] Status update:', statusUpdate);

    // Get lead info for notification
    const lead = await pb.collection('leads').getOne(proposal.lead_id);

    // Send notification to sales team via WhatsApp
    const responseText = body.response === 'kabul' ? 'kabul etti' : 'reddetti';
    const notificationMessage = `🔔 Teklif ${responseText}!\n\nMüşteri: ${lead.name}\nTelefon: ${lead.phone}\nCevap: ${body.response === 'kabul' ? 'Kabul' : 'Red'}${body.comment ? `\nGerekçe: ${body.comment}` : ''}`;

    // Send to sales team WhatsApp number (configure this in env)
    const salesPhone = process.env.SALES_WHATSAPP_NUMBER || '905551234567';
    const chatId = salesPhone.replace(/\D/g, '') + '@c.us';

    try {
      const whatsappResult = await sendWhatsAppMessage(chatId, notificationMessage);

      if (whatsappResult) {
        await logWhatsAppMessage({
          lead_id: proposal.lead_id,
          direction: 'outgoing',
          message_text: notificationMessage,
          message_type: 'info',
          status: 'sent',
          sent_at: new Date().toISOString(),
          green_api_id: whatsappResult.idMessage,
        });
      }
    } catch (whatsappError) {
      // Log but don't fail the response if WhatsApp fails
      console.error('Failed to send WhatsApp notification:', whatsappError);
    }

    return NextResponse.json({
      success: true,
      message: 'Proposal response recorded',
      statusUpdate: statusUpdate.updated ? {
        previousStatus: statusUpdate.previousStatus,
        newStatus: statusUpdate.newStatus,
        reason: statusUpdate.reason
      } : null
    });
  } catch (error: any) {
    console.error('POST /api/proposals/respond error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record response' },
      { status: 500 }
    );
  }
}
