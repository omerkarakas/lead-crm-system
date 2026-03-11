import PocketBase from 'pocketbase';
import type {
  CampaignEnrollment,
  CreateEnrollmentDto,
  EnrollmentStatus,
  UnsubscribeRequest,
  Campaign,
  Sequence,
} from '@/types/campaign';
import type { Lead } from '@/types/lead';
import { fetchCampaigns, leadMatchesSegment } from './campaigns';

// Create dedicated PocketBase instance for enrollments
const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const pb = new PocketBase(PB_URL);

// Load auth from cookie if available (client-side only)
if (typeof window !== 'undefined') {
  const cookies = document.cookie.split(';');
  const pbCookie = cookies.find(c => c.trim().startsWith('pb_auth='));
  if (pbCookie) {
    try {
      pb.authStore.loadFromCookie(pbCookie.trim());
    } catch (e) {
      console.warn('Failed to load auth from cookie:', e);
    }
  }
}

/**
 * Generate random 32-character unsubscribe token
 */
export function generateUnsubscribeToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Check if lead is already enrolled in campaign
 */
export async function isAlreadyEnrolled(
  pb: PocketBase,
  lead_id: string,
  campaign_id: string
): Promise<boolean> {
  try {
    const response = await pb.collection('campaign_enrollments').getList(1, 1, {
      filter: `lead_id = "${lead_id}" && campaign_id = "${campaign_id}"`,
    });
    return response.totalItems > 0;
  } catch (error) {
    console.error('[isAlreadyEnrolled] Error:', error);
    return false;
  }
}

/**
 * Check if lead matches campaign segment
 */
export function evaluateCampaignEligibility(
  lead: Lead,
  campaign: Campaign
): boolean {
  // Check if campaign is active
  if (!campaign.is_active) {
    return false;
  }

  // Check if lead matches audience segment
  return leadMatchesSegment(lead, campaign.audience_segment);
}

/**
 * Check if lead can enroll in campaign
 */
export async function checkEnrollmentEligibility(
  pb: PocketBase,
  lead_id: string,
  campaign_id: string
): Promise<{ eligible: boolean; reason?: string }> {
  try {
    // Check if already enrolled
    const alreadyEnrolled = await isAlreadyEnrolled(pb, lead_id, campaign_id);
    if (alreadyEnrolled) {
      return { eligible: false, reason: 'Already enrolled in this campaign' };
    }

    // Fetch lead and campaign
    const lead = await pb.collection('leads').getOne<Lead>(lead_id);
    const campaign = await pb.collection('campaigns').getOne<Campaign>(campaign_id);

    if (!lead) {
      return { eligible: false, reason: 'Lead not found' };
    }

    if (!campaign) {
      return { eligible: false, reason: 'Campaign not found' };
    }

    // Check campaign eligibility
    const matchesSegment = evaluateCampaignEligibility(lead, campaign);
    if (!matchesSegment) {
      return { eligible: false, reason: 'Lead does not match campaign segment' };
    }

    return { eligible: true };
  } catch (error: any) {
    console.error('[checkEnrollmentEligibility] Error:', error);
    return { eligible: false, reason: error.message || 'Unknown error' };
  }
}

/**
 * Enroll lead in campaign
 */
export async function enrollLeadInCampaign(
  pb: PocketBase,
  lead_id: string,
  campaign_id: string,
  sequence_id?: string
): Promise<CampaignEnrollment> {
  // Check eligibility first
  const eligibility = await checkEnrollmentEligibility(pb, lead_id, campaign_id);
  if (!eligibility.eligible) {
    throw new Error(eligibility.reason || 'Not eligible for enrollment');
  }

  // If sequence_id not provided, get the first active sequence for the campaign
  let finalSequenceId = sequence_id;
  if (!finalSequenceId) {
    const sequences = await pb.collection('sequences').getList<Sequence>(1, 1, {
      filter: `campaign_id = "${campaign_id}" && is_active = true`,
      sort: 'created',
    });
    if (sequences.items.length === 0) {
      throw new Error('No active sequence found for this campaign');
    }
    finalSequenceId = sequences.items[0].id;
  }

  // Generate unsubscribe token
  const unsubscribeToken = generateUnsubscribeToken();

  // Create enrollment
  const enrollment = await pb.collection('campaign_enrollments').create<CampaignEnrollment>({
    campaign_id,
    sequence_id: finalSequenceId,
    lead_id,
    status: 'active',
    current_step: 0,
    enrolled_at: new Date().toISOString(),
    unsubscribe_token: unsubscribeToken,
  });

  // Increment lead's enrollment_count
  try {
    const lead = await pb.collection('leads').getOne(lead_id);
    const currentCount = (lead as any).enrollment_count || 0;
    await pb.collection('leads').update(lead_id, {
      enrollment_count: currentCount + 1,
    });
  } catch (error) {
    console.error('[enrollLeadInCampaign] Failed to increment enrollment_count:', error);
  }

  console.log('[enrollLeadInCampaign] Enrolled lead', lead_id, 'in campaign', campaign_id);

  return enrollment;
}

