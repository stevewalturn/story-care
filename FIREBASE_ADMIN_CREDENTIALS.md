# How to Get Firebase Admin SDK Credentials

Quick visual guide to find your Firebase Admin credentials: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`.

---

## What You Need

These three environment variables for Firebase Admin SDK (server-side):

```bash
FIREBASE_PROJECT_ID=storycare-dev
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@storycare-dev.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

---

## Step-by-Step Instructions

### Step 1: Go to Firebase Console

Open [Firebase Console](https://console.firebase.google.com/)

Select your project (e.g., `storycare-dev`)

---

### Step 2: Open Project Settings

1. Click the **⚙️ gear icon** next to "Project Overview" (top left)
2. Select **"Project settings"**

```
┌─────────────────────────────┐
│ 🔥 Project Overview         │
│ ⚙️  Project settings  ← CLICK│
│ 👥 Users and permissions    │
│ 📊 Usage and billing        │
└─────────────────────────────┘
```

---

### Step 3: Go to Service Accounts Tab

1. In Project Settings, click **"Service accounts"** tab (top menu)
2. You'll see something like:

```
┌────────────────────────────────────────────────┐
│ General | Service accounts | Cloud Messaging  │
└────────────────────────────────────────────────┘
         ↑
      CLICK HERE
```

---

### Step 4: Generate New Private Key

On the Service accounts page:

1. Look for **"Firebase Admin SDK"** section
2. You'll see:
   - Your service account email
   - A button saying **"Generate new private key"**

```
┌──────────────────────────────────────────────────┐
│ Firebase Admin SDK                                │
│                                                   │
│ Your service account:                             │
│ firebase-adminsdk-xxxxx@storycare-dev.iam...     │
│                                                   │
│ [Generate new private key]  ← CLICK THIS        │
└──────────────────────────────────────────────────┘
```

3. Click **"Generate new private key"**

---

### Step 5: Confirm Download

A dialog appears warning you about security:

```
┌──────────────────────────────────────────┐
│ Generate new private key?                │
│                                          │
│ ⚠️  This key allows full access to your  │
│    Firebase project. Keep it secure!    │
│                                          │
│    [Cancel]    [Generate key]           │
└──────────────────────────────────────────┘
                       ↑
                   CLICK HERE
```

Click **"Generate key"**

A JSON file will download: `storycare-dev-firebase-adminsdk-xxxxx-1234567890.json`

---

### Step 6: Open the Downloaded JSON File

Open the JSON file in any text editor:

```bash
# On Mac/Linux
cat ~/Downloads/storycare-dev-firebase-adminsdk-*.json

# On Windows
notepad %USERPROFILE%\Downloads\storycare-dev-firebase-adminsdk-*.json
```

---

### Step 7: Extract the Values

The JSON file looks like this:

```json
{
  "type": "service_account",
  "project_id": "storycare-dev",              ← FIREBASE_PROJECT_ID
  "private_key_id": "abc123def456...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
                                              ↑ FIREBASE_PRIVATE_KEY
  "client_email": "firebase-adminsdk-xxxxx@storycare-dev.iam.gserviceaccount.com",
                                              ↑ FIREBASE_CLIENT_EMAIL
  "client_id": "1234567890",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/...",
  "universe_domain": "googleapis.com"
}
```

---

## Extracting Each Value

### 1. FIREBASE_PROJECT_ID

**Find**: Look for `"project_id"` in the JSON

```json
"project_id": "storycare-dev"
```

**Copy this value**: `storycare-dev`

---

### 2. FIREBASE_CLIENT_EMAIL

**Find**: Look for `"client_email"` in the JSON

```json
"client_email": "firebase-adminsdk-xxxxx@storycare-dev.iam.gserviceaccount.com"
```

**Copy the entire email address**: `firebase-adminsdk-xxxxx@storycare-dev.iam.gserviceaccount.com`

---

### 3. FIREBASE_PRIVATE_KEY

**Find**: Look for `"private_key"` in the JSON

```json
"private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

**⚠️ IMPORTANT**:
- Copy the **entire string** including quotes
- Keep the `\n` characters (they represent newlines)
- DO NOT format it into actual newlines

**Good** (keep as single line with \n):
```
"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC...\n-----END PRIVATE KEY-----\n"
```

**Bad** (don't split into multiple lines):
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASC...
-----END PRIVATE KEY-----
```

---

## Step 8: Add to .env.local

Open or create `.env.local` in your project root:

```bash
# In your project directory
touch .env.local
nano .env.local
```

Paste the values:

```bash
###############################################################################
# FIREBASE ADMIN SDK (Server-side)
###############################################################################

# From JSON: "project_id"
FIREBASE_PROJECT_ID=storycare-dev

# From JSON: "client_email"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@storycare-dev.iam.gserviceaccount.com

# From JSON: "private_key" (keep in quotes with \n)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC8xPz...[VERY LONG STRING]...8qg==\n-----END PRIVATE KEY-----\n"
```

---

## Visual Summary

```
Firebase Console
    ↓
⚙️ Project Settings
    ↓
"Service accounts" tab
    ↓
"Generate new private key" button
    ↓
Download JSON file
    ↓
Extract 3 values:
  1. project_id → FIREBASE_PROJECT_ID
  2. client_email → FIREBASE_CLIENT_EMAIL
  3. private_key → FIREBASE_PRIVATE_KEY
    ↓
Add to .env.local
```

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Formatting the Private Key

**Wrong**:
```bash
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASC...
-----END PRIVATE KEY-----"
```

**Correct**:
```bash
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC...\n-----END PRIVATE KEY-----\n"
```

---

### ❌ Mistake 2: Missing Quotes

**Wrong**:
```bash
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
```

**Correct**:
```bash
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

---

### ❌ Mistake 3: Extra Spaces

**Wrong**:
```bash
FIREBASE_PROJECT_ID = storycare-dev
FIREBASE_CLIENT_EMAIL = firebase-adminsdk...
```

**Correct**:
```bash
FIREBASE_PROJECT_ID=storycare-dev
FIREBASE_CLIENT_EMAIL=firebase-adminsdk...
```

---

### ❌ Mistake 4: Committing to Git

**Never do this**:
```bash
git add .env.local
git commit -m "Add env vars"  # ❌ NEVER!
```

**Correct**:
- The `.env.local` file should be in `.gitignore`
- Only commit `.env.example` with placeholder values

---

## Testing Your Configuration

### Test 1: Check Environment Variables Load

```bash
node -e "
require('dotenv').config({ path: '.env.local' });
console.log('PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('PRIVATE_KEY starts with:', process.env.FIREBASE_PRIVATE_KEY?.substring(0, 30));
"
```

**Expected output**:
```
PROJECT_ID: storycare-dev
CLIENT_EMAIL: firebase-adminsdk-xxxxx@storycare-dev.iam.gserviceaccount.com
PRIVATE_KEY starts with: -----BEGIN PRIVATE KEY-----\n
```

---

### Test 2: Start Dev Server

```bash
npm run dev:simple
```

Should start without "Invalid credentials" errors.

---

### Test 3: Test Firebase Admin SDK

Create `src/app/api/test-firebase/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { adminAuth } from '@/libs/FirebaseAdmin';

export async function GET() {
  try {
    // Try to list users (requires valid credentials)
    const listUsersResult = await adminAuth.listUsers(1);

    return NextResponse.json({
      success: true,
      message: 'Firebase Admin SDK is working!',
      usersCount: listUsersResult.users.length,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
```

Test:
```bash
curl http://localhost:3000/api/test-firebase
```

---

## Security Reminders

🔒 **NEVER**:
- Commit the JSON file to Git
- Share the JSON file publicly
- Put credentials in client-side code
- Use the same key for dev and production (optional but recommended)

✅ **ALWAYS**:
- Store JSON file securely (password manager)
- Use environment variables
- Add `.env.local` to `.gitignore`
- Rotate keys periodically
- Use separate service accounts for dev/prod

---

## Troubleshooting

### Issue: "Invalid credentials"

**Check**:
1. Private key has quotes around it
2. Private key includes `\n` characters
3. No extra spaces in `.env.local`
4. Correct email format

**Fix**:
```bash
# Re-download JSON from Firebase Console
# Re-extract values carefully
# Verify with test command above
```

---

### Issue: "ENOENT: no such file or directory"

**Cause**: Looking for JSON file instead of using environment variables

**Fix**: Ensure your `FirebaseAdmin.ts` uses environment variables:
```typescript
credentials: {
  client_email: Env.FIREBASE_CLIENT_EMAIL,
  private_key: Env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
}
```

---

### Issue: Dev server still exits

**Check**:
1. `.env.local` exists in project root
2. All three variables are set
3. No syntax errors in `.env.local`
4. Restart dev server after changes

```bash
# Verify file exists
ls -la .env.local

# Check contents (be careful not to share output!)
cat .env.local | grep FIREBASE

# Restart server
npm run dev:simple
```

---

## Complete .env.local Example

Here's what your complete `.env.local` should look like:

```bash
###############################################################################
# FIREBASE CLIENT (Public - from Firebase Console → Project settings)
###############################################################################

NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=storycare-dev.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=storycare-dev
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=storycare-dev.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890

###############################################################################
# FIREBASE ADMIN (Private - from downloaded JSON file)
###############################################################################

FIREBASE_PROJECT_ID=storycare-dev
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@storycare-dev.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC8xPz...[VERY_LONG_STRING]...8qg==\n-----END PRIVATE KEY-----\n"

###############################################################################
# DATABASE
###############################################################################

DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres

###############################################################################
# NEXT.JS
###############################################################################

NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Quick Reference Card

| Variable | Found In | Example |
|----------|----------|---------|
| `FIREBASE_PROJECT_ID` | JSON: `project_id` | `storycare-dev` |
| `FIREBASE_CLIENT_EMAIL` | JSON: `client_email` | `firebase-adminsdk-xxxxx@...` |
| `FIREBASE_PRIVATE_KEY` | JSON: `private_key` | `"-----BEGIN...-----\n"` |

**Format**: All in `.env.local`, no spaces around `=`

---

## Done! ✅

You should now have:
- ✅ Firebase Admin SDK credentials extracted
- ✅ Values added to `.env.local`
- ✅ Correct formatting (quotes, `\n` preserved)
- ✅ Dev server starting without errors

**Next step**: Follow [GETTING_STARTED.md](./GETTING_STARTED.md) to continue setup.

---

**Last Updated**: 2025-10-30
**Time Required**: 5-10 minutes
