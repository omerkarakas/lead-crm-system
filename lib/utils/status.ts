import type PocketBase from 'pocketbase';
import type { Lead } from '@/types/lead';
import { LeadStatus } from '@/types/lead';
import type { ProposalResponse } from '@/types/proposal';
import type { Role } from '@/types/user';

/**
 * Status update result
 */
export interface StatusUpdateResult {
  updated: boolean;
  previousStatus?: LeadStatus;
  newStatus?: LeadStatus;
  reason: string;
}

/**
 * Get the latest proposal for a lead
 */
async function getLatestProposal(
  pb: PocketBase,
  leadId: string
): Promise<{ response: ProposalResponse } | null> {
  try {
    const proposals = await pb.collection('proposals').getList(1, 1, {
      filter: `lead_id = "${leadId}"`,
      sort: '-created'
    });

    if (proposals.items.length > 0) {
      return proposals.items[0] as unknown as { response: ProposalResponse };
    }

    return null;
  } catch (error) {
    console.error('[getLatestProposal] Error:', error);
    return null;
  }
}

/**
 * Update lead status based on proposal response
 * - KABUL → CUSTOMER
 * - RED → LOST
 * - CEVAP_BEKLENIYOR → no change
 */
export async function updateLeadStatusBasedOnProposal(
  pb: PocketBase,
  leadId: string
): Promise<StatusUpdateResult> {
  try {
    // Get current lead status
    const lead = await pb.collection('leads').getOne<Lead>(leadId);
    const previousStatus = lead.status;

    // Get latest proposal
    const latestProposal = await getLatestProposal(pb, leadId);

    if (!latestProposal) {
      return {
        updated: false,
        reason: 'Teklif bulunamadı'
      };
    }

    // Determine new status based on proposal response
    let newStatus: LeadStatus | null = null;
    let reason = '';

    switch (latestProposal.response) {
      case 'kabul':
        newStatus = LeadStatus.CUSTOMER;
        reason = 'Teklif kabul edildi';
        break;
      case 'red':
        newStatus = LeadStatus.LOST;
        reason = 'Teklif reddedildi';
        break;
      case 'cevap_bekleniyor':
        return {
          updated: false,
          previousStatus,
          reason: 'Teklif cevap bekleniyor'
        };
    }

    // Check if status needs to be updated
    if (!newStatus || newStatus === previousStatus) {
      return {
        updated: false,
        previousStatus,
        reason: newStatus === previousStatus
          ? `Durum zaten ${getLeadStatusLabel(previousStatus)}`
          : 'Durum güncellemesi gerekmiyor'
      };
    }

    // Update lead status with auto-update tracking
    await pb.collection('leads').update(leadId, {
      status: newStatus,
      auto_updated_status: true,
      auto_updated_at: new Date().toISOString()
    });

    console.log(`[updateLeadStatusBasedOnProposal] Lead ${leadId}: ${previousStatus} → ${newStatus} (${reason}, auto_updated: true)`);

    return {
      updated: true,
      previousStatus,
      newStatus,
      reason
    };
  } catch (error) {
    console.error('[updateLeadStatusBasedOnProposal] Error:', error);
    return {
      updated: false,
      reason: 'Durum güncellenirken hata oluştu'
    };
  }
}

/**
 * Check if user role can override lead status
 * - Admin: true
 * - Sales: false
 * - Marketing: false
 */
export function canOverrideStatus(userRole: Role): boolean {
  return userRole === 'admin';
}

/**
 * Check if status was auto-updated from proposal response
 */
export function isStatusAutoUpdated(lead: Lead): boolean {
  return lead.auto_updated_status === true;
}

/**
 * Get warning message for status override
 */
export function getStatusOverrideWarning(lead: Lead): string | null {
  if (isStatusAutoUpdated(lead)) {
    return 'Bu durum otomatik olarak teklif yanıtından güncellendi. Değiştirmek için "Zorla" seçeneğini işaretleyin.';
  }
  return null;
}

/**
 * Get lead status label in Turkish
 */
function getLeadStatusLabel(status: LeadStatus): string {
  const labels: Record<LeadStatus, string> = {
    new: 'Yeni',
    qualified: 'Nitelikli',
    booked: 'Randevu alındı',
    customer: 'Müşteri',
    lost: 'Kaybedildi',
    're-apply': 'Yeniden başvuru'
  };
  return labels[status] || status;
}

/**
 * Get proposal response reason in Turkish
 */
export function getLeadStatusReason(proposalResponse: ProposalResponse): string {
  const reasons: Record<ProposalResponse, string> = {
    kabul: 'Teklif kabul edildi',
    red: 'Teklif reddedildi',
    cevap_bekleniyor: 'Teklif cevap bekleniyor'
  };
  return reasons[proposalResponse] || 'Bilinmeyen durum';
}
