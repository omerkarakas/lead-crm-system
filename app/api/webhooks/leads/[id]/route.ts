import { NextRequest, NextResponse } from 'next/server';
import { updateLead, fetchLead } from '@/lib/api/leads';
import {
  WebhookStatusUpdateDto,
  WebhookResponse,
  WebhookErrorResponse,
  WebhookErrorType
} from '@/types/webhook';
import { validateWebhookRequest, getWebhookAuthConfig } from '@/lib/utils/webhook-auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    let data: WebhookStatusUpdateDto;
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
    if (!data.status) {
      const errorResponse: WebhookErrorResponse = {
        success: false,
        error: WebhookErrorType.VALIDATION_ERROR,
        message: 'Durum zorunludur'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Check if lead exists
    const existingLead = await fetchLead(params.id);
    if (!existingLead) {
      const errorResponse: WebhookErrorResponse = {
        success: false,
        error: WebhookErrorType.LEAD_NOT_FOUND,
        message: 'Lead bulunamadı'
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Update lead status
    const updatedLead = await updateLead(params.id, {
      status: data.status,
      auto_updated_status: false,
      auto_updated_at: undefined
    }, {
      force: data.force || false,
      userRole: 'admin' // Webhooks always have admin privileges for status updates
    });

    const response: WebhookResponse = {
      success: true,
      data: {
        id: updatedLead.id,
        name: updatedLead.name,
        status: updatedLead.status,
        updated: updatedLead.updated
      },
      message: 'Lead durumu başarıyla güncellendi'
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('Webhook durum güncelleme hatası:', error);

    // Handle specific errors
    if (error.message?.includes('admin yetkisi')) {
      const errorResponse: WebhookErrorResponse = {
        success: false,
        error: WebhookErrorType.VALIDATION_ERROR,
        message: error.message
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    if (error.message?.includes('Zorla')) {
      const errorResponse: WebhookErrorResponse = {
        success: false,
        error: WebhookErrorType.VALIDATION_ERROR,
        message: error.message
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

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
      'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Signature'
    }
  });
}
