import pb from '@/lib/pocketbase';
import { getServerPb } from '@/lib/pocketbase/server';
import type PocketBase from 'pocketbase';
import type {
  Proposal,
  CreateProposalDto,
  ProposalTemplate,
  ProposalResponse,
} from '@/types/proposal';
import type { Lead } from '@/types/lead';
import type { Appointment } from '@/types/appointment';
import {
  substituteVariables,
  generateProposalToken,
  calculateExpirationDate,
  getLeadVariables,
} from '@/lib/utils/proposal';

/**
 * Generate proposal content by filling template with variables
 */
export function generateProposalContent(
  template: ProposalTemplate,
  variables: Record<string, string>
): string {
  return substituteVariables(template.content, variables);
}

/**
 * Create a new proposal
 */
export async function createProposal(
  data: CreateProposalDto
): Promise<Proposal> {
  // Fetch lead and template
  const lead = await pb.collection('leads').getOne<Lead>(data.lead_id);
  const template = await pb.collection('proposal_templates').getOne<ProposalTemplate>(data.template_id);

  // Get variables from lead
  const leadVars = getLeadVariables(lead);

  // Merge with custom variables
  const allVariables = { ...leadVars, ...data.variables };

  // Generate proposal content
  const filledContent = generateProposalContent(template, allVariables);

  // Generate token and expiration
  const token = generateProposalToken();
  const expiresAt = calculateExpirationDate(data.expires_in_days || 3);

  // Create proposal record
  const record = await pb.collection('proposals').create<Proposal>({
    lead_id: data.lead_id,
    template_id: data.template_id,
    content: template.content,
    filled_content: filledContent,
    variables_used: allVariables,
    token: token,
    expires_at: expiresAt.toISOString(),
    response: 'cevap_bekleniyor',
  });

  return record;
}

/**
 * Get all proposals for a lead
 */
export async function getProposalsByLead(leadId: string): Promise<Proposal[]> {
  const response = await pb.collection('proposals').getList<Proposal>(1, 50, {
    filter: `lead_id = "${leadId}"`,
    sort: '-created',
    expand: 'template_id',
  });

  return response.items;
}

/**
 * Get proposals for an appointment (by finding proposals for the lead associated with the appointment)
 */
export async function getProposalsByAppointment(appointmentId: string): Promise<Proposal[]> {
  // First get the appointment to find the lead_id
  const appointment = await pb.collection('appointments').getOne<Appointment>(appointmentId);

  if (!appointment.lead_id) {
    return [];
  }

  return getProposalsByLead(appointment.lead_id);
}

/**
 * Get proposal by token (with expiration check)
 */
export async function getProposalByToken(token: string): Promise<Proposal | null> {
  try {
    const proposal = await pb.collection('proposals').getFirstListItem<Proposal>(`token = "${token}"`, {
      expand: 'lead_id,template_id',
    });

    // Check expiration
    const expiresAt = new Date(proposal.expires_at);
    if (expiresAt < new Date()) {
      return null;
    }

    return proposal;
  } catch (error) {
    console.error('Get proposal by token error:', error);
    return null;
  }
}

/**
 * Update proposal response
 */
export async function updateProposalResponse(
  pbInstance: PocketBase,
  token: string,
  response: ProposalResponse,
  comment?: string
): Promise<Proposal> {
  const now = new Date().toISOString();

  // Get proposal by token first
  const proposal = await pbInstance.collection('proposals').getFirstListItem(`token = "${token}"`);

  // Update proposal
  await pbInstance.collection('proposals').update(proposal.id, {
    response: response,
    response_comment: comment || '',
    responded_at: now,
  });

  // Update lead record with response
  await pbInstance.collection('leads').update(proposal.lead_id, {
    offer_response: response,
    offer_responded_at: now,
  });

  // Fetch and return the updated proposal
  const updatedProposal = await pbInstance.collection('proposals').getOne<Proposal>(proposal.id);
  return updatedProposal;
}

/**
 * Get a single proposal by ID
 */
export async function getProposalById(id: string): Promise<Proposal> {
  return await pb.collection('proposals').getOne<Proposal>(id, {
    expand: 'lead_id,template_id',
  });
}

/**
 * List proposals with pagination
 */
export async function listProposals(params: {
  page?: number;
  perPage?: number;
  leadId?: string;
  response?: ProposalResponse;
}): Promise<{ items: Proposal[]; totalItems: number; totalPages: number }> {
  const page = params.page || 1;
  const perPage = params.perPage || 20;

  let filter = '';

  if (params.leadId) {
    filter = `lead_id = "${params.leadId}"`;
  }

  if (params.response) {
    if (filter) {
      filter += ` && response = "${params.response}"`;
    } else {
      filter = `response = "${params.response}"`;
    }
  }

  const response = await pb.collection('proposals').getList<Proposal>(page, perPage, {
    filter: filter || undefined,
    sort: '-created',
    expand: 'lead_id,template_id',
  });

  return {
    items: response.items,
    totalItems: response.totalItems,
    totalPages: response.totalPages,
  };
}

/**
 * Get proposal history for a specific proposal
 * Returns full audit trail including creation, sent, and response details
 */
export async function getProposalHistory(proposalId: string): Promise<Proposal | null> {
  try {
    const proposal = await pb.collection('proposals').getOne<Proposal>(proposalId, {
      expand: 'lead_id,template_id',
    });

    return proposal;
  } catch (error) {
    console.error('Get proposal history error:', error);
    return null;
  }
}

/**
 * Get all proposal history for a lead
 * Returns all proposals with full audit trail sorted by creation date
 */
export async function getLeadProposalHistory(
  leadId: string,
  options?: {
    responseFilter?: ProposalResponse;
    sort?: 'newest' | 'oldest';
    limit?: number;
  }
): Promise<Proposal[]> {
  try {
    const sort = options?.sort === 'oldest' ? 'created' : '-created';
    const perPage = options?.limit || 50;

    let filter = `lead_id = "${leadId}"`;
    if (options?.responseFilter) {
      filter += ` && response = "${options.responseFilter}"`;
    }

    const response = await pb.collection('proposals').getList<Proposal>(1, perPage, {
      filter,
      sort,
      expand: 'lead_id,template_id',
    });

    return response.items;
  } catch (error) {
    console.error('Get lead proposal history error:', error);
    return [];
  }
}

/**
 * Get proposal statistics for a lead
 * Returns counts of proposals by response status
 */
export async function getLeadProposalStats(leadId: string): Promise<{
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
}> {
  try {
    const [pending, accepted, rejected, total] = await Promise.all([
      pb.collection('proposals').getList(1, 1, {
        filter: `lead_id = "${leadId}" && response = "cevap_bekleniyor"`,
        skipTotal: true,
      }),
      pb.collection('proposals').getList(1, 1, {
        filter: `lead_id = "${leadId}" && response = "kabul"`,
        skipTotal: true,
      }),
      pb.collection('proposals').getList(1, 1, {
        filter: `lead_id = "${leadId}" && response = "red"`,
        skipTotal: true,
      }),
      pb.collection('proposals').getList(1, 1, {
        filter: `lead_id = "${leadId}"`,
        skipTotal: true,
      }),
    ]);

    return {
      total: total.totalItems,
      pending: pending.totalItems,
      accepted: accepted.totalItems,
      rejected: rejected.totalItems,
    };
  } catch (error) {
    console.error('Get lead proposal stats error:', error);
    return { total: 0, pending: 0, accepted: 0, rejected: 0 };
  }
}