/**
 * Unsubscribe lead from campaign
 */
export async function unenrollLeadFromCampaign(
  pb: PocketBase,
  enrollment_id: string
): Promise<CampaignEnrollment> {
  const enrollment = await pb.collection('campaign_enrollments').update<CampaignEnrollment>(
    enrollment_id,
    {
      status: 'unsubscribed',
      unsubscribed_at: new Date().toISOString(),
    }
  );

  console.log('[unenrollLeadFromCampaign] Unsubscribed enrollment', enrollment_id);

  return enrollment;
}

/**
 * Get all enrollments for a lead
 */
export async function getLeadEnrollments(
  pb: PocketBase,
  lead_id: string
): Promise<CampaignEnrollment[]> {
  try {
    const response = await pb.collection('campaign_enrollments').getList<CampaignEnrollment>(
      1,
      100,
      {
        filter: `lead_id = "${lead_id}"`,
        sort: '-enrolled_at',
        expand: 'campaign_id,sequence_id',
      }
    );

    return response.items;
  } catch (error: any) {
    // Silently ignore auto-cancellation errors
    if (error.name === 'ClientAbortError' || error?.message?.includes('autocancelled')) {
      return [];
    }
    console.error('[getLeadEnrollments] Error:', error);
    return [];
  }
}

/**
 * Get all enrollments for a campaign
 */
export async function getCampaignEnrollments(
  pb: PocketBase,
  campaign_id: string
): Promise<CampaignEnrollment[]> {
  try {
    const response = await pb.collection('campaign_enrollments').getList<CampaignEnrollment>(
      1,
      500,
      {
        filter: `campaign_id = "${campaign_id}"`,
        sort: '-enrolled_at',
        expand: 'lead_id,sequence_id',
      }
    );

    return response.items;
  } catch (error: any) {
    // Silently ignore auto-cancellation errors
    if (error.name === 'ClientAbortError' || error?.message?.includes('autocancelled')) {
      return [];
    }
    console.error('[getCampaignEnrollments] Error:', error);
    return [];
  }
}

/**
 * Get enrollment via unsubscribe token
 */
export async function getEnrollmentByToken(
  pb: PocketBase,
  token: string
): Promise<CampaignEnrollment | null> {
  try {
    const enrollment = await pb.collection('campaign_enrollments').getFirstListItem<CampaignEnrollment>(
      `unsubscribe_token = "${token}"`,
      {
        expand: 'campaign_id,sequence_id,lead_id',
      }
    );
    return enrollment;
  } catch (error: any) {
    console.error('[getEnrollmentByToken] Error:', error);
    return null;
  }
}

/**
 * Find all campaigns lead is eligible for
 */
export async function findEligibleCampaigns(pb: PocketBase, lead: Lead): Promise<Campaign[]> {
  try {
    // Fetch all active campaigns
    const campaignsData = await fetchCampaigns(1, 100);
    const campaigns = campaignsData.items;

    // Filter campaigns that lead is eligible for
    const eligibleCampaigns: Campaign[] = [];

    for (const campaign of campaigns) {
      if (!campaign.is_active) {
        continue;
      }

      // Check if already enrolled
      const alreadyEnrolled = await isAlreadyEnrolled(pb, lead.id, campaign.id);
      if (alreadyEnrolled) {
        continue;
      }

      // Check if matches segment
      if (evaluateCampaignEligibility(lead, campaign)) {
        eligibleCampaigns.push(campaign);
      }
    }

    return eligibleCampaigns;
  } catch (error: any) {
    console.error('[findEligibleCampaigns] Error:', error);
    return [];
  }
}

/**
 * Auto-enroll lead in all eligible campaigns
 */
