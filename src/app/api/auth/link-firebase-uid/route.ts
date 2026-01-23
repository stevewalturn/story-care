/**
 * Link Firebase UID API
 * Links a Firebase UID to an invited user and activates their account
 * Called after successful Firebase account creation during setup-account flow
 */

import type { NextRequest } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { verifyIdToken } from '@/libs/FirebaseAdmin';
import { users } from '@/models/Schema';
import { isTokenExpired } from '@/utils/InvitationTokens';

/**
 * POST /api/auth/link-firebase-uid
 *
 * Request Body:
 * - email: User email (required, but can be provided via token lookup)
 * - token: Invitation token (optional, but preferred for security)
 *
 * Flow:
 * 1. Verify Firebase ID token to ensure authenticity
 * 2. Find invited user using token OR email
 * 3. Validate token hasn't expired (if using token)
 * 4. Update user: set firebaseUid, change status from 'invited' to 'active', clear token
 * 5. Return success
 *
 * Security:
 * - Requires valid Firebase ID token (user must be authenticated)
 * - Token-based lookup is preferred for security (prevents email guessing)
 * - Only links UIDs to users with status='invited' and firebaseUid=null
 * - Clears invitation token after successful activation
 */
export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid authorization header' },
        { status: 401 },
      );
    }

    const idToken = authHeader.substring(7);

    // Verify Firebase ID token
    let firebaseUser;
    try {
      firebaseUser = await verifyIdToken(idToken);
    } catch (error) {
      console.error('Failed to verify Firebase ID token:', error);
      return NextResponse.json(
        { error: 'Unauthorized: Invalid Firebase ID token' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { email, token } = body;

    // Must have either email or token
    if (!email && !token) {
      return NextResponse.json(
        { error: 'Email or token is required' },
        { status: 400 },
      );
    }

    // If token is provided, use it for lookup (more secure)
    let lookupEmail = email;

    if (token) {
      // Find user by token first to get their email
      const [userByToken] = await db
        .select({
          email: users.email,
          invitationTokenExpiresAt: users.invitationTokenExpiresAt,
        })
        .from(users)
        .where(eq(users.invitationToken, token))
        .limit(1);

      if (!userByToken) {
        return NextResponse.json(
          { error: 'Invalid or expired invitation token' },
          { status: 404 },
        );
      }

      // Check token expiry
      if (isTokenExpired(userByToken.invitationTokenExpiresAt)) {
        return NextResponse.json(
          { error: 'Invitation token has expired. Please request a new invitation.' },
          { status: 410 },
        );
      }

      lookupEmail = userByToken.email;
    }

    // Security: Ensure the email matches the Firebase user's email
    if (firebaseUser.email?.toLowerCase() !== lookupEmail.toLowerCase()) {
      console.error('Email mismatch:', {
        requestEmail: lookupEmail,
        firebaseEmail: firebaseUser.email,
      });
      return NextResponse.json(
        { error: 'Forbidden: Email does not match authenticated user' },
        { status: 403 },
      );
    }

    // First, check if this Firebase UID is already linked to the user (idempotent check)
    const [existingLinkedUser] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        status: users.status,
        firebaseUid: users.firebaseUid,
      })
      .from(users)
      .where(
        and(
          eq(users.email, lookupEmail.toLowerCase()),
          eq(users.firebaseUid, firebaseUser.uid),
        ),
      )
      .limit(1);

    if (existingLinkedUser) {
      // Already linked - this is an idempotent retry, return success
      console.log('✅ Firebase UID already linked (idempotent):', {
        userId: existingLinkedUser.id,
        email: existingLinkedUser.email,
        firebaseUid: existingLinkedUser.firebaseUid,
      });

      return NextResponse.json({
        success: true,
        message: 'Account already activated',
        user: {
          id: existingLinkedUser.id,
          email: existingLinkedUser.email,
          name: existingLinkedUser.name,
          role: existingLinkedUser.role,
          status: existingLinkedUser.status,
        },
      });
    }

    // Find invited user with this email and no Firebase UID
    const [invitedUser] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        status: users.status,
        firebaseUid: users.firebaseUid,
      })
      .from(users)
      .where(
        and(
          eq(users.email, lookupEmail.toLowerCase()),
          eq(users.status, 'invited'),
          isNull(users.firebaseUid),
        ),
      )
      .limit(1);

    if (!invitedUser) {
      // Check if user exists but with different state
      const [anyUser] = await db
        .select({
          id: users.id,
          email: users.email,
          status: users.status,
          firebaseUid: users.firebaseUid,
        })
        .from(users)
        .where(eq(users.email, lookupEmail.toLowerCase()))
        .limit(1);

      if (anyUser && anyUser.firebaseUid && anyUser.firebaseUid !== firebaseUser.uid) {
        // User exists but linked to a different Firebase UID
        return NextResponse.json(
          {
            error: 'This email is already linked to a different account. Please sign in or contact support.',
          },
          { status: 409 },
        );
      }

      if (anyUser && anyUser.status === 'active') {
        // User is already active (race condition caught)
        return NextResponse.json(
          {
            error: 'This account has already been activated. Please sign in.',
          },
          { status: 409 },
        );
      }

      return NextResponse.json(
        {
          error: 'No pending invitation found for this email. Please contact your therapist or administrator.',
        },
        { status: 404 },
      );
    }

    // Link Firebase UID, activate account, and clear invitation token
    const [updatedUser] = await db
      .update(users)
      .set({
        firebaseUid: firebaseUser.uid,
        status: 'active',
        invitationToken: null, // Clear token after successful activation
        invitationTokenExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, invitedUser.id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        status: users.status,
        firebaseUid: users.firebaseUid,
      });

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to link Firebase UID' },
        { status: 500 },
      );
    }

    console.log('✅ Successfully linked Firebase UID and activated account:', {
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      firebaseUid: updatedUser.firebaseUid,
      status: updatedUser.status,
    });

    return NextResponse.json({
      success: true,
      message: 'Account activated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        status: updatedUser.status,
      },
    });
  } catch (error) {
    console.error('Failed to link Firebase UID:', error);
    return NextResponse.json(
      {
        error: 'Failed to link Firebase UID',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
