/**
 * Current User Profile API
 * Get authenticated user's complete profile from database
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { generatePresignedUrl } from '@/libs/GCS';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';

/**
 * GET /api/auth/me - Get current user's profile
 * Returns database user data including role, organization, and status
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // requireAuth already fetches from database via FirebaseAdmin.verifyIdToken
    // which returns: uid, dbUserId, organizationId, email, emailVerified, role

    // Generate presigned URL for avatar (1-hour expiration for HIPAA compliance)
    const signedAvatarUrl = user.avatarUrl
      ? await generatePresignedUrl(user.avatarUrl, 1)
      : null;

    return NextResponse.json({
      user: {
        id: user.dbUserId,
        uid: user.uid,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        role: user.role,
        organizationId: user.organizationId,
        status: user.status,
        avatarUrl: signedAvatarUrl,
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}
