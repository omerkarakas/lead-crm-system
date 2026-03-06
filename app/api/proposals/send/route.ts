import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { sendProposalViaWhatsApp } from '@/lib/api/proposals/send';
import { canSendProposals } from '@/lib/utils/permissions';

/**
 * POST /api/proposals/send
 * Send proposal via WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    const pb = await getServerPb();
    const user = pb.authStore.model as any;

    // Check if user has permission to send proposals
    if (!canSendProposals(user?.role)) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have permission to send proposals' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.lead_id || !body.template_id) {
      return NextResponse.json(
        { error: 'lead_id and template_id are required' },
        { status: 400 }
      );
    }

    // Verify lead exists
    try {
      await pb.collection('leads').getOne(body.lead_id);
    } catch (error) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Verify template exists and is active
    try {
      const template = await pb.collection('proposal_templates').getOne(body.template_id, {
        filter: 'is_deleted = false',
      });
      if (!template.is_active) {
        return NextResponse.json(
          { error: 'Template is not active' },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Send proposal
    const result = await sendProposalViaWhatsApp(
      body.lead_id,
      body.template_id,
      body.variables,
      body.expires_in_days || 3
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send proposal' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      proposal_id: result.proposal_id,
      token: result.token,
      link: result.link,
      message: 'Proposal sent successfully',
    });
  } catch (error: any) {
    console.error('POST /api/proposals/send error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send proposal' },
      { status: 500 }
    );
  }
}
