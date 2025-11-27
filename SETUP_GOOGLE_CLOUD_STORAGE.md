# Google Cloud Storage (GCS) Setup Guide

This guide walks you through setting up Google Cloud Storage for the StoryCare application to store media files (audio recordings, images, videos, etc.).

## Prerequisites

- Google Cloud Project created (you already have: `storycare-478114`)
- Billing enabled on your project
- `gcloud` CLI installed (optional but recommended)

## Step 1: Enable Cloud Storage API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `storycare-478114`
3. Navigate to **APIs & Services** → **Library**
4. Search for "Cloud Storage API"
5. Click **Enable**

## Step 2: Create a Storage Bucket

### Via Google Cloud Console (Recommended for beginners)

1. Go to [Cloud Storage](https://console.cloud.google.com/storage/browser)
2. Click **Create Bucket**
3. Configure your bucket:

   **Bucket Details:**
   - **Name**: `storycare-dev-media` (must be globally unique)
     - Use lowercase, numbers, hyphens only
     - Example: `storycare-dev-media-20251127`
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
gcloud config set project storycare-478114

# Create bucket
gsutil mb -p storycare-478114 -c STANDARD -l us-central1 -b on gs://storycare-dev-media/

# Enable uniform bucket-level access
gsutil uniformbucketlevelaccess set on gs://storycare-dev-media/

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

gsutil lifecycle set lifecycle.json gs://storycare-dev-media/
```

## Step 3: Create a Service Account

Service accounts allow your application to authenticate with GCS.

### Via Google Cloud Console

1. Go to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Fill in details:
   - **Name**: `storycare-storage-admin`
   - **Description**: "Service account for StoryCare media storage"
4. Click **Create and Continue**
5. Grant roles:
   - **Storage Admin** (`roles/storage.admin`) - for full bucket access
   - Or **Storage Object Admin** (`roles/storage.objectAdmin`) - for object-level access only
6. Click **Continue** → **Done**

### Via gcloud CLI

```bash
# Create service account
gcloud iam service-accounts create storycare-storage-admin \
  --display-name="StoryCare Storage Admin" \
  --description="Service account for StoryCare media storage"

# Grant Storage Admin role
gcloud projects add-iam-policy-binding storycare-478114 \
  --member="serviceAccount:storycare-storage-admin@storycare-478114.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Or grant bucket-specific access (more secure)
gsutil iam ch serviceAccount:storycare-storage-admin@storycare-478114.iam.gserviceaccount.com:roles/storage.objectAdmin gs://storycare-dev-media
```

## Step 4: Generate Service Account Key

### Via Google Cloud Console

1. Go to **IAM & Admin** → **Service Accounts**
2. Find `storycare-storage-admin@storycare-478114.iam.gserviceaccount.com`
3. Click the three dots (⋮) → **Manage Keys**
4. Click **Add Key** → **Create new key**
5. Select **JSON** format
6. Click **Create** - the key file will download automatically
7. **Important**: Store this file securely! It grants access to your bucket.

### Via gcloud CLI

```bash
# Create and download key
gcloud iam service-accounts keys create ~/storycare-gcs-key.json \
  --iam-account=storycare-storage-admin@storycare-478114.iam.gserviceaccount.com

# View the key (copy the output)
cat ~/storycare-gcs-key.json
```

## Step 5: Configure Environment Variables

The service account JSON file contains these fields:

```json
{
  "type": "service_account",
  "project_id": "storycare-478114",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "storycare-storage-admin@storycare-478114.iam.gserviceaccount.com",
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
GCS_PROJECT_ID=storycare-478114
GCS_CLIENT_EMAIL=storycare-storage-admin@storycare-478114.iam.gserviceaccount.com
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
GCS_BUCKET_NAME=storycare-dev-media
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

1. Create a `cors.json` file:

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

2. Apply CORS configuration:

```bash
gsutil cors set cors.json gs://storycare-dev-media/
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
storycare-dev-media/
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
gsutil du -sh gs://storycare-dev-media/

# List recent files
gsutil ls -lh gs://storycare-dev-media/ | head -20
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
gcloud projects get-iam-policy storycare-478114 \
  --flatten="bindings[].members" \
  --filter="bindings.members:storycare-storage-admin@storycare-478114.iam.gserviceaccount.com"
```

### Error: "The caller does not have permission"

**Solution**: Grant the service account access to the bucket:

```bash
gsutil iam ch serviceAccount:storycare-storage-admin@storycare-478114.iam.gserviceaccount.com:roles/storage.objectAdmin \
  gs://storycare-dev-media
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
**Environment**: Development (storycare-478114)
