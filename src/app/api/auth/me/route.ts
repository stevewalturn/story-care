/**
 * Current User Profile API
 * Get authenticated user's complete profile from database
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleAuthError } from '@/utils/AuthHelpers';

/**
 * GET /api/auth/me - Get current user's profile
 * Returns database user data including role, organization, and status
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // requireAuth already fetches from database via FirebaseAdmin.verifyIdToken
    // which returns: uid, dbUserId, organizationId, email, emailVerified, role

    return NextResponse.json({
      user: {
        id: user.dbUserId,
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
        role: user.role,
        organizationId: user.organizationId,
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
