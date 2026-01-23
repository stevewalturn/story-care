/**
 * Validate Invitation Token API
 * Validates an invitation token and returns user details if valid
 */

import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { organizationsSchema, users } from '@/models/Schema';
import { isTokenExpired } from '@/utils/InvitationTokens';

/**
 * POST /api/auth/validate-invitation-token
 *
 * Request Body:
 * - token: Invitation token (required)
 *
 * Response:
 * - Success (200): { valid: true, name, email, role, organizationName, expiresAt }
 * - Invalid token (400): { error: 'Token is required' }
 * - Not found (404): { error: 'Invalid or expired invitation token' }
 * - Already used (410): { error: 'This invitation has already been used' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 },
      );
    }

    // Find user with this invitation token
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status,
        organizationId: users.organizationId,
        firebaseUid: users.firebaseUid,
        invitationToken: users.invitationToken,
        invitationTokenExpiresAt: users.invitationTokenExpiresAt,
      })
      .from(users)
      .where(eq(users.invitationToken, token))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation token' },
        { status: 404 },
      );
    }

    // Check if invitation has already been used (user has firebaseUid)
    if (user.firebaseUid) {
      return NextResponse.json(
        {
          error: 'This invitation has already been used. Please sign in instead.',
          alreadyActivated: true,
        },
        { status: 410 },
      );
    }

    // Check if user is no longer in 'invited' status
    if (user.status !== 'invited') {
      return NextResponse.json(
        {
          error: 'This account has already been activated. Please sign in instead.',
          alreadyActivated: true,
        },
        { status: 410 },
      );
    }

    // Check if token has expired
    if (isTokenExpired(user.invitationTokenExpiresAt)) {
      return NextResponse.json(
        {
          error: 'This invitation link has expired. Please contact your administrator for a new invitation.',
          expired: true,
        },
        { status: 404 },
      );
    }

    // Get organization name if user belongs to one
    let organizationName = '';
    if (user.organizationId) {
      const [organization] = await db
        .select({ name: organizationsSchema.name })
        .from(organizationsSchema)
        .where(eq(organizationsSchema.id, user.organizationId))
        .limit(1);

      if (organization) {
        organizationName = organization.name;
      }
    }

    return NextResponse.json({
      valid: true,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationName,
      expiresAt: user.invitationTokenExpiresAt?.toISOString(),
    });
  } catch (error) {
    console.error('Failed to validate invitation token:', error);
    return NextResponse.json(
      { error: 'Failed to validate invitation token' },
      { status: 500 },
    );
  }
}
