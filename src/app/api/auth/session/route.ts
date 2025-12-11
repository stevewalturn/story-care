import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { adminAuth } from '@/libs/FirebaseAdmin';
import { users } from '@/models/Schema';

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    // Verify the token with Firebase Admin SDK
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { uid, email, name, email_verified } = decodedToken;

    // SECURITY: Require email verification
    if (!email_verified) {
      return NextResponse.json(
        { error: 'Email verification required. Please verify your email before signing in.' },
        { status: 403 },
      );
    }

    // Check if user exists in database by Firebase UID
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, uid))
      .limit(1);

    if (!existingUser) {
      // Check if user exists by email (user created before Firebase auth)
      const [userByEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, email || ''))
        .limit(1);

      if (userByEmail) {
        // Update existing user with Firebase UID
        // If user was invited (status='invited'), activate them
        await db
          .update(users)
          .set({
            firebaseUid: uid,
            status: userByEmail.status === 'invited' ? 'active' : userByEmail.status,
            lastLoginAt: new Date(),
          })
          .where(eq(users.id, userByEmail.id));

        console.log('✅ Linked Firebase UID to existing user:', {
          userId: userByEmail.id,
          email: userByEmail.email,
          previousStatus: userByEmail.status,
          newStatus: userByEmail.status === 'invited' ? 'active' : userByEmail.status,
        });
      } else {
        // Create new user in database
        await db.insert(users).values({
          firebaseUid: uid,
          email: email || '',
          name: name || email?.split('@')[0] || 'User',
          role: 'therapist', // Default to therapist role, can be updated later
        });
      }
    } else {
      // Update last login time
      await db
        .update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.firebaseUid, uid));
    }

    // Set session cookie with the Firebase ID token
    // HIPAA COMPLIANCE: 24-hour session maximum
    const cookieStore = await cookies();
    cookieStore.set('session', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours (HIPAA compliant)
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session cookie error:', error);
    return NextResponse.json(
      { error: 'Failed to set session' },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 },
    );
  }
}
