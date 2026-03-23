import { NextRequest, NextResponse } from 'next/server';
import { createLead, findLeadByPhone } from '@/lib/api/leads';
import {
  WebhookLeadCreateDto,
  WebhookResponse,
  WebhookErrorResponse,
  WebhookErrorType
} from '@/types/webhook';
import { validateWebhookRequest, getWebhookAuthConfig } from '@/lib/utils/webhook-auth';
import { LeadSource, LeadStatus } from '@/types/lead';

export async function POST(request: NextRequest) {
  try {
    // Get request body as text for signature verification
    const bodyText = await request.text();

    // Validate webhook authentication
    const authConfig = getWebhookAuthConfig();
    const authResult = validateWebhookRequest(request, authConfig, bodyText);

    if (!authResult.valid) {
      const errorResponse: WebhookErrorResponse = {
        success: false,
        error: WebhookErrorType.AUTHENTICATION_FAILED,
        message: authResult.error || 'Kimlik doğrulama başarısız'
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Parse body
    let data: WebhookLeadCreateDto;
    try {
      data = JSON.parse(bodyText);
    } catch (parseError) {
      const errorResponse: WebhookErrorResponse = {
        success: false,
        error: WebhookErrorType.VALIDATION_ERROR,
        message: 'Geçersiz JSON formatı'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Validate required fields
    if (!data.name) {
      const errorResponse: WebhookErrorResponse = {
        success: false,
        error: WebhookErrorType.VALIDATION_ERROR,
        message: 'İsim zorunludur'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Check for duplicate lead by phone
    if (data.phone) {
      const existingLead = await findLeadByPhone(data.phone);
      if (existingLead) {
        // Create new lead with 're-apply' status instead of updating existing
        const updated = await createLead({
          ...data,
          status: LeadStatus.RE_APPLY,
          source: data.source || LeadSource.API
        });

        const response: WebhookResponse = {
          success: true,
          data: {
            id: updated.id,
            name: updated.name,
            status: updated.status,
            duplicate: true,
            originalLeadId: existingLead.id
          },
          message: 'Lead re-apply statüsüyle oluşturuldu (tekrarlayan lead tespit edildi)'
        };
        return NextResponse.json(response, { status: 200 });
      }
    }

    // Create lead
    const lead = await createLead({
      name: data.name,
      phone: data.phone,
      email: data.email,
      company: data.company,
      website: data.website,
      message: data.message,
      source: data.source || LeadSource.API,
      status: data.status,
      tags: data.tags,
      utm_source: data.utm_source,
      utm_medium: data.utm_medium,
      utm_campaign: data.utm_campaign,
      utm_content: data.utm_content,
      utm_term: data.utm_term,
      utm_timestamp: new Date().toISOString()
    });

    const response: WebhookResponse = {
      success: true,
      data: {
        id: lead.id,
        name: lead.name,
        status: lead.status,
        created: lead.created
      },
      message: 'Lead başarıyla oluşturuldu'
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error: any) {
    console.error('Webhook lead oluşturma hatası:', error);

    const errorResponse: WebhookErrorResponse = {
      success: false,
      error: WebhookErrorType.INTERNAL_ERROR,
      message: 'Sunucu hatası',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Signature'
    }
  });
}
