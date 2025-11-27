# Firebase Authentication Setup Guide

Complete guide for setting up Firebase Authentication for StoryCare with HIPAA compliance considerations.

## 🎯 Why Firebase Authentication?

Firebase Auth (powered by Google Identity Platform) is ideal for healthcare applications:

- ✅ **HIPAA Compliant** - Can sign BAA with Google
- ✅ **Multiple Auth Methods** - Email/password, Google, phone, magic links
- ✅ **MFA Support** - Required for HIPAA compliance
- ✅ **Session Management** - Automatic token refresh
- ✅ **User Management** - Built-in admin SDK
- ✅ **Security** - Industry-standard JWT tokens

---

## 🚀 Quick Setup (10 minutes)

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add Project** (or select existing project)
3. Configure:
   - **Project name:** `storycare-production` (or your preferred name)
   - **Analytics:** Disable (not needed for auth, reduces compliance scope)
4. Click **Create Project**
5. Wait for project creation (~30 seconds)

### Step 2: Register Web App

1. In Firebase Console, click the **Web** icon (`</>`)
2. Configure:
   - **App nickname:** `StoryCare Web App`
   - **Firebase Hosting:** Leave unchecked (we use Cloud Run)
3. Click **Register App**
4. **Copy the Firebase configuration** - you'll need these values:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB...",              // NEXT_PUBLIC_FIREBASE_API_KEY
  authDomain: "storycare-xxx.firebaseapp.com",  // NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  projectId: "storycare-xxx",        // NEXT_PUBLIC_FIREBASE_PROJECT_ID
  storageBucket: "storycare-xxx.firebasestorage.app",  // NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  messagingSenderId: "123456789",    // NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  appId: "1:123456789:web:abc123",   // NEXT_PUBLIC_FIREBASE_APP_ID
  measurementId: "G-XXXXXXXXXX"      // NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID (optional)
};
```

5. Click **Continue to Console**

---

## 🔐 Configure Authentication Methods

### Step 3: Enable Email/Password Authentication

1. In Firebase Console, click **Authentication** in sidebar
2. Click **Get Started**
3. Click **Sign-in method** tab
4. Click **Email/Password**
5. Toggle **Enable**
6. Toggle **Email link (passwordless sign-in)** if you want magic links
7. Click **Save**

### Step 4: Enable Google Sign-In (Recommended)

1. Still in **Sign-in method** tab
2. Click **Google**
3. Toggle **Enable**
4. Configure:
   - **Project support email:** your-email@example.com
   - **Project public-facing name:** StoryCare
5. Click **Save**

### Step 5: Enable Multi-Factor Authentication (Required for HIPAA)

1. In Authentication, go to **Settings** tab
2. Scroll to **Multi-factor authentication**
3. Click **Manage**
4. Configure:
   - **Enrollment:** Optional (start) → Required (for production)
   - **SMS:** Enable for phone-based MFA
   - **TOTP:** Enable for authenticator apps (Google Authenticator, Authy)
5. Click **Save**

**For Production HIPAA Compliance:**
- Set enrollment to **Required** for therapist/admin roles
- Patients can have optional MFA

---

## 🔑 Get Service Account Credentials

### Step 6: Create Service Account

Firebase Admin SDK needs service account credentials for server-side operations.

1. In Firebase Console, click ⚙️ (Settings) → **Project Settings**
2. Go to **Service Accounts** tab
3. Click **Generate New Private Key**
4. Click **Generate Key**
5. A JSON file will download - **SAVE THIS SECURELY**

The file looks like:
```json
{
  "type": "service_account",
  "project_id": "storycare-xxx",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIB...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@storycare-xxx.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### Step 7: Extract Required Values

From the service account JSON, you need:

- `project_id` → `FIREBASE_PROJECT_ID`
- `client_email` → `FIREBASE_CLIENT_EMAIL`
- `private_key` → `FIREBASE_PRIVATE_KEY`

**Important:** The private key includes `\n` characters - keep them as-is!

---

## 🌍 Configure Authorized Domains

### Step 8: Add Authorized Domains

Firebase only allows auth from approved domains.

1. In Firebase Console → **Authentication** → **Settings**
2. Scroll to **Authorized domains**
3. Add these domains:
   - `localhost` (already there - for development)
   - Your Cloud Run URL: `storycare-app-xxxxx.a.run.app`
   - Your custom domain (if you have one): `app.storycare.com`
4. Click **Add domain** for each

---

## 📝 Add Environment Variables

### Step 9: Local Development (.env.local)

```bash
# Firebase Authentication (Client-side - Public)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyB...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=storycare-xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=storycare-xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=storycare-xxx.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Firebase Admin SDK (Server-side - Private)
FIREBASE_PROJECT_ID=storycare-xxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@storycare-xxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIB...\n-----END PRIVATE KEY-----\n"
```

**Important:** Keep the `\n` in the private key!

### Step 10: GitHub Actions Secrets

Add these secrets to GitHub (Settings → Secrets → Actions):

**Client-side (NEXT_PUBLIC):**
1. `NEXT_PUBLIC_FIREBASE_API_KEY`
2. `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
3. `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
4. `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
5. `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
6. `NEXT_PUBLIC_FIREBASE_APP_ID`
7. `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

**Server-side (Admin SDK):**
8. `FIREBASE_PROJECT_ID`
9. `FIREBASE_CLIENT_EMAIL`
10. `FIREBASE_PRIVATE_KEY` (paste entire private key including `\n`)

### Step 11: GCP Secret Manager (for Cloud Build)

```bash
# Client-side secrets
echo -n "AIzaSyB..." | gcloud secrets create NEXT_PUBLIC_FIREBASE_API_KEY --data-file=-
echo -n "storycare-xxx.firebaseapp.com" | gcloud secrets create NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN --data-file=-
echo -n "storycare-xxx" | gcloud secrets create NEXT_PUBLIC_FIREBASE_PROJECT_ID --data-file=-
echo -n "storycare-xxx.firebasestorage.app" | gcloud secrets create NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET --data-file=-
echo -n "123456789" | gcloud secrets create NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --data-file=-
echo -n "1:123456789:web:abc123" | gcloud secrets create NEXT_PUBLIC_FIREBASE_APP_ID --data-file=-
echo -n "G-XXXXXXXXXX" | gcloud secrets create NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID --data-file=-

# Server-side secrets (Admin SDK)
echo -n "storycare-xxx" | gcloud secrets create FIREBASE_PROJECT_ID --data-file=-
echo -n "firebase-adminsdk-xxxxx@storycare-xxx.iam.gserviceaccount.com" | gcloud secrets create FIREBASE_CLIENT_EMAIL --data-file=-

# For private key - paste the entire key including \n characters
echo -n "-----BEGIN PRIVATE KEY-----
MIIEvQIB...
-----END PRIVATE KEY-----
" | gcloud secrets create FIREBASE_PRIVATE_KEY --data-file=-
```

Or use the automated script:
```bash
./scripts/setup-gcp-secrets.sh
```

---

## 🧪 Test Authentication

### Step 12: Test Local Setup

1. Start development server:
```bash
npm run dev
```

2. Open http://localhost:3000

3. Try to sign up/sign in:
   - Should redirect to login page
   - Try email/password registration
   - Try Google Sign-In
   - Check browser console for any Firebase errors

### Step 13: Verify Firebase Admin SDK

Create a test script `scripts/test-firebase-admin.js`:

```javascript
const admin = require('firebase-admin');

// Initialize with environment variables
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

// Test: List users
admin.auth().listUsers(10)
  .then((result) => {
    console.log('✅ Firebase Admin SDK working!');
    console.log(`Found ${result.users.length} users`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Firebase Admin SDK error:', error);
    process.exit(1);
  });
```

Run test:
```bash
node --env-file=.env.local scripts/test-firebase-admin.js
```

---

## 👥 User Management

### Create Users Programmatically

```typescript
// src/libs/FirebaseAdmin.ts usage
import { adminAuth } from '@/libs/FirebaseAdmin';

// Create user
const user = await adminAuth.createUser({
  email: 'therapist@example.com',
  password: 'secure-password-123',
  displayName: 'Dr. Jane Smith',
  emailVerified: true, // Skip email verification for therapists
});

// Set custom claims (for role-based access)
await adminAuth.setCustomUserClaims(user.uid, {
  role: 'therapist',
  organizationId: 'org-123',
});

// Get user by email
const userRecord = await adminAuth.getUserByEmail('therapist@example.com');

// Delete user
await adminAuth.deleteUser(user.uid);
```

### User Roles

StoryCare uses custom claims for roles:

```typescript
// Role types
type UserRole = 'superadmin' | 'admin' | 'therapist' | 'patient';

// Set role
await adminAuth.setCustomUserClaims(uid, {
  role: 'therapist',
  permissions: ['create_sessions', 'view_patients'],
});

// Verify role in API routes
import { verifyIdToken } from '@/libs/FirebaseAdmin';

const decodedToken = await verifyIdToken(idToken);
if (decodedToken.role !== 'therapist') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}
```

---

## 🔒 Security Configuration

### Step 14: Session Duration

1. In Firebase Console → **Authentication** → **Settings**
2. Scroll to **User session duration**
3. Configure:
   - **ID token expiration:** 1 hour (default)
   - **Session cookie expiration:** 24 hours
   - **Refresh token expiration:** Auto-refresh

For HIPAA compliance:
- Set session timeout to 24 hours
- Require re-authentication for sensitive operations
- Implement automatic logout after inactivity

### Step 15: Password Policy

1. In **Authentication** → **Settings**
2. Scroll to **Password policy**
3. Configure:
   - **Minimum length:** 12 characters (HIPAA recommendation)
   - **Requires:** Uppercase, lowercase, number, special character
   - **Password history:** Prevent reuse of last 5 passwords

### Step 16: Email Templates

Customize auth emails:

1. In **Authentication** → **Templates**
2. Customize:
   - **Email verification**
   - **Password reset**
   - **Email change**
   - **SMS verification**

Update templates with your branding:
- Logo: Add StoryCare logo
- Company name: StoryCare
- Support email: support@storycare.com

---

## 🏥 HIPAA Compliance Setup

### Step 17: Sign Business Associate Agreement (BAA)

Firebase/Google Identity Platform can be HIPAA compliant, but you must:

1. **Upgrade to Firebase Blaze Plan** (pay-as-you-go)
   - Free tier doesn't support BAA
   - Go to **Project Settings** → **Usage and billing** → **Upgrade**

2. **Request BAA from Google:**
   - Contact Google Cloud Sales: https://cloud.google.com/contact
   - Specify: "HIPAA BAA for Firebase Authentication"
   - Complete BAA signing process
   - Keep BAA documentation on file

3. **Enable Google Identity Platform:**
   - Firebase Auth uses Google Identity Platform
   - Go to https://console.cloud.google.com/customer-identity
   - Enable Identity Platform for your project

### Step 18: HIPAA Configuration Checklist

After BAA is signed:

- [ ] Multi-factor authentication **required** for therapists/admins
- [ ] Password policy enforced (12+ chars, complexity)
- [ ] Session timeout set (24 hours max)
- [ ] Audit logging enabled
- [ ] Email verification required
- [ ] Password reset flow tested
- [ ] Account lockout after failed attempts
- [ ] No PHI stored in Firebase Auth user metadata
- [ ] Custom claims used only for roles/permissions (no PHI)

**Important:** Store all PHI in PostgreSQL database, not Firebase!

---

## 🔍 Monitoring & Logs

### View Authentication Logs

1. In Firebase Console → **Authentication** → **Users**
2. View user list, last sign-in, creation date

For detailed logs:
1. Go to https://console.cloud.google.com/logs
2. Filter by resource: `audited_resource`
3. Filter by service: `identitytoolkit.googleapis.com`

### Monitor Failed Login Attempts

```typescript
// Track failed logins in your Next.js API routes
import { adminAuth } from '@/libs/FirebaseAdmin';

try {
  await adminAuth.verifyIdToken(token);
} catch (error) {
  // Log failed attempt
  console.error('Failed login attempt:', {
    timestamp: new Date(),
    error: error.message,
    ip: request.headers.get('x-forwarded-for'),
  });

  // Consider: Block IP after X failed attempts
}
```

---

## 🔄 Migration & Backup

### Export Users

```bash
# Install firebase-tools
npm install -g firebase-tools

# Login
firebase login

# Export users
firebase auth:export users.json --project storycare-xxx
```

### Import Users

```bash
# Import from JSON
firebase auth:import users.json --project storycare-xxx --hash-algo=scrypt
```

### Backup User List

```typescript
// scripts/backup-users.ts
import { adminAuth } from '@/libs/FirebaseAdmin';
import fs from 'fs';

async function backupUsers() {
  const users = [];
  let pageToken;

  do {
    const result = await adminAuth.listUsers(1000, pageToken);
    users.push(...result.users.map(u => ({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      emailVerified: u.emailVerified,
      metadata: u.metadata,
      customClaims: u.customClaims,
    })));
    pageToken = result.pageToken;
  } while (pageToken);

  fs.writeFileSync(
    `users-backup-${new Date().toISOString()}.json`,
    JSON.stringify(users, null, 2)
  );

  console.log(`Backed up ${users.length} users`);
}

backupUsers();
```

Run:
```bash
node --env-file=.env.local -r esbuild-register scripts/backup-users.ts
```

---

## 🐛 Troubleshooting

### Error: "Firebase: Error (auth/invalid-api-key)"

**Problem:** Incorrect API key.

**Solution:**
- Verify `NEXT_PUBLIC_FIREBASE_API_KEY` matches Firebase Console
- Check for extra spaces or quotes

### Error: "Firebase: Error (auth/unauthorized-domain)"

**Problem:** Domain not authorized.

**Solution:**
1. Go to Authentication → Settings → Authorized domains
2. Add your domain (localhost, Cloud Run URL, custom domain)

### Error: "Admin SDK: Error authenticating"

**Problem:** Invalid service account credentials.

**Solution:**
- Verify `FIREBASE_PRIVATE_KEY` includes `\n` characters
- Ensure no extra escaping (should be `\n`, not `\\n`)
- Check project ID and client email are correct

### Error: "auth/email-already-in-use"

**Problem:** User already exists.

**Solution:**
- Check Firebase Console → Authentication → Users
- Use password reset flow
- Or delete and recreate user

### Error: "auth/weak-password"

**Problem:** Password doesn't meet policy.

**Solution:**
- Ensure 12+ characters
- Include uppercase, lowercase, number, special character
- Check password policy in Firebase Console

---

## 🎯 Production Checklist

Before going live:

- [ ] Firebase project created and configured
- [ ] Blaze plan enabled (for HIPAA BAA)
- [ ] BAA signed with Google
- [ ] Email/password auth enabled
- [ ] Google Sign-In enabled (optional)
- [ ] MFA required for therapists/admins
- [ ] Password policy enforced
- [ ] Authorized domains added (Cloud Run URL)
- [ ] Service account credentials secured
- [ ] All environment variables set in Cloud Run
- [ ] Email templates customized
- [ ] Session duration configured
- [ ] Audit logging enabled
- [ ] Test login/signup flows
- [ ] Test password reset
- [ ] Test MFA enrollment
- [ ] Backup strategy documented

---

## 📚 Additional Resources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Google Identity Platform](https://cloud.google.com/identity-platform)
- [HIPAA Compliance Guide](https://cloud.google.com/security/compliance/hipaa)
- [Firebase Console](https://console.firebase.google.com/)

---

## 🆘 Need Help?

- [Firebase Support](https://firebase.google.com/support)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/firebase-authentication)
- [Firebase Discord](https://discord.gg/firebase)

---

**Last Updated:** 2025-01-15
**Version:** 1.0.0
