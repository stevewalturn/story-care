# Google Cloud Storage (GCS) Setup Guide

This guide walks you through setting up Google Cloud Storage for the StoryCare application to store media files (audio recordings, images, videos, etc.).

## Prerequisites

- Google Cloud Project created (you already have: `storycare-479511`)
- Billing enabled on your project
- `gcloud` CLI installed (optional but recommended)

## Step 0: Set Your Project

Before proceeding, ensure you're working with the correct Google Cloud project.

### Via Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. At the top of the page, click the **project dropdown** (next to "Google Cloud")
3. Select your project: `storycare-479511`
4. Verify the project name appears in the top bar

### Via gcloud CLI

```bash
# Set the active project
gcloud config set project storycare-479511

# Verify the project is set correctly
gcloud config get-value project

# Expected output: storycare-479511
```

**Important**: All subsequent commands will use this project. If you see permission errors, verify you're in the correct project.

## Step 1: Enable Cloud Storage API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **Verify your project is selected**: Check the top bar shows `storycare-479511`
3. Navigate to **APIs & Services** → **Library**
4. Search for "Cloud Storage API"
5. Click **Enable**

### Via gcloud CLI

```bash
# Ensure project is set
gcloud config set project storycare-479511

# Enable Cloud Storage API
gcloud services enable storage-api.googleapis.com
gcloud services enable storage-component.googleapis.com

# Verify API is enabled
gcloud services list --enabled | grep storage
```

## Step 2: Create a Storage Bucket

### Via Google Cloud Console (Recommended for beginners)

