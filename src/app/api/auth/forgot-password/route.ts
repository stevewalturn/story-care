import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/libs/DB';
import { isPauboxConfigured } from '@/libs/Paubox';
import { users } from '@/models/Schema';
import { sendPasswordResetEmail } from '@/services/EmailService';
import { generateInvitationToken } from '@/utils/InvitationTokens';
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
    // Look up user by email in DB
    const [user] = await db
      .select({ id: users.id, firebaseUid: users.firebaseUid, deletedAt: users.deletedAt, status: users.status })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // If not found, return generic success to prevent email enumeration
    if (!user || !user.firebaseUid) {
      return NextResponse.json(GENERIC_SUCCESS);
    }

    // Deleted/inactive users get an explicit error
    if (user.deletedAt || user.status === 'deleted' || user.status === 'inactive') {
      return NextResponse.json(
        { error: 'This account has been removed. Please contact your administrator.' },
        { status: 403 },
      );
    }

    // Generate token and store with 1-hour expiry
    const token = generateInvitationToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db
      .update(users)
      .set({
        passwordResetToken: token,
        passwordResetTokenExpiresAt: expiresAt,
      })
      .where(eq(users.id, user.id));

    // Build reset URL and send email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    if (!isPauboxConfigured()) {
      console.warn('Paubox not configured — password reset token generated but email not sent');
      return NextResponse.json(GENERIC_SUCCESS);
    }

    const result = await sendPasswordResetEmail({
      recipientEmail: email,
      resetLink,
    });

    if (!result.success) {
      console.error('Failed to send password reset email:', result.error);
    }
  } catch (error) {
    console.error('Error processing password reset:', error);
  }

  // Always return success to prevent email enumeration
  return NextResponse.json(GENERIC_SUCCESS);
}
