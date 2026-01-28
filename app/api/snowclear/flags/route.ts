/**
 * SnowClear Feature Flag API
 * GET /api/snowclear/flags?flag=snowclear_enabled
 * 
 * ISOLATION: This route is under /api/snowclear/ namespace
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isFeatureEnabled } from '@/lib/snowclear/feature-flags';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const flag = searchParams.get('flag');

    if (!flag) {
      return NextResponse.json(
        { error: 'Flag parameter is required' },
        { status: 400 }
      );
    }

    // Get user session for user-specific flags
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    // Check if flag is enabled
    const enabled = await isFeatureEnabled(flag, userId);

    return NextResponse.json({ enabled, flag });
  } catch (error: any) {
    console.error('[SNOWCLEAR] Feature flag check error:', error);
    return NextResponse.json(
      { error: 'Failed to check feature flag', enabled: false },
      { status: 500 }
    );
  }
}

