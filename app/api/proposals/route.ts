import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { createProposal } from '@/lib/api/proposals';
import type { CreateProposalDto } from '@/types/proposal';

/**
 * GET /api/proposals
 * List proposals with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const pb = await getServerPb();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');
    const leadId = searchParams.get('leadId') || undefined;
    const response = searchParams.get('response') || undefined;
    const sort = searchParams.get('sort') || '-created'; // Support 'newest' or 'oldest'

    let filter = '';

    if (leadId) {
      filter = `lead_id = "${leadId}"`;
    }

    if (response) {
      if (filter) {
        filter += ` && response = "${response}"`;
      } else {
        filter = `response = "${response}"`;
      }
    }

    const options: any = {
      sort: sort === 'oldest' ? 'created' : '-created',
      expand: 'lead_id,template_id',
    };

    if (filter) {
      options.filter = filter;
    }

    const result = await pb.collection('proposals').getList(page, perPage, options);

    return NextResponse.json({
      items: result.items,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
    });
  } catch (error: any) {
    console.error('GET /api/proposals error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch proposals' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/proposals
 * Create a new proposal
 */
export async function POST(request: NextRequest) {
  try {
    const pb = await getServerPb();

    const body = await request.json();

    // Validate required fields
    if (!body.lead_id || !body.template_id) {
      return NextResponse.json(
        { error: 'lead_id and template_id are required' },
        { status: 400 }
      );
    }

    const createDto: CreateProposalDto = {
      lead_id: body.lead_id,
      template_id: body.template_id,
      variables: body.variables,
      expires_in_days: body.expires_in_days || 3,
    };

    const proposal = await createProposal(createDto);

    return NextResponse.json(proposal, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/proposals error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create proposal' },
      { status: 500 }
    );
  }
}
