/**
 * Link Firebase UID API
 * Links a Firebase UID to an invited user and activates their account
 * Called after successful Firebase account creation during setup-account flow
 * Supports both email/password and phone number authentication
 */

import type { NextRequest } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { adminAuth } from '@/libs/FirebaseAdmin';
import { users } from '@/models/Schema';
import { isTokenExpired } from '@/utils/InvitationTokens';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid authorization header' },
        { status: 401 },
      );
    }

    const idToken = authHeader.substring(7);

    // Decode the Firebase token directly (no DB lookup — user may not exist yet)
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid Firebase ID token' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { email, token, phoneVerified } = body;

    const signInProvider = decodedToken.firebase?.sign_in_provider;
    const isPhoneAuth = signInProvider === 'phone';

    // ─── Phone auth flow ──────────────────────────────────────────────────────
    if (isPhoneAuth) {
      const firebasePhone = decodedToken.phone_number;
      if (!firebasePhone) {
        return NextResponse.json(
          { error: 'Phone number not found in Firebase token' },
          { status: 400 },
        );
      }

      let phoneUser;

      if (token) {
        // Token-based lookup (legacy: phone OTP on /setup-account)
        const [userByToken] = await db
          .select()
          .from(users)
          .where(eq(users.invitationToken, token))
          .limit(1);

        if (!userByToken) {
          return NextResponse.json(
            { error: 'Invalid or expired invitation token' },
            { status: 404 },
          );
        }

        if (isTokenExpired(userByToken.invitationTokenExpiresAt)) {
          return NextResponse.json(
            { error: 'Invitation token has expired. Please request a new invitation.' },
            { status: 410 },
          );
        }

        if (!userByToken.phoneNumber || userByToken.phoneNumber !== firebasePhone) {
          return NextResponse.json(
            { error: 'Forbidden: Phone number does not match the invited user' },
            { status: 403 },
          );
        }

        phoneUser = userByToken;
      } else {
        // Tokenless lookup by phone number (new: /setup-account-phone flow)
        const [userByPhone] = await db
          .select()
          .from(users)
          .where(eq(users.phoneNumber, firebasePhone))
          .limit(1);

        if (!userByPhone) {
          return NextResponse.json(
            { error: 'No invitation found for this phone number.' },
            { status: 404 },
          );
        }

        phoneUser = userByPhone;
      }

      // Idempotency check
      if (phoneUser.firebaseUid === decodedToken.uid) {
        return NextResponse.json({
          success: true,
          message: 'Account already activated',
          user: {
            id: phoneUser.id,
            email: phoneUser.email,
            name: phoneUser.name,
            role: phoneUser.role,
            status: phoneUser.status,
          },
        });
      }

      if (phoneUser.firebaseUid) {
        return NextResponse.json(
          { error: 'This account has already been activated. Please sign in.' },
          { status: 409 },
        );
      }

      const [updatedPhoneUser] = await db
        .update(users)
        .set({
          firebaseUid: decodedToken.uid,
          status: 'active',
          phoneVerified: true,
          invitationToken: null,
          invitationTokenExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, phoneUser.id))
        .returning();

      if (!updatedPhoneUser) {
        return NextResponse.json(
          { error: 'Failed to activate account' },
          { status: 500 },
        );
      }

      try {
        await adminAuth.updateUser(decodedToken.uid, { emailVerified: true });
      } catch (err) {
        console.error('Failed to set emailVerified on phone user:', err);
      }

      return NextResponse.json({
        success: true,
        message: 'Account activated successfully via phone',
        user: {
          id: updatedPhoneUser.id,
          email: updatedPhoneUser.email,
          name: updatedPhoneUser.name,
          role: updatedPhoneUser.role,
          status: updatedPhoneUser.status,
        },
      });
    }

    // ─── Email/password auth flow ─────────────────────────────────────────────
    if (!email && !token) {
      return NextResponse.json(
        { error: 'Email or token is required' },
        { status: 400 },
      );
    }

    let lookupEmail = email;

    if (token) {
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

      if (isTokenExpired(userByToken.invitationTokenExpiresAt)) {
        return NextResponse.json(
          { error: 'Invitation token has expired. Please request a new invitation.' },
          { status: 410 },
        );
      }

      lookupEmail = userByToken.email;
    }

    // Security: email must match Firebase user's email
    if (decodedToken.email?.toLowerCase() !== lookupEmail.toLowerCase()) {
      return NextResponse.json(
        { error: 'Forbidden: Email does not match authenticated user' },
        { status: 403 },
      );
    }

    // Idempotency: already linked?
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
          eq(users.firebaseUid, decodedToken.uid),
        ),
      )
      .limit(1);

    if (existingLinkedUser) {
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

    // Find invited user
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
      const [anyUser] = await db
        .select({ id: users.id, status: users.status, firebaseUid: users.firebaseUid })
        .from(users)
        .where(eq(users.email, lookupEmail.toLowerCase()))
        .limit(1);

      if (anyUser?.firebaseUid && anyUser.firebaseUid !== decodedToken.uid) {
        return NextResponse.json(
          { error: 'This email is already linked to a different account. Please sign in or contact support.' },
          { status: 409 },
        );
      }

      if (anyUser?.status === 'active') {
        return NextResponse.json(
          { error: 'This account has already been activated. Please sign in.' },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { error: 'No pending invitation found for this email. Please contact your therapist or administrator.' },
        { status: 404 },
      );
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        firebaseUid: decodedToken.uid,
        status: 'active',
        ...(phoneVerified === true && { phoneVerified: true }),
        invitationToken: null,
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

    try {
      await adminAuth.updateUser(decodedToken.uid, { emailVerified: true });
    } catch (err) {
      console.error('Failed to set emailVerified on email/password user:', err);
    }

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
      { error: 'Failed to link Firebase UID' },
      { status: 500 },
    );
  }
}
