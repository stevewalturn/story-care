import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/libs/DB';
import { adminAuth } from '@/libs/FirebaseAdmin';
import { users } from '@/models/Schema';
import { isTokenExpired } from '@/utils/InvitationTokens';
import { authRateLimit, checkRateLimit, getClientIP } from '@/utils/RateLimiter';

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: Request) {
  const clientIP = getClientIP(request);
  const rateCheck = checkRateLimit(`reset-password:${clientIP}`, authRateLimit);

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

  try {
    const body = await request.json();
    const validated = resetPasswordSchema.parse(body);

    // Look up user by password reset token
    const [user] = await db
      .select({
        id: users.id,
        firebaseUid: users.firebaseUid,
        passwordResetTokenExpiresAt: users.passwordResetTokenExpiresAt,
      })
      .from(users)
      .where(eq(users.passwordResetToken, validated.token))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link.' },
        { status: 400 },
      );
    }

    if (isTokenExpired(user.passwordResetTokenExpiresAt)) {
      return NextResponse.json(
        { error: 'This reset link has expired. Please request a new one.' },
        { status: 400 },
      );
    }

    if (!user.firebaseUid) {
      return NextResponse.json(
        { error: 'Cannot reset password for this account.' },
        { status: 400 },
      );
    }

    // Update password in Firebase
    await adminAuth.updateUser(user.firebaseUid, {
      password: validated.password,
    });

    // Clear reset token (one-time use)
    await db
      .update(users)
      .set({
        passwordResetToken: null,
        passwordResetTokenExpiresAt: null,
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      message: 'Password has been reset successfully.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message || 'Invalid input';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Failed to reset password. Please try again.' },
      { status: 500 },
    );
  }
}
