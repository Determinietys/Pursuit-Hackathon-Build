import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        customerProfile: true,
        providerProfile: {
          include: {
            serviceCities: { include: { city: true } },
            availability: true,
            pricing: true,
            equipment: true,
          },
        },
        addresses: {
          include: { city: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, phone, avatarUrl } = body;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone }),
        ...(avatarUrl && { avatarUrl }),
      },
    });

    const { passwordHash, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

