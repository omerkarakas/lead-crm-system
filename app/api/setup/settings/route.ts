import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

// One-time setup endpoint to create settings collection and seed data
// This endpoint should be removed after use
export async function POST(request: NextRequest) {
  try {
    const pb = new PocketBase('http://127.0.0.1:8090');

    // Try to login with provided credentials
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Login as admin
    try {
      await pb.collection('users').authWithPassword(email, password);
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Login failed: ' + error.message },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = pb.authStore.model as any;
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admin users can create settings' },
        { status: 403 }
      );
    }

    // Step 1: Create settings collection (via PocketBase JS SDK)
    // Note: PocketBase doesn't support creating collections via SDK easily
    // We'll use a workaround by creating the schema manually

    // Since PB SDK doesn't support collection creation, we'll return instructions
    // and the user can create via admin panel

    return NextResponse.json({
      message: 'Settings collection creation via API is limited. Please use admin panel.',
      instructions: {
        url: 'http://127.0.0.1:8090/_/',
        steps: [
          '1. Go to Settings > Collections',
          '2. Click "New Collection"',
          '3. Name: "settings"',
          '4. Add fields:',
          '   - service_name (Select): green_api, calcom, resend',
          '   - setting_key (Text)',
          '   - setting_value (Text)',
          '   - description (Text, optional)',
          '   - is_active (Bool, default: true)',
        ]
      }
    });

  } catch (error: any) {
    console.error('[POST /api/setup/settings] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Setup failed' },
      { status: 500 }
    );
  }
}
