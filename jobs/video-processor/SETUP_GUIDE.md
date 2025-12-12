# Video Processor Cloud Run Job - Setup Guide

This guide explains how to configure GitHub Actions secrets for the video processor Cloud Run job.

## Overview

The video processor job requires Google Cloud Storage (GCS) credentials to:
- Download video clips and media from GCS
- Upload assembled videos back to GCS
- Generate and store video thumbnails

## Required GitHub Secrets

### For Development Environment

Go to your repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add the following secrets:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `GCS_PROJECT_ID_DEV` | Google Cloud Project ID | `storycare-dev-479511` |
| `GCS_CLIENT_EMAIL_DEV` | Service Account Email | `video-processor@storycare-dev-479511.iam.gserviceaccount.com` |
| `GCS_PRIVATE_KEY_DEV` | Service Account Private Key (full JSON key) | `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n` |
| `GCS_BUCKET_NAME_DEV` | GCS Bucket Name | `storycare-dev-media-192837` |

### For Production Environment

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `GCS_PROJECT_ID_PROD` | Google Cloud Project ID | `storycare-478114` |
| `GCS_CLIENT_EMAIL_PROD` | Service Account Email | `video-processor@storycare-478114.iam.gserviceaccount.com` |
| `GCS_PRIVATE_KEY_PROD` | Service Account Private Key (full JSON key) | `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n` |
| `GCS_BUCKET_NAME_PROD` | GCS Bucket Name | `storycare-prod-media` |

> **Note:** The private key is automatically stored in Google Secret Manager during deployment for secure handling of multiline values and special characters.

## How to Get These Values

### 1. GCS_PROJECT_ID

This is your Google Cloud project ID. You can find it:
- In the Google Cloud Console header
- Or run: `gcloud config get-value project`

### 2. GCS_CLIENT_EMAIL & GCS_PRIVATE_KEY

You need a service account with appropriate permissions:

#### Create Service Account (if not exists):

```bash
# Development
gcloud iam service-accounts create video-processor-dev \
  --display-name="Video Processor Service Account (Dev)" \
  --project=storycare-dev-479511

# Production
gcloud iam service-accounts create video-processor-prod \
  --display-name="Video Processor Service Account (Prod)" \
  --project=storycare-478114
```

#### Grant Permissions:

```bash
# Development
gcloud projects add-iam-policy-binding storycare-dev-479511 \
  --member="serviceAccount:video-processor-dev@storycare-dev-479511.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

# Production
gcloud projects add-iam-policy-binding storycare-478114 \
  --member="serviceAccount:video-processor-prod@storycare-478114.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

#### Create and Download Keys:

```bash
# Development
gcloud iam service-accounts keys create video-processor-dev-key.json \
  --iam-account=video-processor-dev@storycare-dev-479511.iam.gserviceaccount.com

# Production
gcloud iam service-accounts keys create video-processor-prod-key.json \
  --iam-account=video-processor-prod@storycare-478114.iam.gserviceaccount.com
```

The downloaded JSON file contains:
- `client_email` → Use for `GCS_CLIENT_EMAIL_DEV/PROD`
- `private_key` → Use for `GCS_PRIVATE_KEY_DEV/PROD` (keep the newlines as `\n`)

### 3. GCS_BUCKET_NAME

The name of your GCS bucket where videos are stored. You can find it:
- In the Google Cloud Console → Cloud Storage → Buckets
- Or list buckets: `gcloud storage buckets list`

## How the Secrets Are Used

When you deploy via GitHub Actions:

1. **GitHub Secrets** are read from the repository
2. **Secret Manager** receives the `GCS_PRIVATE_KEY` (automatically created/updated during deployment)
3. **Cloud Run Job** is configured with:
   - Environment variables: `GCS_PROJECT_ID`, `GCS_CLIENT_EMAIL`, `GCS_BUCKET_NAME`
   - Secret Manager references: `GCS_PRIVATE_KEY` (from Secret Manager)
   - This approach handles multiline private keys correctly

## Verifying Configuration

After adding the secrets, the next deployment will automatically:
1. Store the private key in Google Secret Manager
2. Build the Docker image
3. Deploy the Cloud Run job with the GCS environment variables and secret references
4. The job will have access to these credentials at runtime

### Test the Configuration

You can manually trigger the workflow:
1. Go to **Actions** tab in your repository
2. Select the workflow (e.g., "Deploy Video Processor to Cloud Run (Development)")
3. Click **Run workflow**
4. Monitor the logs to ensure deployment succeeds

### Verify Environment Variables in Cloud Run

After deployment, check the job configuration:

```bash
# Development
gcloud run jobs describe storycare-video-processor-dev \
  --region us-central1 \
  --project storycare-dev-479511 \
  --format="value(template.template.containers[0].env)"

# Production
gcloud run jobs describe storycare-video-processor-prod \
  --region us-central1 \
  --project storycare-478114 \
  --format="value(template.template.containers[0].env)"
```

You should see:
- `GCS_PROJECT_ID` (env var)
- `GCS_CLIENT_EMAIL` (env var)
- `GCS_PRIVATE_KEY` (from Secret Manager)
- `GCS_BUCKET_NAME` (env var)
- `NODE_ENV` (env var)
- `DATABASE_URL` (from Secret Manager)

## Important Notes

### Security Best Practices

1. **Never commit service account keys** to the repository
2. **Rotate keys regularly** (every 90 days recommended)
3. **Use least privilege** - only grant necessary permissions
4. **Monitor usage** - check Cloud Logging for any unusual activity

### DATABASE_URL

⚠️ **DATABASE_URL is NOT needed as a GitHub secret**

The database connection is already configured via:
- Google Secret Manager: `DATABASE_URL_DEV` and `DATABASE_URL_PROD`
- Cloud SQL connection: Automatically connected via `--add-cloudsql-instances`

### Private Key Format

When adding `GCS_PRIVATE_KEY_DEV/PROD` to GitHub Secrets:
- Copy the entire key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Keep the `\n` characters (they represent newlines)
- Example format:
  ```
  -----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n
  ```
- The deployment workflow automatically handles the multiline format by storing it in Secret Manager

### Secret Manager

The `GCS_PRIVATE_KEY` is stored in Google Secret Manager because:
- ✅ Handles multiline values and special characters correctly
- ✅ More secure (keys encrypted at rest, access controlled)
- ✅ Can rotate keys without rebuilding Docker images
- ✅ Consistent with how `DATABASE_URL` is managed

## Troubleshooting

### Error: "Missing required environment variable: GCS_PROJECT_ID"

This means the secret is not properly configured or the workflow is not passing it correctly.

**Solution:**
1. Verify the secret exists in GitHub: Settings → Secrets and variables → Actions
2. Check the secret name matches exactly (case-sensitive)
3. Re-run the deployment workflow

### Error: "Failed to authenticate to GCS"

This usually means the service account credentials are invalid.

**Solution:**
1. Verify the service account exists: `gcloud iam service-accounts list`
2. Check the private key is complete and properly formatted
3. Ensure the service account has `roles/storage.objectAdmin` permission
4. Try creating a new key and updating the secret

### Deployment succeeds but job fails at runtime

**Solution:**
1. Check Cloud Run logs:
   ```bash
   gcloud run jobs executions list --job=storycare-video-processor-dev
   gcloud logging read "resource.type=cloud_run_job" --limit=50
   ```
2. Verify all environment variables are set correctly
3. Check the GCS bucket exists and is accessible

## Support

For additional help:
- Check Cloud Run logs in Google Cloud Console
- Review GitHub Actions workflow logs
- Contact the development team

---

**Last Updated:** 2025-12-12