export async function autoEnrollLead(pb: PocketBase, lead: Lead): Promise<{
  enrolled: number;
  campaigns: Campaign[];
  errors: Array<{ campaign: Campaign; error: string }>;
}> {
  const eligibleCampaigns = await findEligibleCampaigns(pb, lead);

  const enrolled: Campaign[] = [];
  const errors: Array<{ campaign: Campaign; error: string }> = [];

  for (const campaign of eligibleCampaigns) {
    try {
      await enrollLeadInCampaign(pb, lead.id, campaign.id);
      enrolled.push(campaign);
    } catch (error: any) {
      console.error('[autoEnrollLead] Failed to enroll in campaign', campaign.id, error);
      errors.push({
        campaign,
        error: error.message || 'Unknown error',
      });
    }
  }

  console.log('[autoEnrollLead] Enrolled lead', lead.id, 'in', enrolled.length, 'campaigns');

  return {
    enrolled: enrolled.length,
    campaigns: enrolled,
    errors,
  };
}

/**
 * Re-evaluate and enroll after lead data changes
 */
export async function evaluateAndEnroll(pb: PocketBase, lead_id: string): Promise<{
  enrolled: number;
  campaigns: Campaign[];
}> {
  try {
    // Fetch lead
    const lead = await pb.collection('leads').getOne<Lead>(lead_id);
    if (!lead) {
      throw new Error('Lead not found');
    }

    // Auto-enroll in eligible campaigns
    const result = await autoEnrollLead(pb, lead);

    return {
      enrolled: result.enrolled,
      campaigns: result.campaigns,
    };
  } catch (error: any) {
    console.error('[evaluateAndEnroll] Error:', error);
    return {
      enrolled: 0,
      campaigns: [],
    };
  }
}

/**
 * Advance enrollment to next step
 */
export async function advanceEnrollmentStep(
  pb: PocketBase,
  enrollment_id: string
): Promise<CampaignEnrollment> {
  const enrollment = await pb.collection('campaign_enrollments').getOne<CampaignEnrollment>(
    enrollment_id
  );

  const updated = await pb.collection('campaign_enrollments').update<CampaignEnrollment>(
    enrollment_id,
    {
      current_step: enrollment.current_step + 1,
    }
  );

  console.log('[advanceEnrollmentStep] Advanced enrollment', enrollment_id, 'to step', updated.current_step);

  return updated;
}

/**
 * Mark enrollment as completed
 */
export async function completeEnrollment(
  pb: PocketBase,
  enrollment_id: string
): Promise<CampaignEnrollment> {
  const enrollment = await pb.collection('campaign_enrollments').update<CampaignEnrollment>(
    enrollment_id,
    {
      status: 'completed',
      completed_at: new Date().toISOString(),
    }
  );

  console.log('[completeEnrollment] Completed enrollment', enrollment_id);

  return enrollment;
}

/**
 * Mark enrollment as failed
 */
export async function failEnrollment(
  pb: PocketBase,
  enrollment_id: string,
  reason: string
): Promise<CampaignEnrollment> {
  const enrollment = await pb.collection('campaign_enrollments').update<CampaignEnrollment>(
    enrollment_id,
    {
      status: 'failed',
    }
  );

  console.log('[failEnrollment] Failed enrollment', enrollment_id, 'reason:', reason);

  return enrollment;
}

/**
 * Unsubscribe via public link token
 */
export async function unsubscribeByToken(
  pb: PocketBase,
  token: string,
  campaign_ids?: string[]
): Promise<{ success: boolean; unsubscribed: number; error?: string }> {
  try {
    // Get enrollment by token
    const enrollment = await getEnrollmentByToken(pb, token);
    if (!enrollment) {
      return { success: false, unsubscribed: 0, error: 'Invalid or expired unsubscribe link' };
    }

    // Get all enrollments for this lead
    const leadEnrollments = await getLeadEnrollments(pb, enrollment.lead_id);

    // Filter enrollments to unsubscribe
    let toUnsubscribe = leadEnrollments.filter((e) => e.status === 'active');

    if (campaign_ids && campaign_ids.length > 0) {
      // Only unsubscribe from specified campaigns
      toUnsubscribe = toUnsubscribe.filter((e) => campaign_ids.includes(e.campaign_id));
    }

    // Unsubscribe from each
    for (const e of toUnsubscribe) {
      await unenrollLeadFromCampaign(pb, e.id);
    }

    console.log('[unsubscribeByToken] Unsubscribed from', toUnsubscribe.length, 'campaigns');

    return { success: true, unsubscribed: toUnsubscribe.length };
  } catch (error: any) {
    console.error('[unsubscribeByToken] Error:', error);
    return { success: false, unsubscribed: 0, error: error.message || 'Unknown error' };
  }
}
