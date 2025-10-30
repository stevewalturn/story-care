# Google Cloud Storage (GCS) Setup Guide

Complete guide to setting up Google Cloud Storage for StoryCare file uploads, media storage, and session audio files.

## Table of Contents

1. [Why Google Cloud Storage?](#why-google-cloud-storage)
2. [Prerequisites](#prerequisites)
3. [Create Google Cloud Project](#step-1-create-google-cloud-project)
4. [Enable Cloud Storage API](#step-2-enable-cloud-storage-api)
5. [Create Storage Bucket](#step-3-create-storage-bucket)
6. [Create Service Account](#step-4-create-service-account)
7. [Generate Service Account Key](#step-5-generate-service-account-key)
8. [Configure Environment Variables](#step-6-configure-environment-variables)
9. [Install Dependencies](#step-7-install-dependencies)
10. [Test Your Setup](#step-8-test-your-setup)
11. [CORS Configuration](#step-9-cors-configuration-optional)
12. [Production Configuration](#step-10-production-configuration)
13. [Troubleshooting](#troubleshooting)

---

## Why Google Cloud Storage?

Google Cloud Storage is perfect for StoryCare because:

- **Scalable**: Handles files from KB to TB
- **Fast**: Global CDN with edge caching
- **Secure**: Fine-grained access control with signed URLs
- **Cost-effective**: $0.020/GB/month for standard storage
- **Reliable**: 99.9% availability SLA
- **Integrated**: Works seamlessly with other Google services

### What We'll Store in GCS

- 🎙️ **Session Audio**: Therapy session recordings (MP3, WAV)
- 🖼️ **Generated Images**: DALL-E generated images
- 🎬 **Videos**: Scene videos and animations
- 📸 **User Uploads**: Reference images, patient photos
- 📄 **Documents**: Session notes, transcripts (PDFs)
- 🎨 **Media Assets**: Thumbnails, processed media

---

## Prerequisites

- **Google Account** (free) - [Sign up](https://accounts.google.com/signup)
- **Credit Card** (for verification, won't be charged in free tier)
- **StoryCare Project** running locally

**Cost**: Free tier includes **5GB storage + 1GB network egress/month**

---

## Step 1: Create Google Cloud Project

### 1.1: Go to Google Cloud Console

Open [Google Cloud Console](https://console.cloud.google.com/)

### 1.2: Create New Project

1. Click the **project dropdown** in the top bar (says "Select a project")
2. Click **"New Project"** button (top right)
3. Fill in project details:
   - **Project name**: `storycare-storage` (or `storycare-dev`)
   - **Organization**: Leave as "No organization" (unless you have one)
   - **Location**: Leave as "No organization"
4. Click **"Create"**

⏱️ **Wait**: 30-60 seconds for project creation

### 1.3: Select Your Project

1. Click the **project dropdown** again
2. Select your new project: `storycare-storage`
3. Verify project name appears in top bar

✅ **Checkpoint**: You should see "storycare-storage" in the top bar

---

## Step 2: Enable Cloud Storage API

### 2.1: Open API Library

1. In left sidebar, click **"APIs & Services"** → **"Library"**
2. Or use search bar: Type "Cloud Storage API"

### 2.2: Enable the API

1. Click **"Cloud Storage API"**
2. Click the blue **"Enable"** button
3. Wait for API to enable (10-20 seconds)

✅ **Checkpoint**: You should see "API enabled" with a green checkmark

### 2.3: Enable Cloud Storage JSON API (Recommended)

1. Go back to API Library
2. Search for **"Cloud Storage JSON API"**
3. Click on it → Click **"Enable"**

---

## Step 3: Create Storage Bucket

### 3.1: Navigate to Cloud Storage

1. In left sidebar: **"Cloud Storage"** → **"Buckets"**
2. Or use search bar: "Cloud Storage"

### 3.2: Create Bucket

Click **"Create bucket"** button (blue, top of page)

### 3.3: Bucket Configuration

**Step 1 of 4: Name your bucket**
- **Bucket name**: `storycare-media-dev`
  - Must be globally unique
  - If taken, try: `storycare-media-dev-[your-initials]`
  - Or: `storycare-[random-number]`
- Click **"Continue"**

**Step 2 of 4: Choose where to store your data**
- **Location type**: Select **"Region"** (cheaper, faster for single region)
- **Region**: Choose closest to your users
  - US: `us-east1` (South Carolina) or `us-west1` (Oregon)
  - EU: `europe-west1` (Belgium)
  - Asia: `asia-east1` (Taiwan)
- Click **"Continue"**

**Step 3 of 4: Choose a storage class**
- **Storage class**: Select **"Standard"**
  - Best for frequently accessed data
  - Hot storage for active media
- Click **"Continue"**

**Step 4 of 4: Choose how to control access**
- **Access control**: Select **"Uniform"** (recommended)
  - Simpler permissions management
  - Bucket-level policies only
- **Public access**:
  - ⚠️ **IMPORTANT**: Leave "Enforce public access prevention" **CHECKED**
  - We'll use signed URLs instead of public access
- **Protection tools**:
  - Leave "Soft delete" enabled (recommended)
  - Leave default retention: 7 days
- Click **"Create"**

✅ **Checkpoint**: Your bucket is created! You should see it in the buckets list.

### 3.4: Note Your Bucket Name

Copy your bucket name for later:
```
storycare-media-dev
```

---

## Step 4: Create Service Account

A service account lets your application access GCS programmatically.

### 4.1: Navigate to IAM

1. In left sidebar: **"IAM & Admin"** → **"Service Accounts"**
2. Ensure correct project is selected in top bar

### 4.2: Create Service Account

Click **"Create Service Account"** (blue button at top)

### 4.3: Service Account Details

**Step 1: Service account details**
- **Service account name**: `storycare-storage-admin`
- **Service account ID**: Auto-filled (e.g., `storycare-storage-admin@storycare-storage.iam.gserviceaccount.com`)
- **Description**: `Service account for StoryCare file uploads and media storage`
- Click **"Create and continue"**

**Step 2: Grant this service account access to project**
- **Role**: Click "Select a role" dropdown
- Search for: `Storage Admin`
- Select: **"Cloud Storage" → "Storage Admin"**
  - Gives full control over buckets and objects
- Click **"Continue"**

**Step 3: Grant users access to this service account**
- Leave empty (not needed for app usage)
- Click **"Done"**

✅ **Checkpoint**: Service account created! You should see it in the list.

---

## Step 5: Generate Service Account Key

### 5.1: Open Service Account

1. In Service Accounts list, find `storycare-storage-admin`
2. Click on the **email address** (not the checkbox)

### 5.2: Create Key

1. Click **"Keys"** tab (top of page)
2. Click **"Add Key"** → **"Create new key"**

### 5.3: Download Key

1. **Key type**: Select **"JSON"** (recommended)
2. Click **"Create"**
3. A JSON file downloads automatically: `storycare-storage-xxxxx.json`

⚠️ **SECURITY WARNING**:
- This file contains **sensitive credentials**
- **NEVER** commit it to Git
- **NEVER** share it publicly
- Store it securely (password manager, encrypted drive)

### 5.4: Save the Key File

Move the downloaded JSON file to a secure location:

```bash
# Move to a secure location (NOT in your project directory!)
mkdir -p ~/.gcp-keys
mv ~/Downloads/storycare-storage-*.json ~/.gcp-keys/storycare-storage-key.json

# Set restrictive permissions
chmod 600 ~/.gcp-keys/storycare-storage-key.json
```

✅ **Checkpoint**: JSON key file saved securely

---

## Step 6: Configure Environment Variables

### 6.1: Open the Service Account Key

Open the downloaded JSON file in a text editor:

```bash
cat ~/.gcp-keys/storycare-storage-key.json
```

You'll see something like:
```json
{
  "type": "service_account",
  "project_id": "storycare-storage",
  "private_key_id": "abc123def456...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC...\n-----END PRIVATE KEY-----\n",
  "client_email": "storycare-storage-admin@storycare-storage.iam.gserviceaccount.com",
  "client_id": "1234567890",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### 6.2: Extract Required Values

You need these three values:
1. `project_id`
2. `client_email`
3. `private_key`

### 6.3: Add to .env.local

Open (or create) `.env.local` in your project root:

```bash
# In your project directory
nano .env.local
```

Add these lines:

```bash
###############################################################################
# GOOGLE CLOUD STORAGE
###############################################################################

# Project ID (from JSON: "project_id")
GCS_PROJECT_ID=storycare-storage

# Service account email (from JSON: "client_email")
GCS_CLIENT_EMAIL=storycare-storage-admin@storycare-storage.iam.gserviceaccount.com

# Private key (from JSON: "private_key")
# ⚠️ IMPORTANT: Keep the entire key in quotes, including \n characters
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC...\n-----END PRIVATE KEY-----\n"

# Bucket name (from Step 3)
GCS_BUCKET_NAME=storycare-media-dev
```

⚠️ **CRITICAL**:
- The `GCS_PRIVATE_KEY` must be wrapped in **double quotes**
- Keep the `\n` characters (newlines) **as-is**
- Do NOT try to format it into multiple lines

**Example** (correct):
```bash
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"
```

**Example** (incorrect):
```bash
GCS_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBg...
-----END PRIVATE KEY-----
```

### 6.4: Update .env.example

Update `.env.example` for other developers:

```bash
# Google Cloud Storage
GCS_PROJECT_ID=your_project_id
GCS_CLIENT_EMAIL=your_service_account@your_project.iam.gserviceaccount.com
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
GCS_BUCKET_NAME=your_bucket_name
```

✅ **Checkpoint**: Environment variables configured

---

## Step 7: Install Dependencies

### 7.1: Install Google Cloud Storage SDK

```bash
npm install @google-cloud/storage
```

### 7.2: Update Environment Validation

Edit `src/libs/Env.ts` to add GCS validation:

```typescript
import { createEnv } from '@t3-oss/env-nextjs';
import * as z from 'zod';

export const Env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),

    // Google Cloud Storage
    GCS_PROJECT_ID: z.string().min(1),
    GCS_CLIENT_EMAIL: z.string().email(),
    GCS_PRIVATE_KEY: z.string().min(1),
    GCS_BUCKET_NAME: z.string().min(1),

    // ... other server vars
  },
  client: {
    // ... client vars
  },
  shared: {
    NODE_ENV: z.enum(['test', 'development', 'production']).optional(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,

    // GCS
    GCS_PROJECT_ID: process.env.GCS_PROJECT_ID,
    GCS_CLIENT_EMAIL: process.env.GCS_CLIENT_EMAIL,
    GCS_PRIVATE_KEY: process.env.GCS_PRIVATE_KEY,
    GCS_BUCKET_NAME: process.env.GCS_BUCKET_NAME,

    // ... other vars
    NODE_ENV: process.env.NODE_ENV,
  },
});
```

### 7.3: Create GCS Client Library

Create `src/libs/GCS.ts`:

```typescript
import { Storage } from '@google-cloud/storage';
import { Env } from './Env';

// Initialize Google Cloud Storage client
const storage = new Storage({
  projectId: Env.GCS_PROJECT_ID,
  credentials: {
    client_email: Env.GCS_CLIENT_EMAIL,
    private_key: Env.GCS_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
});

// Get bucket instance
const bucket = storage.bucket(Env.GCS_BUCKET_NAME);

/**
 * Upload a file to Google Cloud Storage
 * @param file - File buffer or stream
 * @param destination - Destination path in bucket (e.g., 'sessions/audio/file.mp3')
 * @param options - Upload options (contentType, metadata, etc.)
 * @returns Public URL of uploaded file
 */
export async function uploadFile(
  file: Buffer | NodeJS.ReadableStream,
  destination: string,
  options?: {
    contentType?: string;
    metadata?: Record<string, string>;
  }
): Promise<string> {
  const blob = bucket.file(destination);

  if (Buffer.isBuffer(file)) {
    await blob.save(file, {
      contentType: options?.contentType,
      metadata: options?.metadata,
    });
  } else {
    // Handle stream
    await new Promise((resolve, reject) => {
      const writeStream = blob.createWriteStream({
        contentType: options?.contentType,
        metadata: options?.metadata,
      });
      file.pipe(writeStream);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
  }

  // Return the public URL (or generate signed URL)
  return `https://storage.googleapis.com/${Env.GCS_BUCKET_NAME}/${destination}`;
}

/**
 * Generate a signed URL for temporary access to a private file
 * @param filePath - Path to file in bucket
 * @param expiresIn - Expiration time in milliseconds (default: 1 hour)
 * @returns Signed URL
 */
export async function generateSignedUrl(
  filePath: string,
  expiresIn: number = 60 * 60 * 1000 // 1 hour
): Promise<string> {
  const [url] = await bucket.file(filePath).getSignedUrl({
    action: 'read',
    expires: Date.now() + expiresIn,
  });
  return url;
}

/**
 * Delete a file from Google Cloud Storage
 * @param filePath - Path to file in bucket
 */
export async function deleteFile(filePath: string): Promise<void> {
  await bucket.file(filePath).delete();
}

/**
 * Check if a file exists in the bucket
 * @param filePath - Path to file in bucket
 * @returns True if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  const [exists] = await bucket.file(filePath).exists();
  return exists;
}

/**
 * Get file metadata
 * @param filePath - Path to file in bucket
 * @returns File metadata
 */
export async function getFileMetadata(filePath: string) {
  const [metadata] = await bucket.file(filePath).getMetadata();
  return metadata;
}

export { storage, bucket };
```

✅ **Checkpoint**: Dependencies installed and GCS client configured

---

## Step 8: Test Your Setup

### 8.1: Create Test API Route

Create `src/app/api/test-gcs/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { uploadFile, generateSignedUrl, deleteFile } from '@/libs/GCS';

export async function POST() {
  try {
    // Test 1: Upload a test file
    const testContent = Buffer.from('Hello from StoryCare! GCS is working.');
    const testFileName = `test/test-${Date.now()}.txt`;

    const url = await uploadFile(testContent, testFileName, {
      contentType: 'text/plain',
      metadata: {
        source: 'gcs-test',
      },
    });

    // Test 2: Generate signed URL
    const signedUrl = await generateSignedUrl(testFileName, 5 * 60 * 1000); // 5 min

    // Test 3: Clean up (delete test file)
    await deleteFile(testFileName);

    return NextResponse.json({
      success: true,
      message: 'GCS is configured correctly!',
      uploadedUrl: url,
      signedUrl: signedUrl.substring(0, 100) + '...', // Truncate for display
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.stack,
      },
      { status: 500 }
    );
  }
}
```

### 8.2: Start Dev Server

```bash
npm run dev:simple
```

### 8.3: Test the Endpoint

```bash
curl -X POST http://localhost:3000/api/test-gcs
```

**Expected output** (success):
```json
{
  "success": true,
  "message": "GCS is configured correctly!",
  "uploadedUrl": "https://storage.googleapis.com/storycare-media-dev/test/test-1234567890.txt",
  "signedUrl": "https://storage.googleapis.com/storycare-media-dev/test/test-1234567890.txt?X-Goog-Algorithm=..."
}
```

**If you get an error**, see [Troubleshooting](#troubleshooting) below.

### 8.4: Verify in GCS Console

1. Go to [Cloud Storage Console](https://console.cloud.google.com/storage)
2. Click on your bucket: `storycare-media-dev`
3. You should see a `test/` folder (briefly, before auto-delete)
4. Or check the logs for successful operations

✅ **Checkpoint**: GCS is working!

---

## Step 9: CORS Configuration (Optional)

If you need to upload files directly from the browser, configure CORS.

### 9.1: Create CORS Configuration File

Create `cors.json` in project root:

```json
[
  {
    "origin": ["http://localhost:3000", "http://localhost:3001"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "responseHeader": ["Content-Type", "Authorization"],
    "maxAgeSeconds": 3600
  }
]
```

### 9.2: Apply CORS Configuration

```bash
# Install gcloud CLI if not already installed
# https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login

# Set project
gcloud config set project storycare-storage

# Apply CORS
gsutil cors set cors.json gs://storycare-media-dev
```

### 9.3: Verify CORS

```bash
gsutil cors get gs://storycare-media-dev
```

---

## Step 10: Production Configuration

### 10.1: Create Production Bucket

1. Go to [Cloud Storage Console](https://console.cloud.google.com/storage)
2. Click **"Create bucket"**
3. Name: `storycare-media-prod`
4. Follow same configuration as dev bucket
5. Consider adding:
   - **Lifecycle rules**: Auto-delete old files
   - **Versioning**: Keep file history
   - **Requester pays**: If serving large files

### 10.2: Update Production CORS

```bash
# Update cors.json with production domains
[
  {
    "origin": ["https://yourdomain.com", "https://www.yourdomain.com"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "responseHeader": ["Content-Type", "Authorization"],
    "maxAgeSeconds": 3600
  }
]

# Apply to production bucket
gsutil cors set cors.json gs://storycare-media-prod
```

### 10.3: Set Environment Variables in Vercel

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add all GCS variables:
   - `GCS_PROJECT_ID`
   - `GCS_CLIENT_EMAIL`
   - `GCS_PRIVATE_KEY` (same key works for prod)
   - `GCS_BUCKET_NAME` = `storycare-media-prod`
3. Set for: **Production**, **Preview**, **Development**

---

## Troubleshooting

### Issue: "Authentication error"

**Error**: `Could not load the default credentials`

**Solution**:
- Check `GCS_PRIVATE_KEY` is in quotes with `\n` preserved
- Verify `GCS_CLIENT_EMAIL` matches JSON file
- Ensure no extra spaces in `.env.local`

```bash
# Test credentials parsing
node -e "
const key = process.env.GCS_PRIVATE_KEY;
console.log('Key starts with:', key?.substring(0, 30));
console.log('Has newlines:', key?.includes('\\n'));
"
```

### Issue: "Bucket does not exist"

**Error**: `The specified bucket does not exist`

**Solution**:
- Verify `GCS_BUCKET_NAME` matches exactly (case-sensitive)
- Check bucket exists in GCS Console
- Ensure correct project is selected

```bash
# List buckets
gsutil ls
```

### Issue: "Permission denied"

**Error**: `Permission 'storage.objects.create' denied`

**Solution**:
- Verify service account has "Storage Admin" role
- Check IAM permissions in GCS Console
- Re-generate service account key if needed

Steps:
1. GCS Console → IAM & Admin → IAM
2. Find your service account
3. Edit → Add "Storage Admin" role

### Issue: "403 Forbidden" when accessing files

**Solution**:
- Use signed URLs for private files
- Check bucket public access settings
- Verify CORS configuration for browser uploads

### Issue: Upload works but can't access file

**Solution**:
- Generate signed URL instead of direct URL
- Check file exists in bucket
- Verify bucket region matches your location

```typescript
// Use signed URL for private files
const signedUrl = await generateSignedUrl('path/to/file.jpg');
```

### Issue: Large files fail to upload

**Solution**:
- Increase timeout in API route
- Use resumable uploads for files > 5MB
- Consider direct browser-to-GCS upload with signed URLs

```typescript
// For large files, use resumable upload
const blob = bucket.file(destination);
const writeStream = blob.createWriteStream({
  resumable: true,
  metadata: { contentType: 'video/mp4' },
});
```

### Issue: Environment variables not loading

**Solution**:
```bash
# Check .env.local exists
ls -la .env.local

# Verify format
cat .env.local | grep GCS

# Restart dev server
npm run dev:simple
```

---

## Common Use Cases

### Upload Session Audio

```typescript
// src/app/api/sessions/upload/route.ts
import { uploadFile } from '@/libs/GCS';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('audio') as File;

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `sessions/audio/${Date.now()}-${file.name}`;

  const url = await uploadFile(buffer, fileName, {
    contentType: file.type,
    metadata: {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
    },
  });

  return Response.json({ url });
}
```

### Generate and Store DALL-E Image

```typescript
import { uploadFile } from '@/libs/GCS';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Generate image
const response = await openai.images.generate({
  model: 'dall-e-3',
  prompt: 'A therapeutic scene...',
});

// Download and upload to GCS
const imageUrl = response.data[0]?.url;
const imageResponse = await fetch(imageUrl!);
const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

const gcsUrl = await uploadFile(
  imageBuffer,
  `media/images/${patientId}/${Date.now()}.png`,
  { contentType: 'image/png' }
);
```

### Generate Temporary Access URL

```typescript
// For patient to view their media
const signedUrl = await generateSignedUrl(
  `media/videos/${videoId}.mp4`,
  24 * 60 * 60 * 1000 // 24 hours
);

// Send to patient
return Response.json({ videoUrl: signedUrl });
```

---

## Cost Optimization

### Free Tier (Monthly)
- **Storage**: 5 GB
- **Network Egress**: 1 GB to Americas/Europe
- **Operations**: 5,000 Class A, 50,000 Class B

### Pricing After Free Tier
- **Storage**: $0.020/GB/month (standard)
- **Network egress**: $0.12/GB (to worldwide)
- **Operations**: $0.05 per 10,000 Class A ops

### Cost Estimates

**1,000 Users**:
- 100 GB storage: $2/month
- 10 GB egress: $1.20/month
- **Total: ~$3-5/month**

**10,000 Users**:
- 1 TB storage: $20/month
- 100 GB egress: $12/month
- **Total: ~$30-40/month**

### Tips to Reduce Costs
1. **Lifecycle rules**: Delete old files automatically
2. **Compression**: Compress audio/video before upload
3. **CDN caching**: Use Cloud CDN for frequently accessed files
4. **Nearline/Coldline**: Move old files to cheaper storage classes

---

## Security Best Practices

- ✅ Use **signed URLs** instead of public access
- ✅ Set URL expiration times (1-24 hours)
- ✅ Never commit service account JSON to Git
- ✅ Use separate buckets for dev/staging/production
- ✅ Enable **soft delete** for accidental deletion recovery
- ✅ Set up **bucket-level IAM** instead of ACLs
- ✅ Rotate service account keys periodically
- ✅ Enable **audit logs** for compliance
- ✅ Use **VPC Service Controls** for enterprise security

---

## Next Steps

1. ✅ GCS is now set up!
2. Create upload UI in your app
3. Add file validation (size, type)
4. Implement progress tracking for large files
5. Set up lifecycle rules for old files
6. Configure Cloud CDN for better performance

---

## Resources

- [GCS Documentation](https://cloud.google.com/storage/docs)
- [Node.js Client Library](https://googleapis.dev/nodejs/storage/latest/)
- [Signed URLs Guide](https://cloud.google.com/storage/docs/access-control/signed-urls)
- [Best Practices](https://cloud.google.com/storage/docs/best-practices)
- [Pricing Calculator](https://cloud.google.com/products/calculator)

---

**Setup Complete!** 🎉

You can now upload and manage files in Google Cloud Storage from your StoryCare application.

**Time spent**: ~20 minutes
**Last Updated**: 2025-10-30
