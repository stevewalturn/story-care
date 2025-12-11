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

/**
 * POST /api/auth/link-firebase-uid
 *
 * Request Body:
 * - email: User email (required)
 * - firebaseUid: Firebase UID from newly created account (required)
 *
 * Flow:
 * 1. Verify Firebase ID token to ensure authenticity
 * 2. Find invited user with matching email and null firebaseUid
 * 3. Update user: set firebaseUid, change status from 'invited' to 'active'
 * 4. Return success
 *
 * Security:
 * - Requires valid Firebase ID token (user must be authenticated)
 * - Only links UIDs to users with status='invited' and firebaseUid=null
 * - Ensures email matches between Firebase user and invited user
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
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 },
      );
    }

    // Security: Ensure the email in the request matches the Firebase user's email
    if (firebaseUser.email?.toLowerCase() !== email.toLowerCase()) {
      console.error('Email mismatch:', {
        requestEmail: email,
        firebaseEmail: firebaseUser.email,
      });
      return NextResponse.json(
        { error: 'Forbidden: Email does not match authenticated user' },
        { status: 403 },
      );
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
          eq(users.email, email.toLowerCase()),
          eq(users.status, 'invited'),
          isNull(users.firebaseUid),
        ),
      )
      .limit(1);

    if (!invitedUser) {
      return NextResponse.json(
        {
          error: 'No pending invitation found for this email. The invitation may have already been activated or does not exist.',
        },
        { status: 404 },
      );
    }

    // Link Firebase UID and activate account
    const [updatedUser] = await db
      .update(users)
      .set({
        firebaseUid: firebaseUser.uid,
        status: 'active',
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
