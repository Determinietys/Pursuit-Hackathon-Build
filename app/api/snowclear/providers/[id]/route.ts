/**
 * SnowClear Provider Detail API
 * GET /api/snowclear/providers/[id]
 * 
 * ISOLATION: This route is under /api/snowclear/ namespace
 */

import { NextRequest, NextResponse } from 'next/server';
import { isFeatureEnabled, SNOWCLEAR_FLAGS } from '@/lib/snowclear/feature-flags';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Feature flag check
    const enabled = await isFeatureEnabled(SNOWCLEAR_FLAGS.ENABLED);
    if (!enabled) {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404 }
      );
    }

    const provider = await prisma.providerProfile.findUnique({
      where: { id: params.id },
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
        availability: true,
        pricing: true,
        equipment: true,
        bookings: {
          where: {
            status: 'COMPLETED',
          },
          include: {
            review: true,
          },
          take: 10,
        },
      },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(provider);
  } catch (error: any) {
    console.error('[SNOWCLEAR] Provider GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch provider' },
      { status: 500 }
    );
  }
}

