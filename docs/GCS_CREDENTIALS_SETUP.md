# Google Cloud Storage Service Account Setup

This guide walks you through creating service account credentials for your existing `storycare-dev-media` bucket.

## Prerequisites

You already have:
- ✅ GCS bucket: `storycare-dev-media`
- ✅ Location: `us-central1` (Iowa)
- ✅ Storage class: Standard
- ✅ Public access: Not public (good for HIPAA compliance)

## Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one if needed)
3. Make sure billing is enabled for your project

## Step 2: Enable Cloud Storage API

1. Go to **APIs & Services > Library**
2. Search for "Cloud Storage API"
3. Click on **Cloud Storage API**
4. Click **Enable** (if not already enabled)

## Step 3: Create a Service Account

1. Go to **IAM & Admin > Service Accounts**
2. Click **+ CREATE SERVICE ACCOUNT**
3. Fill in the details:
   - **Service account name**: `storycare-storage`
   - **Service account ID**: `storycare-storage` (auto-generated)
   - **Description**: `Service account for StoryCare media storage`
4. Click **CREATE AND CONTINUE**

## Step 4: Grant Permissions

In the "Grant this service account access to project" section:

1. Click **Select a role** dropdown
2. Choose **Cloud Storage > Storage Object Admin**
   - This gives full control over objects but not buckets themselves
3. Click **+ ADD ANOTHER ROLE**
4. Add **Cloud Storage > Storage Legacy Bucket Reader**
   - This allows listing bucket contents
5. Click **CONTINUE**
6. Skip the optional "Grant users access" section
7. Click **DONE**

## Step 5: Get Service Account Credentials

### Option A: Create New Key (If Allowed)

1. In the **Service Accounts** list, find your newly created `storycare-storage` account
2. Click on the **three dots** (⋮) in the Actions column
3. Select **Manage keys**
4. Click **ADD KEY > Create new key**
5. Select **JSON** format
6. Click **CREATE**
7. The JSON file will download automatically
8. **Save this file securely** - you cannot download it again

### Option B: Use Existing Service Account (If Key Creation Restricted)

If you can't create new keys due to organization policies:

1. Check if there are existing service accounts:
   - Go to **IAM & Admin > Service Accounts**
   - Look for existing accounts with storage permissions
   - Common names: `firebase-adminsdk-*`, `compute@developer.gserviceaccount.com`, etc.

2. Ask your organization admin for:
   - An existing service account JSON key file
   - Permission to create service account keys
   - Alternative authentication method

### Option C: Use Application Default Credentials (Local Development)

For local development only:

1. Install Google Cloud SDK: `gcloud init`
2. Authenticate: `gcloud auth application-default login`
3. This creates local credentials that your app can use
4. **Note**: This won't work in production (Vercel), only for local development

### Option D: Use Workload Identity (Advanced)

For production deployments without service account keys:

1. Set up Workload Identity Federation
2. This allows your Vercel deployment to authenticate without storing keys
3. More complex setup but more secure

### Quick Check: What Options Do You Have?

Run these commands to see what's available:

```bash
# Check if you can use gcloud authentication
gcloud auth list

# Check existing service accounts
gcloud iam service-accounts list

# Try to create a key (to see the exact error)
gcloud iam service-accounts keys create ~/key.json --iam-account=SERVICE_ACCOUNT_EMAIL
```

## Step 6: Configure Bucket Permissions (If Needed)

1. Go to **Cloud Storage > Buckets**
2. Click on your `storycare-dev-media` bucket
3. Go to the **Permissions** tab
4. Click **+ GRANT ACCESS**
5. Add your service account:
   - **New principals**: `storycare-storage@[YOUR-PROJECT-ID].iam.gserviceaccount.com`
   - **Role**: **Storage Object Admin**
6. Click **SAVE**

## Step 7: Extract Environment Variables

From your downloaded JSON file, extract these values:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "storycare-storage@your-project-id.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

## Step 8: Set Environment Variables

### For Local Development (.env.local)

