import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { getProposalById } from '@/lib/api/proposals';

/**
 * GET /api/proposals/[id]
 * Get a single proposal by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const proposal = await getProposalById(params.id);

    return NextResponse.json(proposal);
  } catch (error: any) {
    console.error('GET /api/proposals/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch proposal' },
      { status: 404 }
    );
  }
}

/**
 * PATCH /api/proposals/[id]
 * Update a proposal (response, response_comment, responded_at)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pb = await getServerPb();

    const body = await request.json();

    // Get proposal first to get the token
    const proposal = await pb.collection('proposals').getOne(params.id);

    // Update proposal
    const updateData: any = {};
    if (body.response !== undefined) {
      updateData.response = body.response;
    }
    if (body.response_comment !== undefined) {
      updateData.response_comment = body.response_comment;
    }
    if (body.responded_at !== undefined) {
      updateData.responded_at = body.responded_at;
    }

    const updatedProposal = await pb.collection('proposals').update(
      params.id,
      updateData
    );

    // If response was updated, also update lead record
    if (body.response !== undefined) {
      await pb.collection('leads').update(proposal.lead_id, {
        offer_response: body.response,
        offer_responded_at: body.responded_at || new Date().toISOString(),
      });
    }

    return NextResponse.json(updatedProposal);
  } catch (error: any) {
    console.error('PATCH /api/proposals/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update proposal' },
      { status: 500 }
    );
  }
}
