import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import type { Lead } from '@/types/lead';

/**
 * GET /api/leads/[id] - Get a single lead by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pb = await getServerPb();

    const lead = await pb.collection<Lead>('leads').getOne<Lead>(id);

    return NextResponse.json(lead);
  } catch (error) {
    console.error(`[GET /api/leads/${params}] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch lead',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/leads/[id] - Update a lead
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pb = await getServerPb();
    const body = await request.json();

    const lead = await pb.collection('leads').update<Lead>(id, body);

    return NextResponse.json({
      success: true,
      message: 'Lead updated',
      lead
    });
  } catch (error) {
    console.error(`[PUT /api/leads/${params}] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update lead',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/leads/[id] - Delete a lead
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pb = await getServerPb();

    await pb.collection('leads').delete(id);

    return NextResponse.json({
      success: true,
      message: 'Lead deleted'
    });
  } catch (error) {
    console.error(`[DELETE /api/leads/${params}] Error:`, error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete lead',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
