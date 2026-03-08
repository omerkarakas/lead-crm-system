import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import type { Lead } from '@/types/lead';
import { canViewAllLeads, canEditLeads, canDeleteLeads } from '@/lib/utils/permissions';
import { evaluateAndEnroll } from '@/lib/api/enrollments';

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
 * Triggers campaign re-evaluation when score, status, tags, or source changes
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

    // Detect if any field that affects campaign segments is changing
    const segmentFields = ['score', 'status', 'tags', 'source'];
    const changedSegmentFields = segmentFields.filter(field => field in body);

    // Fetch current lead for comparison
    let oldLead: Lead | null = null;
    if (changedSegmentFields.length > 0) {
      try {
        oldLead = await pb.collection<Lead>('leads').getOne<Lead>(id);
      } catch (e) {
        console.warn('[PUT /api/leads/:id] Could not fetch old lead for comparison:', e);
      }
    }

    // Check if values actually changed
    const actuallyChanged = changedSegmentFields.filter(field => {
      if (!oldLead) return true;
      const oldValue = (oldLead as any)[field];
      const newValue = body[field];

      // Handle array comparison (tags)
      if (Array.isArray(oldValue) && Array.isArray(newValue)) {
        return JSON.stringify(oldValue) !== JSON.stringify(newValue);
      }

      return oldValue !== newValue;
    });

    // Update lead
    const lead = await pb.collection('leads').update<Lead>(id, body);

    // Trigger campaign re-evaluation if segment fields changed
    if (actuallyChanged.length > 0) {
      console.log('[PUT /api/leads/:id] Segment fields changed:', actuallyChanged, '- triggering re-evaluation');

      // Fire-and-forget re-evaluation
      evaluateAndEnroll(pb, id).catch((err) => {
        console.error('[PUT /api/leads/:id] Failed to trigger campaign re-evaluation:', err);
      });
    }

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
