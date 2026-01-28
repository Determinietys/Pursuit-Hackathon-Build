/**
 * SnowClear Providers API
 * GET /api/snowclear/providers
 * 
 * ISOLATION: This route is under /api/snowclear/ namespace
 */

import { NextRequest, NextResponse } from 'next/server';
import { isFeatureEnabled, SNOWCLEAR_FLAGS } from '@/lib/snowclear/feature-flags';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Feature flag check
    const enabled = await isFeatureEnabled(SNOWCLEAR_FLAGS.ENABLED);
    if (!enabled) {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cityId = searchParams.get('cityId');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius') || '10';

    const where: any = {
      isAvailable: true,
      stripeAccountStatus: 'ACTIVE',
    };

    if (cityId) {
      where.serviceCities = {
        some: {
          cityId,
          isActive: true,
        },
      };
    }

    const providers = await prisma.providerProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        serviceCities: {
          include: { city: true },
        },
        pricing: true,
        equipment: true,
      },
      take: 50,
    });

    return NextResponse.json(providers);
  } catch (error: any) {
    console.error('[SNOWCLEAR] Providers GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}

