import { NextRequest, NextResponse } from 'next/server';
import { updateProposalResponse } from '@/lib/api/proposals';
import { getProposalByToken } from '@/lib/api/proposals';
import { updateLeadStatusBasedOnProposal } from '@/lib/utils/status';
import { sendProposalResponseNotification } from '@/lib/api/notifications';
import { getServerPb } from '@/lib/pocketbase/server';
import type { ProposalResponse } from '@/types/proposal';

/**
 * POST /api/proposals/respond
 * Handle proposal response (accept/reject)
 */
export async function POST(request: NextRequest) {
  const pb = await getServerPb();

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
    const updatedProposal = await updateProposalResponse(
      pb,
      body.token,
      body.response as ProposalResponse,
      body.comment
    );

    // Update lead status immediately based on proposal response (per CONTEXT)
    const statusUpdate = await updateLeadStatusBasedOnProposal(pb, proposal.lead_id);
    console.log('[POST /api/proposals/respond] Status update:', statusUpdate);

    // Get lead info for notification
    const lead = await pb.collection('leads').getOne(proposal.lead_id);

    // Send notification to sales team via WhatsApp
    const notificationResult = await sendProposalResponseNotification(
      pb,
      updatedProposal,
      lead as any
    );

    // Log response for audit trail
    console.log('[Proposal Response] Recorded:', {
      proposal_id: proposal.id,
      lead_id: proposal.lead_id,
      response: body.response,
      comment: body.comment,
      notified_count: notificationResult.notified_count,
      notification_errors: notificationResult.errors,
    });

    return NextResponse.json({
      success: true,
      message: 'Proposal response recorded',
      proposal_id: proposal.id,
      lead_id: proposal.lead_id,
      notified_count: notificationResult.notified_count,
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
