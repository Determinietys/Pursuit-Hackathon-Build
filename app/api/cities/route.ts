import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SERVICE_CITIES } from '@/lib/constants/service-cities';

export async function GET(request: NextRequest) {
  try {
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
    console.error('Error fetching cities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cities' },
      { status: 500 }
    );
  }
}

