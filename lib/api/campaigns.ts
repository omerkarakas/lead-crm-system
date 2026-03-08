import PocketBase from 'pocketbase';
import type {
  Campaign,
  Sequence,
  CreateCampaignDto,
  UpdateCampaignDto,
  CreateSequenceDto,
  UpdateSequenceDto,
  SegmentPreview,
  AudienceSegment,
  SegmentRule,
  RuleOperator,
  CampaignWithSequences,
} from '@/types/campaign';
import type { Lead } from '@/types/lead';

// Create dedicated PocketBase instance for Campaigns
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
 * Fetch all campaigns with pagination and filtering
 */
export async function fetchCampaigns(page = 1, perPage = 50): Promise<{
  items: Campaign[];
  totalItems: number;
  totalPages: number;
}> {
  const response = await pb.collection('campaigns').getList<Campaign>(page, perPage, {
    sort: '-created',
  });

  return {
    items: response.items,
    totalItems: response.totalItems,
    totalPages: response.totalPages,
  };
}

/**
 * Fetch a single campaign by ID with sequences
 */
export async function fetchCampaign(id: string): Promise<CampaignWithSequences> {
  const campaign = await pb.collection('campaigns').getOne<Campaign>(id);

  // Fetch sequences for this campaign
  const sequences = await fetchSequences(id);

  return {
    ...campaign,
    sequences,
  };
}

/**
 * Create a new campaign
 */
export async function createCampaign(data: CreateCampaignDto): Promise<Campaign> {
  const record = await pb.collection('campaigns').create<Campaign>({
    name: data.name,
    description: data.description,
    type: data.type,
    audience_segment: data.audience_segment,
    auto_enroll_min_score: data.auto_enroll_min_score,
    is_active: data.is_active ?? true,
  });

  return record;
}

/**
 * Update an existing campaign
 */
export async function updateCampaign(id: string, data: UpdateCampaignDto): Promise<Campaign> {
  return await pb.collection('campaigns').update<Campaign>(id, data);
}

/**
 * Delete a campaign (soft delete - set is_active=false)
 */
export async function deleteCampaign(id: string): Promise<Campaign> {
  return await pb.collection('campaigns').update<Campaign>(id, {
    is_active: false,
  });
}

/**
 * Fetch all sequences for a campaign
 */
export async function fetchSequences(campaignId: string): Promise<Sequence[]> {
  const response = await pb.collection('sequences').getList<Sequence>(1, 100, {
    filter: `campaign_id = "${campaignId}"`,
    sort: 'created',
  });

  return response.items;
}

/**
 * Fetch a single sequence by ID
 */
export async function fetchSequence(id: string): Promise<Sequence> {
  return await pb.collection('sequences').getOne<Sequence>(id);
}

/**
 * Create a new sequence
 */
export async function createSequence(data: CreateSequenceDto): Promise<Sequence> {
  const record = await pb.collection('sequences').create<Sequence>({
    campaign_id: data.campaign_id,
    name: data.name,
    steps: data.steps,
    is_active: data.is_active ?? true,
  });

  return record;
}

/**
 * Update an existing sequence
 */
export async function updateSequence(id: string, data: UpdateSequenceDto): Promise<Sequence> {
  return await pb.collection('sequences').update<Sequence>(id, data);
}

/**
 * Delete a sequence
 */
export async function deleteSequence(id: string): Promise<void> {
  await pb.collection('sequences').delete(id);
}

/**
 * Build PocketBase filter from segment rules
 */
function buildFilterFromSegment(segment: AudienceSegment): string {
  if (!segment.rules || segment.rules.length === 0) {
    return '';
  }

  const ruleFilters = segment.rules.map(rule => {
    const { field, operator, value } = rule;

    switch (operator) {
      case 'eq':
        return `${field} = "${value}"`;
      case 'ne':
        return `${field} != "${value}"`;
      case 'gt':
        return `${field} > ${value}`;
      case 'lt':
        return `${field} < ${value}`;
      case 'gte':
        return `${field} >= ${value}`;
      case 'lte':
        return `${field} <= ${value}`;
      case 'contains':
        return `${field} ~ "${value}"`;
      case 'not_contains':
        return `${field} !~ "${value}"`;
      default:
        return '';
    }
  }).filter(f => f !== '');

  if (ruleFilters.length === 0) {
    return '';
  }

  const joinOperator = segment.operator === 'or' ? ' || ' : ' && ';
  return `(${ruleFilters.join(joinOperator)})`;
}

/**
 * Get segment preview with lead count and sample leads
 */
export async function getSegmentPreview(segment: AudienceSegment): Promise<SegmentPreview> {
  const filter = buildFilterFromSegment(segment);

  if (!filter) {
    return {
      count: 0,
      sample_leads: [],
    };
  }

  // Get total count
  const response = await pb.collection('leads').getList<Lead>(1, 1, {
    filter,
  });

  // Get sample leads (first 10)
  const sampleResponse = await pb.collection('leads').getList<Lead>(1, 10, {
    filter,
    sort: '-created',
  });

  return {
    count: response.totalItems,
    sample_leads: sampleResponse.items.map(lead => ({
      id: lead.id,
      name: lead.name,
      status: lead.status,
      score: lead.score,
    })),
  };
}

/**
 * Validate segment rules against lead schema
 */
export function validateSegment(segment: AudienceSegment): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!segment.rules || segment.rules.length === 0) {
    errors.push('En az bir kural gerekli');
    return { valid: false, errors };
  }

  const validFields = ['score', 'status', 'source', 'tags', 'name', 'phone', 'email', 'company', 'quality'];
  const validOperators: RuleOperator[] = ['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'contains', 'not_contains'];

  segment.rules.forEach((rule, index) => {
    if (!rule.field) {
      errors.push(`Kural ${index + 1}: Alan gerekli`);
    } else if (!validFields.includes(rule.field)) {
      errors.push(`Kural ${index + 1}: Geçersiz alan "${rule.field}"`);
    }

    if (!rule.operator) {
      errors.push(`Kural ${index + 1}: Operatör gerekli`);
    } else if (!validOperators.includes(rule.operator)) {
      errors.push(`Kural ${index + 1}: Geçersiz operatör "${rule.operator}"`);
    }

    if (rule.value === undefined || rule.value === null || rule.value === '') {
      errors.push(`Kural ${index + 1}: Değer gerekli`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if a lead matches a segment
 */
export function leadMatchesSegment(lead: Lead, segment: AudienceSegment): boolean {
  const results = segment.rules.map(rule => {
    const leadValue = (lead as any)[rule.field];

    switch (rule.operator) {
      case 'eq':
        return leadValue === rule.value;
      case 'ne':
        return leadValue !== rule.value;
      case 'gt':
        return leadValue > rule.value;
      case 'lt':
        return leadValue < rule.value;
      case 'gte':
        return leadValue >= rule.value;
      case 'lte':
        return leadValue <= rule.value;
      case 'contains':
        if (Array.isArray(leadValue)) {
          return leadValue.includes(rule.value);
        }
        return String(leadValue).includes(rule.value);
      case 'not_contains':
        if (Array.isArray(leadValue)) {
          return !leadValue.includes(rule.value);
        }
        return !String(leadValue).includes(rule.value);
      default:
        return false;
    }
  });

  return segment.operator === 'or'
    ? results.some(r => r)
    : results.every(r => r);
}
