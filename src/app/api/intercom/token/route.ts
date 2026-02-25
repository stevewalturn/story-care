/**
 * Intercom Identity Verification Token API
 * Signs a JWT for Intercom's identity verification feature,
 * preventing user impersonation in the support widget.
 */

import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { Env } from '@/libs/Env';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';

const TOKEN_EXPIRY_SECONDS = 3600; // 1 hour

/**
 * GET /api/intercom/token - Generate signed Intercom identity token
 * Requires valid Firebase authentication.
 * Returns 503 if INTERCOM_SECRET_KEY is not configured.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const secret = Env.INTERCOM_SECRET_KEY;
    if (!secret) {
      return NextResponse.json(
        { error: 'Intercom identity verification is not configured' },
        { status: 503 },
      );
    }

    const token = jwt.sign(
      {
        user_id: user.dbUserId,
        email: user.email,
      },
      secret,
      { expiresIn: TOKEN_EXPIRY_SECONDS },
    );

    return NextResponse.json({
      token,
      expiresIn: TOKEN_EXPIRY_SECONDS,
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
