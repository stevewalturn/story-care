# Firebase Authentication Setup Guide

This guide walks you through setting up Firebase Authentication in the Firebase Console to obtain the configuration values needed for StoryCare.

## Step 1: Create or Select a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** (or select an existing project)
3. Enter your project name (e.g., "StoryCare Production")
4. Accept the terms and click **Continue**
5. Disable Google Analytics (unless needed) and click **Create Project**

## Step 2: Add a Web App to Your Project

1. In your Firebase project dashboard, click the **Web icon** (</>) 
2. Register your app with a nickname (e.g., "StoryCare Web App")
3. Check **"Also set up Firebase Hosting"** if you plan to use it (optional)
4. Click **Register app**

## Step 3: Get Your Firebase Configuration

After registering, you'll see your Firebase configuration. Copy these values:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-XXXXXXXXXX" // Optional
};
```

## Step 4: Enable Authentication Providers

1. In the Firebase Console sidebar, click **Authentication**
2. Click **Get started**
3. Go to the **Sign-in method** tab
4. Enable the providers you need:
   - **Email/Password**: Click, toggle Enable, Save
   - **Google**: Click, toggle Enable, add a support email, Save
   - **Phone**: Click, toggle Enable, Save
   - **Magic Link**: Under Email/Password, enable "Email link (passwordless sign-in)"

## Step 5: Configure Authorized Domains

1. Still in **Authentication > Sign-in method**
2. Scroll down to **Authorized domains**
3. Add your domains:
   - `localhost` (already added)
   - Your production domain (e.g., `storycare.app`)
   - Your Vercel preview domains (e.g., `*.vercel.app`)

## Step 6: Set Up Firebase Admin SDK (Server-side)

1. Go to **Project Settings** (gear icon) > **Service accounts**
2. Click **Generate new private key**
3. Click **Generate key** in the popup
4. Save the downloaded JSON file securely

The JSON file contains:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

## Step 7: Configure Environment Variables

### For Local Development (.env.local)

```bash
# Client-side Firebase Config
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Server-side Firebase Admin SDK
# Option 1: Full service account JSON (recommended for local dev)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}

# Option 2: Individual fields (better for production)
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### For Production (Vercel Environment Variables)

1. Go to your Vercel project dashboard
2. Navigate to **Settings > Environment Variables**
3. Add each variable separately:
   - For multi-line values like `FIREBASE_ADMIN_PRIVATE_KEY`, paste the entire key including newlines
   - Vercel will handle the formatting correctly

## Step 8: Enable Multi-Factor Authentication (MFA)

1. In Firebase Console, go to **Authentication > Sign-in method**
2. Click on **SMS Multi-factor Authentication**
3. Toggle **Enable** and click **Save**
4. Configure MFA enforcement in your app code as needed

## Step 9: HIPAA Compliance (Production Only)

For HIPAA compliance, you need to:

1. **Upgrade to Blaze Plan** (pay-as-you-go)
2. **Request a BAA from Google**:
   - Contact Google Cloud sales
   - Request Business Associate Agreement for Firebase
   - This covers Firebase Authentication for HIPAA

## Step 10: Set Up Security Rules (Optional)

If using Firestore or Storage:

1. Go to **Firestore Database** or **Storage**
2. Click on **Rules** tab
3. Configure appropriate security rules
4. For StoryCare, we primarily use PostgreSQL, so this may not be needed

## Testing Your Configuration

1. Start your local development server:
   ```bash
   npm run dev
   ```

2. Test authentication flow:
   - Sign up with email/password
   - Sign in with Google
   - Verify tokens are working

3. Check the browser console for any Firebase errors

## Common Issues

- **"Invalid API key"**: Double-check your `NEXT_PUBLIC_FIREBASE_API_KEY`
- **"Auth domain not authorized"**: Add your domain in Authorized domains
- **CORS errors**: Ensure your domain is in the authorized list
- **Admin SDK errors**: Verify the service account JSON is properly formatted

## Next Steps

1. Test authentication locally
2. Deploy to Vercel with production environment variables
3. Enable MFA for therapist accounts
4. Sign BAA with Google for HIPAA compliance
5. Set up monitoring and alerts

## Additional Resources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth/web/start)
- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Firebase HIPAA Compliance](https://cloud.google.com/security/compliance/hipaa)