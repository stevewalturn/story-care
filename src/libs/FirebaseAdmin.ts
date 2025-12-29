import type { App } from 'firebase-admin/app';
import type { Auth } from 'firebase-admin/auth';
import { eq } from 'drizzle-orm';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { db } from '@/libs/DB';
import { users } from '@/models/Schema';

let adminApp: App;

let adminAuth: Auth;

// Initialize Firebase Admin SDK
if (getApps().length === 0) {
  try {
    // Try to use service account key JSON string
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : {
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        };

    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });

    adminAuth = getAuth(adminApp);
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    throw error;
  }
} else {
  adminApp = getApps()[0]!;
  adminAuth = getAuth(adminApp);
}

/**
 * Verify Firebase ID token and return decoded user information with role from database
 */
export async function verifyIdToken(token: string) {
  try {
    // 1. Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(token);

    // 2. Fetch user's role from database (NOT from Firebase custom claims)
    let dbUser = await db.query.users.findFirst({
      where: eq(users.firebaseUid, decodedToken.uid),
      columns: {
        id: true,
        name: true, // Include name for inviter identification
        role: true,
        organizationId: true,
        firebaseUid: true,
        status: true,
        avatarUrl: true,
      },
    });

    // 3. If user doesn't exist by Firebase UID, check if they're an invited user (by email)
    if (!dbUser && decodedToken.email) {
      const invitedUser = await db.query.users.findFirst({
        where: (users, { and, eq, isNull }) => and(
          eq(users.email, decodedToken.email!),
          isNull(users.firebaseUid),
        ),
        columns: {
          id: true,
          name: true, // Include name for inviter identification
          role: true,
          organizationId: true,
          firebaseUid: true,
          status: true,
          avatarUrl: true,
        },
      });

      // If invited user found, link their Firebase account and activate
      if (invitedUser && invitedUser.status === 'invited') {
        const [updatedUser] = await db
          .update(users)
          .set({
            firebaseUid: decodedToken.uid,
            status: 'active', // Automatically activate invited users
            updatedAt: new Date(),
          })
          .where(eq(users.id, invitedUser.id))
          .returning({
            id: users.id,
            name: users.name,
            role: users.role,
            organizationId: users.organizationId,
            firebaseUid: users.firebaseUid,
            status: users.status,
            avatarUrl: users.avatarUrl,
          });

        dbUser = updatedUser;
      }
    }

    // 4. If user still doesn't exist, they haven't been invited or signed up
    if (!dbUser) {
      throw new Error('User not found in database. Please complete registration or contact your administrator.');
    }

    return {
      uid: decodedToken.uid,
      dbUserId: dbUser.id, // Database UUID
      name: dbUser.name, // User's display name
      organizationId: dbUser.organizationId,
      email: decodedToken.email || null,
      emailVerified: decodedToken.email_verified || false,
      role: dbUser.role as 'super_admin' | 'org_admin' | 'therapist' | 'patient',
      status: dbUser.status as 'invited' | 'active' | 'inactive',
      avatarUrl: dbUser.avatarUrl || null,
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Unauthorized');
  }
}

/**
 * Get user by UID
 */
export async function getUserByUid(uid: string) {
  try {
    const userRecord = await adminAuth.getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
  }
}

/**
 * Set custom user claims (e.g., role)
 */
export async function setCustomClaims(uid: string, claims: Record<string, any>) {
  try {
    await adminAuth.setCustomUserClaims(uid, claims);
    return true;
  } catch (error) {
    console.error('Failed to set custom claims:', error);
    return false;
  }
}

/**
 * Delete Firebase account (used for rollback when account linking fails)
 * WARNING: This is a destructive operation. Use only for error recovery.
 */
export async function deleteFirebaseAccount(uid: string) {
  try {
    await adminAuth.deleteUser(uid);
    console.log(`🗑️ Successfully deleted Firebase account: ${uid}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete Firebase account:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export { adminApp, adminAuth };
