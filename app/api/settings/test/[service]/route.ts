import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { canManageSettings } from '@/lib/utils/permissions';

// Test connection to external services
export async function POST(
  request: NextRequest,
  { params }: { params: { service: string } }
) {
  try {
    const pb = await getServerPb();

    if (!pb.authStore.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = pb.authStore.model as any;
    if (!canManageSettings(user?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const service = params.service;

    // Fetch settings for this service
    const records = await pb.collection('app_settings').getList(1, 50, {
      filter: `service_name = "${service}" && is_active = true`,
    });

    const settingsMap: Record<string, string> = {};
    records.items.forEach((item: any) => {
      settingsMap[item.setting_key] = item.setting_value;
    });

    let result: { success: boolean; message: string; details?: any } = {
      success: false,
      message: 'Unknown service',
    };

    switch (service) {
      case 'green_api':
        result = await testGreenApi(settingsMap);
        break;
      case 'calcom':
        result = await testCalCom(settingsMap);
        break;
      case 'resend':
        result = await testResend(settingsMap);
        break;
      default:
        return NextResponse.json({ error: 'Unknown service' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`[POST /api/settings/test/${params.service}] Error:`, error);
    return NextResponse.json(
      { success: false, message: error.message || 'Test failed' },
      { status: 500 }
    );
  }
}

async function testGreenApi(settings: Record<string, string>): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  const instanceId = settings.instance_id;
  const token = settings.token;

  if (!instanceId || !token) {
    return {
      success: false,
      message: 'Missing instance_id or token',
    };
  }

  try {
    const response = await fetch(
      `https://1101.api.greenapi.com/waInstance${instanceId}/getStateInstance/${token}`
    );

    if (!response.ok) {
      return {
        success: false,
        message: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();

    if (data.statusInstance === 'notAuthorized') {
      return {
        success: false,
        message: 'Green API instance not authorized. Please scan QR code.',
        details: data,
      };
    }

    return {
      success: true,
      message: 'Green API connection successful',
      details: {
        statusInstance: data.statusInstance,
        apiVersion: data.apiVersion,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Connection failed',
    };
  }
}

async function testCalCom(settings: Record<string, string>): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  const url = settings.url;
  const apiKey = settings.api_key;

  if (!url || !apiKey) {
    return {
      success: false,
      message: 'Missing url or api_key',
    };
  }

  try {
    // Test by fetching current user info
    const response = await fetch(`${url}/api/v2/me`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        message: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      message: 'Cal.com connection successful',
      details: {
        username: data.username || data.email,
        locale: data.locale,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Connection failed',
    };
  }
}

async function testResend(settings: Record<string, string>): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  const apiKey = settings.api_key;

  if (!apiKey) {
    return {
      success: false,
      message: 'Missing api_key',
    };
  }

  try {
    // Test by fetching API domains
    const response = await fetch('https://api.resend.com/domains', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        message: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      message: 'Resend connection successful',
      details: {
        domainCount: data.data?.length || 0,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Connection failed',
    };
  }
}
