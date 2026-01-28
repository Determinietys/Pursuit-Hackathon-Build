/**
 * SnowClear Street Status API
 * GET /api/snowclear/streets/status
 * 
 * ISOLATION: This route is under /api/snowclear/ namespace
 */

import { NextRequest, NextResponse } from 'next/server';
import { isFeatureEnabled, SNOWCLEAR_FLAGS } from '@/lib/snowclear/feature-flags';
import { StreetStatusService } from '@/lib/services/street-status.service';

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

    const streetStatusEnabled = await isFeatureEnabled(SNOWCLEAR_FLAGS.STREET_STATUS_MAP);
    if (!streetStatusEnabled) {
      return NextResponse.json(
        { error: 'Street status feature not available' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cityId = searchParams.get('cityId');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius') || '0.5';

    if (!cityId) {
      return NextResponse.json(
        { error: 'cityId is required' },
        { status: 400 }
      );
    }

    let streets;
    if (lat && lng) {
      streets = await StreetStatusService.getNearbyStreetStatus(
        parseFloat(lat),
        parseFloat(lng),
        parseFloat(radius),
        cityId
      );
    } else {
      // Return all streets for the city
      const { prisma } = await import('@/lib/prisma');
      streets = await prisma.streetSegment.findMany({
        where: { cityId },
        take: 1000,
        orderBy: { lastUpdated: 'desc' },
      });
    }

    return NextResponse.json(streets);
  } catch (error: any) {
    console.error('[SNOWCLEAR] Street status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch street status' },
      { status: 500 }
    );
  }
}

