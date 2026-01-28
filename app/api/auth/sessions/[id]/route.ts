import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify session belongs to user
    const targetSession = await prisma.session.findUnique({
      where: { id: params.id },
    });

    if (!targetSession || targetSession.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Session not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete session
    await prisma.session.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Session revoked successfully' });
  } catch (error: any) {
    console.error('Error revoking session:', error);
    return NextResponse.json(
      { error: 'Failed to revoke session' },
      { status: 500 }
    );
  }
}

