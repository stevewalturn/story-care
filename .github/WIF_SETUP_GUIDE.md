# Workload Identity Federation Setup Guide
## For StoryCare Dev Project (storycare-dev-479511)

This guide will walk you through setting up Workload Identity Federation for GitHub Actions to deploy to Google Cloud Run.

---

## Prerequisites

1. Google Cloud SDK (`gcloud`) installed and authenticated
2. Admin access to the GCP project `storycare-dev-479511`
3. Your GitHub repository: `YOUR_GITHUB_USERNAME/story-care`

---

## Step 1: Get Your Project Number

You'll need both the project ID and project number.

```bash
# Get project number
gcloud projects describe storycare-dev-479511 --format="value(projectNumber)"
```

Save this number - you'll need it later. Example output: `123456789012`

---

## Step 2: Enable Required APIs

```bash
# Enable IAM and Cloud Resource Manager APIs
gcloud services enable iamcredentials.googleapis.com \
  --project=storycare-dev-479511

gcloud services enable cloudresourcemanager.googleapis.com \
  --project=storycare-dev-479511

gcloud services enable sts.googleapis.com \
  --project=storycare-dev-479511

# Enable Cloud Run API (if not already enabled)
gcloud services enable run.googleapis.com \
  --project=storycare-dev-479511
```

---

## Step 3: Create Workload Identity Pool

```bash
gcloud iam workload-identity-pools create "github-dev" \
  --project="storycare-dev-479511" \
  --location="global" \
  --display-name="GitHub Actions Pool (Dev)"
```

**Expected output:**
```
Created workload identity pool [github-dev].
```

---

## Step 4: Create Workload Identity Provider

```bash
gcloud iam workload-identity-pools providers create-oidc "github-dev-provider" \
  --project="storycare-dev-479511" \
  --location="global" \
  --workload-identity-pool="github-dev" \
  --display-name="GitHub Actions Provider (Dev)" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository_owner == 'YOUR_GITHUB_USERNAME'" \
  --issuer-uri="https://token.actions.githubusercontent.com"
```

**⚠️ IMPORTANT:** Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username or organization name.

**Expected output:**
```
Created workload identity pool provider [github-dev-provider].
```

---

## Step 5: Get the Workload Identity Provider Resource Name

```bash
gcloud iam workload-identity-pools providers describe "github-dev-provider" \
  --project="storycare-dev-479511" \
  --location="global" \
  --workload-identity-pool="github-dev" \
  --format="value(name)"
```

**Expected output:**
```
projects/123456789012/locations/global/workloadIdentityPools/github-dev/providers/github-dev-provider
```

**📝 Save this output** - this is your `GCP_WORKLOAD_IDENTITY_PROVIDER_DEV` secret value.

---

## Step 6: Create Service Account

```bash
gcloud iam service-accounts create github-actions-dev \
  --project="storycare-dev-479511" \
  --display-name="GitHub Actions Service Account (Dev)" \
  --description="Service account for GitHub Actions to deploy to Cloud Run (Dev)"
```

**Expected output:**
```
Created service account [github-actions-dev].
```

The service account email will be:
```
github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com
```

**📝 Save this email** - this is your `GCP_SERVICE_ACCOUNT_DEV` secret value.

---

## Step 7: Grant Permissions to Service Account

```bash
# Cloud Run Admin (to deploy services)
gcloud projects add-iam-policy-binding storycare-dev-479511 \
  --member="serviceAccount:github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com" \
  --role="roles/run.admin"

# Storage Admin (for Google Container Registry)
gcloud projects add-iam-policy-binding storycare-dev-479511 \
  --member="serviceAccount:github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Service Account User (to deploy as the default compute service account)
gcloud projects add-iam-policy-binding storycare-dev-479511 \
  --member="serviceAccount:github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Cloud Run Service Agent (for service-to-service authentication)
gcloud projects add-iam-policy-binding storycare-dev-479511 \
  --member="serviceAccount:github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com" \
  --role="roles/run.serviceAgent"
```

---

## Step 8: Allow Workload Identity Pool to Impersonate Service Account

**⚠️ IMPORTANT:** Replace `YOUR_GITHUB_USERNAME` and `PROJECT_NUMBER` below.

```bash
# Replace these values:
# - PROJECT_NUMBER: from Step 1 (e.g., 123456789012)
# - YOUR_GITHUB_USERNAME: your GitHub username or org name

gcloud iam service-accounts add-iam-policy-binding \
  "github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com" \
  --project="storycare-dev-479511" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-dev/attribute.repository/YOUR_GITHUB_USERNAME/story-care"
```

**Example** (if your project number is `123456789012` and GitHub username is `johndoe`):
```bash
gcloud iam service-accounts add-iam-policy-binding \
  "github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com" \
  --project="storycare-dev-479511" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/123456789012/locations/global/workloadIdentityPools/github-dev/attribute.repository/johndoe/story-care"
```

**Expected output:**
```
Updated IAM policy for serviceAccount [github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com].
```

---

## Step 9: Verify Setup