```bash
# Google Cloud Storage Configuration
GCS_PROJECT_ID=your-project-id
GCS_CLIENT_EMAIL=storycare-storage@your-project-id.iam.gserviceaccount.com
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GCS_BUCKET_NAME=storycare-dev-media

# Optional: Full service account JSON (alternative approach)
GCS_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```

### For Production (Vercel Environment Variables)

1. Go to your Vercel project dashboard
2. Navigate to **Settings > Environment Variables**
3. Add each variable:

| Name | Value |
|------|-------|
| `GCS_PROJECT_ID` | your-project-id |
| `GCS_CLIENT_EMAIL` | storycare-storage@your-project-id.iam.gserviceaccount.com |
| `GCS_PRIVATE_KEY` | -----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n |
| `GCS_BUCKET_NAME` | storycare-dev-media |

**Important**: For `GCS_PRIVATE_KEY`, paste the entire private key including the newlines and header/footer.

## Step 9: Update Your Code Configuration

Your `src/libs/GCS.ts` should look like this:

```typescript
import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  credentials: {
    client_email: process.env.GCS_CLIENT_EMAIL,
    private_key: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

export const bucket = storage.bucket(process.env.GCS_BUCKET_NAME!);

// Example upload function
export async function uploadFile(file: Buffer, fileName: string) {
  const blob = bucket.file(fileName);
  const stream = blob.createWriteStream({
    metadata: {
      contentType: 'auto', // or specify specific type
    },
  });

  return new Promise((resolve, reject) => {
    stream.on('error', reject);
    stream.on('finish', () => {
      resolve(`gs://${bucket.name}/${fileName}`);
    });
    stream.end(file);
  });
}
```

## Step 10: Test Your Configuration

Create a simple test to verify everything works:

```typescript
// Test file upload
import { bucket } from '@/libs/GCS';

export async function testGCSConnection() {
  try {
    // Test bucket access
    const [exists] = await bucket.exists();
    console.log('Bucket exists:', exists);

    // Test file upload
    const testFile = Buffer.from('Hello, StoryCare!');
    const file = bucket.file('test.txt');
    await file.save(testFile);
    console.log('Test file uploaded successfully');

    // Clean up test file
    await file.delete();
    console.log('Test file deleted');

    return true;
  } catch (error) {
    console.error('GCS test failed:', error);
    return false;
  }
}
```

## Security Best Practices

1. **Never commit the service account JSON** to your repository
2. **Use environment variables** for all credentials
3. **Rotate keys regularly** (every 90 days recommended)
4. **Use least-privilege access** - only grant necessary permissions
5. **Monitor usage** in the GCS console
6. **Enable audit logging** for HIPAA compliance

## HIPAA Compliance Notes

For healthcare data:
1. **Sign a BAA with Google Cloud** (Business Associate Agreement)
2. **Enable audit logging** for all storage operations
3. **Use encryption at rest** (enabled by default)
4. **Use encryption in transit** (HTTPS only)
5. **Implement proper access controls**
6. **Set up data retention policies**

## Troubleshooting

### Common Issues

1. **"Access denied" errors**:
   - Check service account has correct roles
   - Verify bucket permissions
   - Ensure project billing is enabled

2. **"Invalid private key" errors**:
   - Check newline characters in private key
   - Ensure proper escaping in environment variables

3. **"Bucket not found" errors**:
   - Verify bucket name spelling
   - Check project ID is correct
   - Ensure bucket exists in the specified project

### Testing Commands

```bash
# Test bucket access using gcloud CLI
gcloud auth activate-service-account --key-file=path/to/service-account.json
gsutil ls gs://storycare-dev-media
```

## Next Steps

1. ✅ Test the connection locally
2. ✅ Deploy to Vercel with environment variables
3. ✅ Implement file upload in your app
4. ✅ Set up monitoring and alerts
5. ✅ Sign BAA with Google for HIPAA compliance
6. ✅ Configure lifecycle policies for cost optimization

## Additional Resources

- [Google Cloud Storage Client Libraries](https://cloud.google.com/storage/docs/reference/libraries)
- [Service Account Best Practices](https://cloud.google.com/iam/docs/best-practices-for-using-and-managing-service-accounts)
- [Google Cloud HIPAA Compliance](https://cloud.google.com/security/compliance/hipaa)