# Firebase Authentication Setup Guide

This guide walks you through setting up Firebase Authentication for the StoryCare platform. Firebase Authentication is a critical component that enables secure user authentication with support for multiple providers.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Create Firebase Project](#create-firebase-project)
3. [Enable Authentication Methods](#enable-authentication-methods)
4. [Get Configuration Keys](#get-configuration-keys)
5. [Configure Environment Variables](#configure-environment-variables)
6. [Set Up Firebase Admin SDK](#set-up-firebase-admin-sdk)
7. [Update Code to Use Firebase](#update-code-to-use-firebase)
8. [Testing Authentication](#testing-authentication)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Google account
- Node.js 20+ installed
- Access to Google Cloud Console
- Basic understanding of authentication concepts

**Estimated Time**: 30-45 minutes

---

## 1. Create Firebase Project

### Step 1.1: Go to Firebase Console
1. Navigate to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**

### Step 1.2: Configure Project
1. **Project name**: Enter `storycare-dev` (or your preferred name)
2. Click **Continue**
3. **Google Analytics**:
   - Toggle ON (recommended for production)
   - Toggle OFF (for quick setup)
4. Click **Continue** → **Create project**
5. Wait for project creation (30-60 seconds)
6. Click **Continue** to enter project dashboard

---

## 2. Enable Authentication Methods

### Step 2.1: Navigate to Authentication
1. In the Firebase Console left sidebar, click **"Build"** → **"Authentication"**
2. Click **"Get started"** button

### Step 2.2: Enable Email/Password Authentication
1. Click on **"Sign-in method"** tab
2. Click on **"Email/Password"** provider
3. Toggle **"Enable"** to ON
4. Toggle **"Email link (passwordless sign-in)"** if desired
5. Click **"Save"**

### Step 2.3: Enable Google Sign-In (Recommended)
1. Still in "Sign-in method" tab
2. Click on **"Google"** provider
3. Toggle **"Enable"** to ON
4. **Project support email**: Select your email from dropdown
5. Click **"Save"**

### Step 2.4: (Optional) Enable Additional Providers
You can enable additional providers based on your needs:
- **Facebook**: Requires Facebook App ID and App Secret
- **Twitter/X**: Requires API Key and Secret
- **GitHub**: Requires OAuth App credentials
- **Apple**: Requires Apple Developer account
- **Phone**: Requires phone number verification setup

**For this tutorial, Email/Password and Google are sufficient.**

---

## 3. Get Configuration Keys

### Step 3.1: Register Your Web App
1. In Firebase Console, click the **gear icon** (⚙️) next to "Project Overview"
2. Click **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **Web icon** `</>` to add a web app
5. **App nickname**: Enter `StoryCare Web App`
6. **Firebase Hosting**: Leave unchecked for now
7. Click **"Register app"**

### Step 3.2: Copy Firebase Configuration
You'll see a configuration object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "storycare-dev.firebaseapp.com",
  projectId: "storycare-dev",
  storageBucket: "storycare-dev.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

**IMPORTANT**: Keep this window open or copy these values to a secure location.

### Step 3.3: Get Service Account Key (For Server-Side)
1. Still in **Project settings**, click **"Service accounts"** tab
2. Click **"Generate new private key"**
3. A dialog appears warning you about security
4. Click **"Generate key"**
5. A JSON file will download (e.g., `storycare-dev-firebase-adminsdk-xxxxx.json`)

**CRITICAL**: This file contains sensitive credentials. **NEVER** commit it to Git!

---

## 4. Configure Environment Variables

### Step 4.1: Create `.env.local` File
In your project root, create a new file named `.env.local`:

```bash
touch .env.local
```

### Step 4.2: Add Firebase Client Configuration
Open `.env.local` and add your Firebase config values:

```bash
# Firebase Authentication - Client Side (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=storycare-dev.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=storycare-dev
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=storycare-dev.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890

# Firebase Admin SDK - Server Side (Private)
FIREBASE_PROJECT_ID=storycare-dev
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@storycare-dev.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Database (Keep existing)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres

# Next.js (Keep existing)
NEXT_TELEMETRY_DISABLED=1
```

### Step 4.3: Extract Service Account Credentials
Open the downloaded JSON file (`storycare-dev-firebase-adminsdk-xxxxx.json`):

```json
{
  "type": "service_account",
  "project_id": "storycare-dev",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@storycare-dev.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  ...
}
```

Copy these values to your `.env.local`:
- `project_id` → `FIREBASE_PROJECT_ID`
- `client_email` → `FIREBASE_CLIENT_EMAIL`
- `private_key` → `FIREBASE_PRIVATE_KEY` (keep it in quotes!)

**Important**: The `private_key` contains `\n` characters - keep them as-is within double quotes.

### Step 4.4: Update `.env.example`
Update the example file for other developers:

```bash
# Firebase Authentication
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (Server-side)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
```

---

## 5. Set Up Firebase Admin SDK

### Step 5.1: Install Firebase Packages

```bash
npm install firebase firebase-admin
```

### Step 5.2: Update Environment Validation
Edit `src/libs/Env.ts` to add Firebase variables:

```typescript
import { createEnv } from '@t3-oss/env-nextjs';
import * as z from 'zod';

export const Env = createEnv({
  server: {
    ARCJET_KEY: z.string().startsWith('ajkey_').optional(),
    DATABASE_URL: z.string().min(1),

    // Firebase Admin SDK (Server-side)
    FIREBASE_PROJECT_ID: z.string().min(1),
    FIREBASE_CLIENT_EMAIL: z.string().email(),
    FIREBASE_PRIVATE_KEY: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().optional(),

    // Firebase Client SDK (Public)
    NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),

    NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN: z.string().optional(),
    NEXT_PUBLIC_BETTER_STACK_INGESTING_HOST: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),
  },
  shared: {
    NODE_ENV: z.enum(['test', 'development', 'production']).optional(),
  },
  runtimeEnv: {
    ARCJET_KEY: process.env.ARCJET_KEY,
    DATABASE_URL: process.env.DATABASE_URL,

    // Firebase Server
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,

    // Firebase Client
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,

    NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN: process.env.NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN,
    NEXT_PUBLIC_BETTER_STACK_INGESTING_HOST: process.env.NEXT_PUBLIC_BETTER_STACK_INGESTING_HOST,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NODE_ENV: process.env.NODE_ENV,
  },
});
```

### Step 5.3: Create Firebase Client Configuration
Create/update `src/libs/Firebase.ts`:

```typescript
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { Env } from './Env';

const firebaseConfig = {
  apiKey: Env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: Env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: Env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: Env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: Env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (singleton pattern)
let app: FirebaseApp;
let auth: Auth;

if (typeof window !== 'undefined') {
  // Client-side only
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]!;
  auth = getAuth(app);
}

export { app, auth };
```

### Step 5.4: Create Firebase Admin Configuration
Create `src/libs/FirebaseAdmin.ts`:

```typescript
import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { Env } from './Env';

let adminApp: App;
let adminAuth: Auth;

// Initialize Firebase Admin (singleton pattern)
if (getApps().length === 0) {
  adminApp = initializeApp({
    credential: cert({
      projectId: Env.FIREBASE_PROJECT_ID,
      clientEmail: Env.FIREBASE_CLIENT_EMAIL,
      privateKey: Env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
} else {
  adminApp = getApps()[0]!;
}

adminAuth = getAuth(adminApp);

export { adminApp, adminAuth };
```

---

## 6. Update Code to Use Firebase

### Step 6.1: Create Auth Context
Create `src/contexts/AuthContext.tsx`:

```typescript
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '@/libs/Firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### Step 6.2: Update Root Layout
Update `src/app/[locale]/layout.tsx` to include AuthProvider:

```typescript
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### Step 6.3: Create Protected Route Middleware
Update `src/middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session');

  // Protect authenticated routes
  if (request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/sessions') ||
      request.nextUrl.pathname.startsWith('/assets')) {

    if (!session) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    // Verify session with Firebase Admin SDK
    try {
      // Add session verification logic here
    } catch (error) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/sessions/:path*', '/assets/:path*'],
};
```

### Step 6.4: Create Sign-In Page
Update `src/app/[locale]/(auth)/(center)/sign-in/[[...sign-in]]/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <h2 className="text-center text-3xl font-bold">Sign In</h2>

        {error && (
          <div className="rounded bg-red-50 p-3 text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSignIn} className="space-y-6">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded border p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded border p-2"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-indigo-600 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full rounded border py-2 hover:bg-gray-50 disabled:opacity-50"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
```

---

## 7. Testing Authentication

### Step 7.1: Start Development Server

```bash
npm run dev:simple
```

### Step 7.2: Create Test User
1. Open your browser to `http://localhost:3000/sign-in`
2. Try signing up with email/password
3. Check Firebase Console → Authentication → Users to see the new user

### Step 7.3: Test Google Sign-In
1. Click "Sign in with Google"
2. Select your Google account
3. Authorize the app
4. Should redirect to dashboard

### Step 7.4: Verify in Firebase Console
1. Go to Firebase Console → Authentication → Users
2. You should see your test users listed
3. Check the "Sign-in method" column

---

## 8. Troubleshooting

### Issue: "Firebase: Error (auth/invalid-api-key)"
**Solution**:
- Check that `NEXT_PUBLIC_FIREBASE_API_KEY` is correct
- Ensure no extra spaces in `.env.local`
- Restart dev server after changing env variables

### Issue: "Firebase: Error (auth/unauthorized-domain)"
**Solution**:
1. Go to Firebase Console → Authentication → Settings
2. Click "Authorized domains" tab
3. Add `localhost` to the list

### Issue: "Private key must be a string"
**Solution**:
- Ensure `FIREBASE_PRIVATE_KEY` is wrapped in double quotes
- Keep the `\n` characters in the string
- Example: `FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"`

### Issue: Dev server still exits immediately
**Solution**:
```bash
# Check for detailed error
npm run dev:simple 2>&1 | tee dev.log

# Check if all required env vars are set
node -e "require('dotenv').config({ path: '.env.local' }); console.log(process.env)"
```

### Issue: "Module not found: Can't resolve 'firebase'"
**Solution**:
```bash
npm install firebase firebase-admin
```

### Issue: Session cookies not working
**Solution**:
- Implement session management with Firebase Admin SDK
- Create API route to generate session cookies
- See: [Firebase Auth Sessions](https://firebase.google.com/docs/auth/admin/manage-cookies)

---

## 9. Production Deployment

### Step 9.1: Configure Authorized Domains
1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add your production domain (e.g., `storycare.app`)
3. Add your Vercel preview domains (e.g., `*.vercel.app`)

### Step 9.2: Set Environment Variables in Vercel
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all `NEXT_PUBLIC_FIREBASE_*` variables
3. Add all `FIREBASE_*` variables (keep private key format)
4. Set for: Production, Preview, Development

### Step 9.3: Enable Firebase Security Rules
1. Go to Firebase Console → Firestore Database (if using)
2. Update security rules to restrict access
3. Only allow authenticated users to read/write their own data

### Step 9.4: Enable App Check (Optional but Recommended)
1. Firebase Console → Build → App Check
2. Register your app
3. Protects against abuse and unauthorized access

---

## Next Steps

- [ ] Set up Firebase Storage for file uploads (if needed)
- [ ] Configure Firebase Cloud Firestore (if using instead of PostgreSQL)
- [ ] Implement role-based access control (Therapist, Patient, Admin)
- [ ] Add multi-factor authentication (MFA)
- [ ] Set up Firebase Analytics
- [ ] Configure custom email templates
- [ ] Add phone authentication
- [ ] Implement password policies

---

## Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Next.js Authentication Patterns](https://nextjs.org/docs/authentication)
- [Firebase Security Best Practices](https://firebase.google.com/docs/rules/security-best-practices)

---

**Need Help?**
- Firebase Support: https://firebase.google.com/support
- Stack Overflow: https://stackoverflow.com/questions/tagged/firebase
- Firebase Community: https://firebase.google.com/community

---

**Last Updated**: 2025-10-30
**Maintained By**: Development Team