1. Go to [Cloud Storage](https://console.cloud.google.com/storage/browser)
2. **Verify project**: Confirm `storycare-479511` is shown in the top bar
3. Click **Create Bucket**
4. Configure your bucket:

   **Bucket Details:**
   - **Name**: `storycare-dev-media-192837` (must be globally unique)
     - Use lowercase, numbers, hyphens only
     - Example: `storycare-dev-media-192837-20251127`
   - **Location Type**:
     - Choose **Region** for lower latency
     - Select **us-central1** (same as your Cloud SQL)

   **Storage Class:**
   - Choose **Standard** for frequently accessed data
   - Or **Nearline** for backups and archives

   **Access Control:**
   - Choose **Uniform** (recommended)
   - Uncheck "Enforce public access prevention" if you need public URLs

   **Protection:**
   - Enable **Object versioning** (recommended for recovery)
   - Optional: Set retention policy

   **Encryption:**
   - Use **Google-managed key** (default, HIPAA-compliant)
   - Or use **Customer-managed key** for extra security

4. Click **Create**

### Via gcloud CLI (Alternative)

```bash
# Set your project
gcloud config set project storycare-479511

# Create bucket
gsutil mb -p storycare-479511 -c STANDARD -l us-central1 -b on gs://storycare-dev-media-192837/

# Enable uniform bucket-level access
gsutil uniformbucketlevelaccess set on gs://storycare-dev-media-192837-192837/

# Set lifecycle (optional - auto-delete temp files after 30 days)
cat > lifecycle.json <<EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {
          "age": 30,
          "matchesPrefix": ["temp/"]
        }
      }
    ]
  }
}
EOF

gsutil lifecycle set lifecycle.json gs://storycare-dev-media-192837/
```

## Step 3: Create a Service Account

Service accounts allow your application to authenticate with GCS.

### Via Google Cloud Console

1. **Verify project**: Ensure `storycare-479511` is selected in the top bar
2. Go to **IAM & Admin** → **Service Accounts**
3. Click **Create Service Account**
4. Fill in details:
   - **Name**: `storycare-storage-admin`
   - **Description**: "Service account for StoryCare media storage"
5. Click **Create and Continue**
6. Grant roles:
   - **Storage Admin** (`roles/storage.admin`) - for full bucket access
   - Or **Storage Object Admin** (`roles/storage.objectAdmin`) - for object-level access only
7. Click **Continue** → **Done**

### Via gcloud CLI

```bash
# Ensure project is set
gcloud config set project storycare-479511

# Create service account
gcloud iam service-accounts create storycare-storage-admin \
  --display-name="StoryCare Storage Admin" \
  --description="Service account for StoryCare media storage" \
  --project=storycare-479511

# Grant Storage Admin role
gcloud projects add-iam-policy-binding storycare-479511 \
  --member="serviceAccount:storycare-storage-admin@storycare-479511.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Or grant bucket-specific access (more secure)
gsutil iam ch serviceAccount:storycare-storage-admin@storycare-479511.iam.gserviceaccount.com:roles/storage.objectAdmin gs://storycare-dev-media-192837
```

## Step 4: Generate Service Account Key

### Via Google Cloud Console

1. **Verify project**: Ensure `storycare-479511` is selected in the top bar
2. Go to **IAM & Admin** → **Service Accounts**
3. Find `storycare-storage-admin@storycare-479511.iam.gserviceaccount.com`
4. Click the three dots (⋮) → **Manage Keys**
5. Click **Add Key** → **Create new key**
6. Select **JSON** format
7. Click **Create** - the key file will download automatically
8. **Important**: Store this file securely! It grants access to your bucket.

### Via gcloud CLI

```bash
# Ensure project is set
gcloud config set project storycare-479511

# Create and download key
gcloud iam service-accounts keys create ~/storycare-gcs-key.json \
  --iam-account=storycare-storage-admin@storycare-479511.iam.gserviceaccount.com \
  --project=storycare-479511

# View the key (copy the output)
cat ~/storycare-gcs-key.json
```

## Step 5: Configure Environment Variables

The service account JSON file contains these fields:

```json
{
  "type": "service_account",
  "project_id": "storycare-479511",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "storycare-storage-admin@storycare-479511.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

### Update `.env.local`

Add these variables to your `.env.local` file:

```bash
# Google Cloud Storage
GCS_PROJECT_ID=storycare-479511
GCS_CLIENT_EMAIL=storycare-storage-admin@storycare-479511.iam.gserviceaccount.com
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
GCS_BUCKET_NAME=storycare-dev-media-192837
```

**Important Notes:**
- Keep the `\n` characters in the private key
- Wrap the private key in double quotes
- Never commit `.env.local` to Git (already in `.gitignore`)

### For Production (Vercel/Cloud Run)

In your hosting platform's environment variables:
- Set each variable separately
- Use the secret/encrypted storage option
- Don't expose these in client-side code

## Step 6: Set Up CORS (if serving files directly)

If you need to access files from the browser (e.g., video playback):

1. **Ensure project is set**: Run `gcloud config set project storycare-479511`
2. Create a `cors.json` file:

```json
[
  {
    "origin": ["http://localhost:3000", "https://your-production-domain.com"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
    "maxAgeSeconds": 3600
  }
]
```

3. Apply CORS configuration:

```bash
gsutil cors set cors.json gs://storycare-dev-media-192837/
```

## Step 7: Test the Connection

Create a test script to verify your setup:

```typescript
// test-gcs.ts
import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  credentials: {
    client_email: process.env.GCS_CLIENT_EMAIL,
    private_key: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

const bucket = storage.bucket(process.env.GCS_BUCKET_NAME!);

async function testConnection() {
  try {
    // Test: Upload a file
    const fileName = 'test.txt';
    const file = bucket.file(fileName);
    await file.save('Hello from StoryCare!');
    console.log('✓ File uploaded successfully');

    // Test: List files
    const [files] = await bucket.getFiles();
    console.log('✓ Files in bucket:', files.length);

    // Test: Generate signed URL
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    });
    console.log('✓ Signed URL generated:', url);

    // Test: Delete file
    await file.delete();
    console.log('✓ File deleted successfully');

    console.log('\n✅ All tests passed! GCS is configured correctly.');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testConnection();
```

Run the test:

```bash
npx tsx test-gcs.ts
```

## Step 8: Folder Structure (Best Practices)

Organize your bucket with a clear folder structure:

```
storycare-dev-media-192837/
├── sessions/
│   ├── audio/
│   │   └── {sessionId}.{ext}
│   └── transcripts/
│       └── {sessionId}.json
├── media/
│   ├── images/
│   │   ├── generated/
│   │   │   └── {userId}/{imageId}.png
│   │   └── uploaded/
│   │       └── {userId}/{filename}
│   ├── videos/
│   │   ├── generated/
│   │   │   └── {userId}/{videoId}.mp4
│   │   └── scenes/
│   │       └── {sceneId}.mp4
│   └── audio/
│       └── {userId}/{audioId}.mp3
├── profiles/
│   └── {userId}/
│       └── avatar.jpg
└── temp/
    └── {timestamp}_{randomId}/
        └── {filename}
```

## Security Best Practices

### 1. Use Signed URLs for Private Content

```typescript
// Generate temporary access URL
const [url] = await bucket.file('sessions/audio/123.mp3').getSignedUrl({
  action: 'read',
  expires: Date.now() + 60 * 60 * 1000, // 1 hour
});
```

### 2. Set Object-Level Permissions

```typescript
// Make a file public
await bucket.file('public/logo.png').makePublic();

// Make a file private (default)
await bucket.file('sessions/audio/123.mp3').makePrivate();
```

### 3. Enable Audit Logging

1. Go to **IAM & Admin** → **Audit Logs**
2. Find **Cloud Storage API**
3. Enable:
   - Admin Read
   - Data Read
   - Data Write

### 4. HIPAA Compliance Checklist

- [ ] Sign Business Associate Agreement (BAA) with Google Cloud
- [ ] Enable audit logging for all bucket access
- [ ] Use encryption at rest (enabled by default)
- [ ] Use encryption in transit (HTTPS/TLS)
- [ ] Implement access controls (IAM roles)
- [ ] Set up data retention policies
- [ ] Enable object versioning for recovery
- [ ] Monitor access logs with Cloud Logging

## Monitoring & Maintenance

### View Storage Usage

```bash
# Check bucket size
gsutil du -sh gs://storycare-dev-media-192837/

# List recent files
gsutil ls -lh gs://storycare-dev-media-192837/ | head -20
```

### Set Up Alerts (Recommended)

1. Go to **Monitoring** → **Alerting**
2. Create alerts for:
   - Storage quota (> 80% of budget)
   - Egress bandwidth (unexpected spikes)
   - Error rates (4xx/5xx responses)

### Cost Optimization

- Use **Lifecycle Rules** to auto-delete temp files
- Move infrequently accessed data to **Nearline** or **Coldline**
- Enable **Requester Pays** for large public datasets
- Compress files before uploading (images, audio)

## Troubleshooting

### Error: "Could not load the default credentials"

**Solution**: Check that environment variables are set correctly:

```bash
echo $GCS_PROJECT_ID
echo $GCS_CLIENT_EMAIL
echo $GCS_PRIVATE_KEY | head -c 50
```

### Error: "Access Denied"

**Solution**: Verify service account has correct roles:

```bash
gcloud projects get-iam-policy storycare-479511 \
  --flatten="bindings[].members" \
  --filter="bindings.members:storycare-storage-admin@storycare-479511.iam.gserviceaccount.com"
```

### Error: "The caller does not have permission"

**Solution**: Grant the service account access to the bucket:

```bash
gsutil iam ch serviceAccount:storycare-storage-admin@storycare-479511.iam.gserviceaccount.com:roles/storage.objectAdmin \
  gs://storycare-dev-media-192837
```

### Error: "Bucket name already exists"

**Solution**: Choose a different, globally unique bucket name.

## Additional Resources

- [Cloud Storage Documentation](https://cloud.google.com/storage/docs)
- [Node.js Client Library](https://googleapis.dev/nodejs/storage/latest/)
- [Best Practices](https://cloud.google.com/storage/docs/best-practices)
- [HIPAA Compliance](https://cloud.google.com/security/compliance/hipaa)
- [Pricing Calculator](https://cloud.google.com/products/calculator)

## Next Steps

1. ✅ Create bucket
2. ✅ Set up service account
3. ✅ Configure environment variables
4. ✅ Test connection
5. 🔲 Implement file upload API route
6. 🔲 Add file validation and virus scanning
7. 🔲 Set up CDN (Cloud CDN) for faster delivery
8. 🔲 Configure backup and disaster recovery

---

**Created**: 2025-11-27
**Project**: StoryCare Digital Therapeutic Platform
**Environment**: Development (storycare-479511)
