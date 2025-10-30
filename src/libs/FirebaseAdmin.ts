import type { App } from 'firebase-admin/app';
import type { Auth } from 'firebase-admin/auth';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { eq } from 'drizzle-orm';
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
    const dbUser = await db.query.users.findFirst({
      where: eq(users.firebaseUid, decodedToken.uid),
      columns: {
        id: true,
        role: true,
        firebaseUid: true,
      },
    });

    // 3. If user doesn't exist in database, they haven't completed onboarding
    if (!dbUser) {
      throw new Error('User not found in database. Please complete registration.');
    }

    return {
      uid: decodedToken.uid,
      dbUserId: dbUser.id, // Database UUID
      email: decodedToken.email || null,
      emailVerified: decodedToken.email_verified || false,
      role: dbUser.role as 'therapist' | 'patient' | 'admin',
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

export { adminApp, adminAuth };
