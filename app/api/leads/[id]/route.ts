import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import type { Lead } from '@/types/lead';
import { canViewAllLeads, canEditLeads, canDeleteLeads } from '@/lib/utils/permissions';

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
    const user = pb.authStore.model as any;

    // Check if user has permission to view leads
    if (!user || !canViewAllLeads(user?.role)) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have permission to view leads' },
        { status: 403 }
      );
    }

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
    const user = pb.authStore.model as any;
    const body = await request.json();

    // Check if user has permission to edit leads
    if (!user || !canEditLeads(user?.role)) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have permission to edit leads' },
        { status: 403 }
      );
    }

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
    const user = pb.authStore.model as any;

    // Check if user has permission to delete leads (admin only)
    if (!user || !canDeleteLeads(user?.role)) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have permission to delete leads' },
        { status: 403 }
      );
    }

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
