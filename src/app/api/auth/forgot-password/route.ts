import { NextResponse } from 'next/server';
import { z } from 'zod';
import { adminAuth } from '@/libs/FirebaseAdmin';
import { isPauboxConfigured } from '@/libs/Paubox';
import { sendPasswordResetEmail } from '@/services/EmailService';
import { authRateLimit, checkRateLimit, getClientIP } from '@/utils/RateLimiter';

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const GENERIC_SUCCESS = {
  message: 'If an account exists with that email, a password reset link has been sent.',
};

export async function POST(request: Request) {
  const clientIP = getClientIP(request);
  const rateCheck = checkRateLimit(`forgot-password:${clientIP}`, authRateLimit);

  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)),
        },
      },
    );
  }

  let email: string;

  try {
    const body = await request.json();
    const validated = forgotPasswordSchema.parse(body);
    email = validated.email;
  } catch {
    return NextResponse.json(
      { error: 'Invalid email address' },
      { status: 400 },
    );
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetLink = await adminAuth.generatePasswordResetLink(email, {
      url: `${appUrl}/sign-in`,
    });

    if (!isPauboxConfigured()) {
      console.warn('Paubox not configured — password reset link generated but email not sent');
      return NextResponse.json(GENERIC_SUCCESS);
    }

    const result = await sendPasswordResetEmail({
      recipientEmail: email,
      resetLink,
    });

    if (!result.success) {
      console.error('Failed to send password reset email:', result.error);
    }
  } catch (error: any) {
    // Firebase throws if the user doesn't exist — silently handle it
    const code = error?.code || error?.errorInfo?.code || '';
    if (code === 'auth/user-not-found' || code === 'auth/email-not-found') {
      console.log('Password reset requested for non-existent email');
    } else {
      console.error('Error generating password reset link:', error);
    }
  }

  // Always return success to prevent email enumeration
  return NextResponse.json(GENERIC_SUCCESS);
}
