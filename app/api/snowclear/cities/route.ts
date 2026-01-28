/**
 * SnowClear Cities API
 * GET /api/snowclear/cities
 * 
 * ISOLATION: This route is under /api/snowclear/ namespace
 */

import { NextRequest, NextResponse } from 'next/server';
import { isFeatureEnabled, SNOWCLEAR_FLAGS } from '@/lib/snowclear/feature-flags';
import { prisma } from '@/lib/prisma';
import { SERVICE_CITIES } from '@/lib/constants/service-cities';

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

    // Return cities from database, or seed if empty
    let cities = await prisma.serviceCity.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    // If no cities in DB, return from constants (for initial setup)
    if (cities.length === 0) {
      return NextResponse.json(SERVICE_CITIES);
    }

    return NextResponse.json(cities);
  } catch (error: any) {
    console.error('[SNOWCLEAR] Cities GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cities' },
      { status: 500 }
    );
  }
}

