import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal if user exists (security best practice)
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Store reset token (you'd create a PasswordResetToken model for this)
    // For now, we'll just return success
    // In production, store token and send email

    // TODO: Send email with reset link
    // const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
    // await sendPasswordResetEmail(user.email, resetUrl);

    return NextResponse.json({
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error: any) {
    console.error('Error processing password reset:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset' },
      { status: 500 }
    );
  }
}

