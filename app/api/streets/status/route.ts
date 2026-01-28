import { NextRequest, NextResponse } from 'next/server';
import { StreetStatusService } from '@/lib/services/street-status.service';

export async function GET(request: NextRequest) {
  try {
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
    console.error('Error fetching street status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch street status' },
      { status: 500 }
    );
  }
}

