import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Soft delete: mark as deactivated instead of hard delete
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        status: 'DEACTIVATED',
        email: `deleted-${Date.now()}@deleted.local`, // Anonymize email
      },
    });

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}

