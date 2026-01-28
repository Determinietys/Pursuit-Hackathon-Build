import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
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
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}

