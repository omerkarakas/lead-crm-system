import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { isStatusAutoUpdated, canOverrideStatus } from '@/lib/utils/status';
import type { Lead, LeadStatus } from '@/types/lead';
import type { Role } from '@/types/user';

/**
 * PATCH /api/appointments/[id]/status
 * Manual status override with role-based permission check
 * - Admin can override any status with force=true
 * - Sales can only override non-auto-updated status
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const pb = await getServerPb();
    const { id } = await params;
    const body = await req.json();

    // Get current user from auth store
    const user = pb.authStore.model as { role: Role } | null;
    if (!user) {
      return NextResponse.json(
        { error: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!body.lead_id || body.status === undefined) {
      return NextResponse.json(
        { error: 'lead_id and status are required' },
        { status: 400 }
      );
    }

    // Get lead with current status
    const lead = await pb.collection<Lead>('leads').getOne(body.lead_id);
    const previousStatus = lead.status;
    const newStatus = body.status as LeadStatus;
    const force = body.force === true;
    const reason = body.reason || 'Manuel durum güncellemesi';

    // Check if user is admin
    const isAdmin = user.role === 'admin';

    // If status is auto-updated from proposal response
    if (isStatusAutoUpdated(lead)) {
      // If not admin, block override
      if (!isAdmin) {
        return NextResponse.json(
          {
            error: 'Bu durum otomatik olarak teklif yanıtından güncellendi. Sadece admin değiştirebilir.',
            status_updated: false
          },
          { status: 403 }
        );
      }

      // If admin but not forcing, block with warning
      if (!force) {
        return NextResponse.json(
          {
            error: 'Bu durum otomatik olarak teklif yanıtından güncellendi. Değiştirmek için force=true gönderin.',
            warning: 'Bu durum otomatik olarak güncellendi. Değiştirmek için "Zorla" seçeneğini işaretleyin.',
            status_updated: false
          },
          { status: 403 }
        );
      }
    }

    // For sales users, check if they can override
    if (!isAdmin && !canOverrideStatus(user.role)) {
      // Sales can only override if status is NOT auto-updated
      if (isStatusAutoUpdated(lead)) {
        return NextResponse.json(
          {
            error: 'Otomatik güncellenmiş durumu değiştirmek için yetkiniz yok',
            status_updated: false
          },
          { status: 403 }
        );
      }
    }

    // Update lead status
    await pb.collection('leads').update(body.lead_id, {
      status: newStatus
    });

    console.log(`[PATCH /api/appointments/[id]/status] Lead ${body.lead_id}: ${previousStatus} → ${newStatus} (${reason}, forced: ${force && isAdmin})`);

    return NextResponse.json({
      success: true,
      message: 'Durum güncellendi',
      previous_status: previousStatus,
      new_status: newStatus,
      reason,
      forced: force && isAdmin
    });
  } catch (error) {
    console.error('[PATCH /api/appointments/[id]/status] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Durum güncellenirken hata oluştu',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
