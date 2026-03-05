import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import type { Lead } from '@/types/lead';
import { LeadSource } from '@/types/lead';
import { createOrUpdateLead } from '@/app/api/leads/route';

// Create dedicated PocketBase instance for Meta Ads webhook (no auth required)
const PB_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const pb = new PocketBase(PB_URL);

/**
 * Facebook Lead Ads webhook payload structure
 */
interface FacebookFieldData {
  name: string;
  values: string[];
}

interface FacebookLeadAdsPayload {
  leadgen_id: string;
  adgroup_id?: string;
  form_id?: string;
  created_time: string;
  field_data: FacebookFieldData[];
}

/**
 * Field name mappings from Facebook Lead Ads to internal lead model
 */
const FIELD_MAPPINGS: Record<string, string> = {
  'full_name': 'name',
  'name': 'name',
  'phone_number': 'phone',
  'phone': 'phone',
  'email': 'email',
  'company': 'company',
  'website': 'website',
  'message': 'message',
  'notes': 'message',
  'ad_note': 'message',
};

/**
 * Extract field value from Facebook field_data array
 */
function extractFieldValue(fieldData: FacebookFieldData[], fieldName: string): string | undefined {
  const normalizedFieldNames = [fieldName, ...Object.entries(FIELD_MAPPINGS)
    .filter(([_, v]) => v === fieldName)
    .map(([k, _]) => k)];

  for (const field of fieldData) {
    if (normalizedFieldNames.includes(field.name) && field.values && field.values.length > 0) {
      return field.values[0];
    }
  }
  return undefined;
}

/**
 * Transform Facebook Lead Ads payload to lead data
 */
function transformFacebookPayload(payload: FacebookLeadAdsPayload) {
  const name = extractFieldValue(payload.field_data, 'name') || '';
  const phone = extractFieldValue(payload.field_data, 'phone') || '';
  const email = extractFieldValue(payload.field_data, 'email');
  const company = extractFieldValue(payload.field_data, 'company');
  const website = extractFieldValue(payload.field_data, 'website');
  const message = extractFieldValue(payload.field_data, 'message');

  // Build UTM params from Meta Ads context
  const utmParams = {
    utm_source: 'facebook',
    utm_medium: 'lead_ad',
    utm_campaign: payload.adgroup_id || payload.form_id || '',
    utm_content: payload.form_id || '',
    utm_timestamp: new Date().toISOString(),
  };

  return {
    name,
    phone,
    email,
    company: company || name.split(' ')[0] + ' (Facebook)', // Default to name if company missing
    website,
    message,
    source: LeadSource.WEB_FORM,
    utmParams,
  };
}

/**
 * POST /api/webhooks/meta-ads
 * Facebook Lead Ads webhook endpoint
 *
 * Processes lead submissions from Facebook Lead Ads forms.
 * Handles duplicate detection and updates existing leads with 're-apply' status.
 *
 * Security: For production, verify X-Hub-Signature header
 * Error handling: Returns 200 OK for malformed data (Facebook retries on 5xx)
 */
export async function POST(req: NextRequest) {
  try {
    // Verify request method is POST
    if (req.method !== 'POST') {
      return NextResponse.json(
        { success: false, message: 'Method not allowed' },
        { status: 405 }
      );
    }

    // Parse webhook payload
    const payload = await req.json() as FacebookLeadAdsPayload;

    // Log incoming webhook (sanitized, no PII)
    console.log(JSON.stringify({
      event: 'meta_ads_webhook',
      leadgen_id: payload.leadgen_id,
      adgroup_id: payload.adgroup_id,
      form_id: payload.form_id,
      created_time: payload.created_time,
      field_count: payload.field_data?.length || 0,
      status: 'received',
    }));

    // Basic validation - check required fields
    if (!payload.leadgen_id || !payload.field_data || !Array.isArray(payload.field_data)) {
      console.error('[Meta Ads Webhook] Invalid payload: missing leadgen_id or field_data');
      return NextResponse.json(
        { success: false, message: 'Invalid payload' },
        { status: 400 }
      );
    }

    // Transform payload to lead data
    const { name, phone, email, company, website, message, source, utmParams } =
      transformFacebookPayload(payload);

    // Log transformation results (without PII)
    console.log(JSON.stringify({
      event: 'meta_ads_webhook',
      leadgen_id: payload.leadgen_id,
      transformation: {
        has_name: !!name,
        has_phone: !!phone,
        has_email: !!email,
        has_company: !!company,
        source,
        utm_source: utmParams.utm_source,
        utm_medium: utmParams.utm_medium,
      },
      status: 'transformed',
    }));

    // Validate required fields
    if (!name || !phone) {
      console.error('[Meta Ads Webhook] Missing required fields: name or phone');
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use shared lead creation/update logic from /api/leads
    // Transform Facebook payload to CreateLeadDto format
    const leadData = {
      name,
      phone,
      email,
      company,
      website,
      message,
      source,
      ...utmParams,
    };

    const { lead, action } = await createOrUpdateLead(leadData, pb);

    console.log('[Meta Ads Webhook] Lead processed:', { id: lead.id, action });

    // Log successful processing with full context
    console.log(JSON.stringify({
      event: 'meta_ads_webhook',
      leadgen_id: payload.leadgen_id,
      action,
      lead_id: lead.id,
      status: 'success',
    }));

    return NextResponse.json({
      success: true,
      lead_id: lead.id,
      action,
    }, { status: action === 'created' ? 201 : 200 });

  } catch (error) {
    // Log errors with full context for debugging
    console.error('[Meta Ads Webhook] Error:', error);
    console.log(JSON.stringify({
      event: 'meta_ads_webhook',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }));

    // Return 200 OK to prevent Facebook retries on server errors
    return NextResponse.json(
      {
        success: false,
        message: 'Processing failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 200 }
    );
  }
}

/**
 * GET endpoint for webhook verification
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    webhook: 'meta-ads',
  });
}
