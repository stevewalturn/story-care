/**
 * Rollback Firebase Account API
 * Deletes a Firebase account that was created but failed to link to the database
 * This is used for error recovery when the invitation flow fails after Firebase account creation
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { deleteFirebaseAccount, verifyIdToken } from '@/libs/FirebaseAdmin';

/**
 * POST /api/auth/rollback-firebase-account
 *
 * Request Body:
 * - (no body required - uses authenticated user's UID from token)
 *
 * Flow:
 * 1. Verify Firebase ID token to ensure authenticity
 * 2. Delete the Firebase account using Admin SDK
 * 3. Return success
 *
 * Security:
 * - Requires valid Firebase ID token (user must be authenticated)
 * - Only deletes the authenticated user's own account
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

    // Delete the Firebase account
    const result = await deleteFirebaseAccount(firebaseUser.uid);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Failed to delete Firebase account',
          details: result.error,
        },
        { status: 500 },
      );
    }

    console.log('✅ Successfully rolled back Firebase account:', {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
    });

    return NextResponse.json({
      success: true,
      message: 'Firebase account deleted successfully',
    });
  } catch (error) {
    console.error('Failed to rollback Firebase account:', error);
    return NextResponse.json(
      {
        error: 'Failed to rollback Firebase account',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
