import type { FirebaseApp } from 'firebase/app';
import type { Auth, ConfirmationResult, User } from 'firebase/auth';
import { getApps, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  RecaptchaVerifier,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signOut,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase

let app: FirebaseApp;

let auth: Auth;

if (typeof window !== 'undefined') {
  // Only initialize on client side
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]!;
  auth = getAuth(app);
}

// Auth functions
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const signUp = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    // Send Firebase email verification — user must verify before signing in
    await sendEmailVerification(userCredential.user, {
      url: `${process.env.NEXT_PUBLIC_APP_URL}/sign-in?verified=true`,
    });

    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

/**
 * Create a Firebase account without sending email verification.
 * Used for invitation flows where the token or phone OTP already proves identity.
 * The server-side link-firebase-uid route will mark emailVerified=true via Admin SDK.
 */
export const signUpNoVerification = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export const resendVerificationEmail = async (user: import('firebase/auth').User) => {
  try {
    await sendEmailVerification(user, {
      url: `${process.env.NEXT_PUBLIC_APP_URL}/sign-in?verified=true`,
    });
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Send phone OTP via Firebase Phone Authentication.
 * Attaches an invisible reCAPTCHA to the given container element ID.
 * Clears any existing RecaptchaVerifier before creating a new one (required for resend).
 * Returns a ConfirmationResult and the verifier to be used with confirmPhoneOtp().
 */
export const sendPhoneOtp = async (
  phoneNumber: string,
  recaptchaContainerId: string,
  previousVerifier?: RecaptchaVerifier | null,
): Promise<
  | { confirmationResult: ConfirmationResult; recaptchaVerifier: RecaptchaVerifier; error: null }
  | { confirmationResult: null; recaptchaVerifier: null; error: string }
> => {
  try {
    // Clear old verifier before creating a new one — avoids duplicate widget errors on resend
    if (previousVerifier) {
      try { previousVerifier.clear(); } catch { /* ignore — may already be cleared */ }
    }
    const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
      size: 'invisible',
    });
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return { confirmationResult, recaptchaVerifier, error: null };
  } catch (error: any) {
    return { confirmationResult: null, recaptchaVerifier: null, error: error.message };
  }
};

/**
 * Confirm phone OTP code. Returns the authenticated Firebase user on success.
 */
export const confirmPhoneOtp = async (
  confirmationResult: ConfirmationResult,
  code: string,
): Promise<{ user: User; error: null } | { user: null; error: string }> => {
  try {
    const credential = await confirmationResult.confirm(code);
    return { user: credential.user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
};

export { auth };
