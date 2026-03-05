import { NextRequest, NextResponse } from 'next/server';
import { getServerPb } from '@/lib/pocketbase/server';
import { canManageSettings } from '@/lib/utils/permissions';
import type { Setting, CreateSettingDto, UpdateSettingDto } from '@/types/setting';

// Mask sensitive values for UI display
function maskValue(key: string, value: string): string {
  const sensitiveKeys = ['token', 'api_key', 'webhook_secret', 'password', 'secret'];
  const isSensitive = sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive));

  if (!isSensitive) return value;

  // Show first 4 and last 4 characters, mask the rest
  if (value.length <= 8) return '***';
  return `${value.slice(0, 4)}${'*'.repeat(Math.min(value.length - 8, 20))}${value.slice(-4)}`;
}

// GET /api/settings - List all settings (masked values)
export async function GET(request: NextRequest) {
  try {
    const pb = await getServerPb();

    if (!pb.authStore.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = pb.authStore.model as any;
    if (!canManageSettings(user?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const records = await pb.collection('app_settings').getList<Setting>(1, 100, {
      sort: 'service_name, setting_key',
    });

    // Mask sensitive values
    const maskedRecords = records.items.map(setting => ({
      ...setting,
      setting_value: maskValue(setting.setting_key, setting.setting_value),
      is_masked: true,
    }));

    return NextResponse.json({
      items: maskedRecords,
      totalItems: records.totalItems,
    });
  } catch (error: any) {
    console.error('[GET /api/settings] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/settings - Update a setting
export async function PATCH(request: NextRequest) {
  try {
    const pb = await getServerPb();

    if (!pb.authStore.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = pb.authStore.model as any;
    if (!canManageSettings(user?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: UpdateSettingDto & { id?: string; service_name?: string; setting_key?: string } = await request.json();

    if (!body.id && (!body.service_name || !body.setting_key)) {
      return NextResponse.json(
        { error: 'Either id or (service_name + setting_key) is required' },
        { status: 400 }
      );
    }

    // Find the setting
    let record: Setting | null = null;

    if (body.id) {
      record = await pb.collection('app_settings').getOne<Setting>(body.id);
    } else {
      const result = await pb.collection('app_settings').getList<Setting>(1, 1, {
        filter: `service_name = "${body.service_name}" && setting_key = "${body.setting_key}"`,
      });
      record = result.items[0] || null;
    }

    if (!record) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }

    // Update only allowed fields
    const updateData: UpdateSettingDto = {};
    if (body.setting_value !== undefined) updateData.setting_value = body.setting_value;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    const updated = await pb.collection('app_settings').update<Setting>(record.id, updateData);

    // Return masked value
    return NextResponse.json({
      ...updated,
      setting_value: maskValue(updated.setting_key, updated.setting_value),
      is_masked: true,
    });
  } catch (error: any) {
    console.error('[PATCH /api/settings] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/settings - Create a new setting (optional, for initial setup)
export async function POST(request: NextRequest) {
  try {
    const pb = await getServerPb();

    if (!pb.authStore.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = pb.authStore.model as any;
    if (!canManageSettings(user?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: CreateSettingDto = await request.json();

    const record = await pb.collection('app_settings').create<Setting>({
      service_name: body.service_name,
      setting_key: body.setting_key,
      setting_value: body.setting_value,
      description: body.description,
      is_active: body.is_active ?? true,
    });

    // Return masked value
    return NextResponse.json(
      {
        ...record,
        setting_value: maskValue(record.setting_key, record.setting_value),
        is_masked: true,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[POST /api/settings] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