```bash
# List workload identity pools
gcloud iam workload-identity-pools list --location=global --project=storycare-dev-479511

# List providers
gcloud iam workload-identity-pools providers list \
  --workload-identity-pool=github-dev \
  --location=global \
  --project=storycare-dev-479511

# Check service account IAM policy
gcloud iam service-accounts get-iam-policy \
  github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com \
  --project=storycare-dev-479511
```

---

## Step 10: Add GitHub Secrets

Go to your GitHub repository: `https://github.com/YOUR_GITHUB_USERNAME/story-care/settings/secrets/actions`

Add these secrets:

### 1. GCP_PROJECT_ID_DEV
```
storycare-dev-479511
```

### 2. GCP_WORKLOAD_IDENTITY_PROVIDER_DEV
The value from Step 5, e.g.:
```
projects/123456789012/locations/global/workloadIdentityPools/github-dev/providers/github-dev-provider
```

### 3. GCP_SERVICE_ACCOUNT_DEV
```
github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com
```

### 4. ENV_FILE_DEV
Your complete `.env` file content for development:
```env
# Firebase Authentication
NEXT_PUBLIC_FIREBASE_API_KEY=your_dev_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-dev-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-dev-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-dev-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Database
DATABASE_URL=postgresql://...

# Google Cloud Storage
GCS_PROJECT_ID=storycare-dev-479511
GCS_BUCKET_NAME=storycare-dev-media-192837
GCS_CLIENT_EMAIL=your-service-account@storycare-dev-479511.iam.gserviceaccount.com
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# AI Services
DEEPGRAM_API_KEY=...
OPENAI_API_KEY=...

# Security
ARCJET_KEY=...

# App Config
NEXT_PUBLIC_APP_URL=https://your-dev-url.run.app
NEXT_PUBLIC_APP_NAME=StoryCare Dev
```

---

## Step 11: Test the Setup

1. Create a `dev` or `develop` branch in your repository
2. Push a commit to trigger the workflow:
   ```bash
   git checkout -b dev
   git push origin dev
   ```
3. Go to GitHub Actions and watch the deployment

---

## Troubleshooting

### Error: "Permission denied on resource project"
- Make sure you have `Owner` or `Editor` role on the project
- Run: `gcloud auth list` to verify you're authenticated

### Error: "Workload Identity Pool not found"
- Double-check the project ID in all commands
- Verify the pool exists: `gcloud iam workload-identity-pools list --location=global --project=storycare-dev-479511`

### Error: "Failed to impersonate service account"
- Check that the `principalSet` member in Step 8 matches your GitHub repository exactly
- Verify project number (not project ID) is used in Step 8

### Deployment succeeds but app doesn't start
- Check Cloud Run logs: `gcloud run logs read storycare-app-dev --region=us-central1 --project=storycare-dev-479511`
- Verify `ENV_FILE_DEV` has all required environment variables

---

## Additional GCS Service Account Setup

If you need a separate service account for Google Cloud Storage operations:

```bash
# Create GCS service account
gcloud iam service-accounts create storycare-dev-gcs \
  --project=storycare-dev-479511 \
  --display-name="StoryCare Dev GCS Service Account"

# Grant Storage Object Admin permission on the bucket
gcloud storage buckets add-iam-policy-binding gs://storycare-dev-media-192837 \
  --member="serviceAccount:storycare-dev-gcs@storycare-dev-479511.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

# Create and download key (for GCS_CLIENT_EMAIL and GCS_PRIVATE_KEY)
gcloud iam service-accounts keys create ~/storycare-dev-gcs-key.json \
  --iam-account=storycare-dev-gcs@storycare-dev-479511.iam.gserviceaccount.com

# View the key file
cat ~/storycare-dev-gcs-key.json
```

From the JSON output:
- `GCS_CLIENT_EMAIL` = the `client_email` field
- `GCS_PRIVATE_KEY` = the `private_key` field (include the `\n` characters)

**⚠️ IMPORTANT:**
- Store this key file securely
- Delete it after adding to GitHub Secrets: `rm ~/storycare-dev-gcs-key.json`
- Never commit it to your repository

---

## Summary of Values for GitHub Secrets

After completing all steps, you should have:

| Secret Name | Value |
|------------|-------|
| `GCP_PROJECT_ID_DEV` | `storycare-dev-479511` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER_DEV` | `projects/YOUR_PROJECT_NUMBER/locations/global/workloadIdentityPools/github-dev/providers/github-dev-provider` |
| `GCP_SERVICE_ACCOUNT_DEV` | `github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com` |
| `ENV_FILE_DEV` | Your complete `.env` file content |

---

## Next Steps

1. Follow the same process for production using:
   - Project: `storycare-prod` (your production project)
   - Pool: `github-prod`
   - Provider: `github-prod-provider`
   - Service account: `github-actions-prod`

2. Test both workflows thoroughly before relying on them for production deployments

3. Set up monitoring and alerting for failed deployments

---

**Last Updated**: 2025-12-11
**Project**: StoryCare Dev (storycare-dev-479511)
