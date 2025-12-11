# GitHub Secrets Configuration Guide

This document outlines all required GitHub secrets for the StoryCare deployment workflows.

## Development Environment Secrets

These secrets are used by `.github/workflows/deploy-dev.yml`:

### Required Secrets

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `GCP_PROJECT_ID_DEV` | Your GCP dev project ID | From GCP Console Dashboard |
| `GCP_WORKLOAD_IDENTITY_PROVIDER_DEV` | Workload Identity Provider resource name | See "Setting up Workload Identity" below |
| `GCP_SERVICE_ACCOUNT_DEV` | Dev service account email | From GCP IAM & Admin > Service Accounts |
| `ENV_FILE_DEV` | Dev environment variables | Complete `.env` file content for development |

### Setting up Workload Identity Federation (Recommended)

Workload Identity Federation is more secure than service account keys.

1. **Create a Workload Identity Pool:**
   ```bash
   gcloud iam workload-identity-pools create "github-dev" \
     --project="YOUR_DEV_PROJECT_ID" \
     --location="global" \
     --display-name="GitHub Actions Pool (Dev)"
   ```

2. **Create a Workload Identity Provider:**
   ```bash
   gcloud iam workload-identity-pools providers create-oidc "github-dev-provider" \
     --project="YOUR_DEV_PROJECT_ID" \
     --location="global" \
     --workload-identity-pool="github-dev" \
     --display-name="GitHub Actions Provider (Dev)" \
     --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
     --issuer-uri="https://token.actions.githubusercontent.com"
   ```

3. **Get the Workload Identity Provider resource name:**
   ```bash
   gcloud iam workload-identity-pools providers describe "github-dev-provider" \
     --project="YOUR_DEV_PROJECT_ID" \
     --location="global" \
     --workload-identity-pool="github-dev" \
     --format="value(name)"
   ```

   This will output something like:
   ```
   projects/123456789/locations/global/workloadIdentityPools/github-dev/providers/github-dev-provider
   ```

   **Use this as `GCP_WORKLOAD_IDENTITY_PROVIDER_DEV`**

4. **Create a service account:**
   ```bash
   gcloud iam service-accounts create github-actions-dev \
     --project="YOUR_DEV_PROJECT_ID" \
     --display-name="GitHub Actions Service Account (Dev)"
   ```

5. **Grant necessary permissions to the service account:**
   ```bash
   # Cloud Run Admin
   gcloud projects add-iam-policy-binding YOUR_DEV_PROJECT_ID \
     --member="serviceAccount:github-actions-dev@YOUR_DEV_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/run.admin"

   # Storage Admin (for GCR)
   gcloud projects add-iam-policy-binding YOUR_DEV_PROJECT_ID \
     --member="serviceAccount:github-actions-dev@YOUR_DEV_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/storage.admin"

   # Service Account User
   gcloud projects add-iam-policy-binding YOUR_DEV_PROJECT_ID \
     --member="serviceAccount:github-actions-dev@YOUR_DEV_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/iam.serviceAccountUser"
   ```

6. **Allow the Workload Identity Pool to impersonate the service account:**
   ```bash
   gcloud iam service-accounts add-iam-policy-binding \
     "github-actions-dev@YOUR_DEV_PROJECT_ID.iam.gserviceaccount.com" \
     --project="YOUR_DEV_PROJECT_ID" \
     --role="roles/iam.workloadIdentityUser" \
     --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-dev/attribute.repository/YOUR_GITHUB_USERNAME/story-care"
   ```

   Replace `PROJECT_NUMBER` with your numeric project number (found in GCP Console Dashboard).
   Replace `YOUR_GITHUB_USERNAME` with your GitHub username or org name.

7. **Set GitHub Secrets:**
   - `GCP_WORKLOAD_IDENTITY_PROVIDER_DEV`: The resource name from step 3
   - `GCP_SERVICE_ACCOUNT_DEV`: `github-actions-dev@YOUR_DEV_PROJECT_ID.iam.gserviceaccount.com`
   - `GCP_PROJECT_ID_DEV`: Your dev project ID

### ENV_FILE_DEV Content

This secret should contain your complete `.env` file for development. Example:

```env
# Firebase Authentication (Client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=your_dev_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-dev-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-dev-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-dev-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_dev_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_dev_app_id

# Firebase Admin SDK (Server-side)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Database
DATABASE_URL=postgresql://...your-dev-database-url

# Security
ARCJET_KEY=ajkey_dev_...

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-dev-app.run.app
NEXT_PUBLIC_APP_NAME=StoryCare Dev

# AI Services
DEEPGRAM_API_KEY=...
OPENAI_API_KEY=...

# Google Cloud Storage
GCS_PROJECT_ID=your-dev-project-id
GCS_CLIENT_EMAIL=...
GCS_PRIVATE_KEY=...
GCS_BUCKET_NAME=your-dev-bucket
```

---

## Production Environment Secrets

These secrets are used by `.github/workflows/deploy-prod.yml`:

### Required Secrets

| Secret Name | Description | How to Get |
|------------|-------------|------------|
| `GCP_PROJECT_ID_PROD` | Your GCP production project ID | From GCP Console Dashboard |
| `GCP_WORKLOAD_IDENTITY_PROVIDER_PROD` | Workload Identity Provider resource name | Follow same steps as dev, use `github-prod` names |
| `GCP_SERVICE_ACCOUNT_PROD` | Production service account email | From GCP IAM & Admin > Service Accounts |
| `ENV_FILE_PROD` | Production environment variables | Complete `.env` file content for production |

### Setting up Production Workload Identity

Follow the same steps as Development, but replace:
- `github-dev` → `github-prod`
- `github-dev-provider` → `github-prod-provider`
- `github-actions-dev` → `github-actions-prod`
- `YOUR_DEV_PROJECT_ID` → `YOUR_PROD_PROJECT_ID`

---

## Adding Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Add each secret with the exact name listed above
5. Paste the corresponding value
6. Click **Add secret**

---

## Workflow Comparison

| Feature | Development | Production |
|---------|------------|------------|
| **Trigger** | Push to `dev` or `develop` branch | Manual trigger with "deploy" confirmation |
| **Service Name** | `storycare-app-dev` | `storycare-app` |
| **Resources** | 1Gi RAM, 1 CPU | 4Gi RAM, 2 CPU |
| **Min Instances** | 0 (cost-optimized) | 1 (always ready) |
| **Max Instances** | 10 | 100 |
| **Environment** | `NODE_ENV=development` | `NODE_ENV=production` |
| **Docker Tags** | `dev-latest`, `dev-{timestamp}`, `{sha}` | `latest`, `prod-{timestamp}`, `{sha}` |

---

## Troubleshooting

### "Permission denied" errors during deployment

- Verify the service account has all required roles (Cloud Run Admin, Storage Admin, Service Account User)
- Check that the Workload Identity binding is correct

### "Workload Identity Provider not found"

- Ensure you copied the full resource name from step 3
- Verify the pool and provider exist: `gcloud iam workload-identity-pools list --location=global`

### Build fails with missing environment variables

- Check that `ENV_FILE_DEV` or `ENV_FILE_PROD` contains all required variables
- Verify the Docker build is correctly using the `--build-arg ENV_FILE` parameter

### Health check failures

- Ensure your app has a `/api/health` endpoint
- Check Cloud Run logs for startup errors: `gcloud run logs read storycare-app-dev --region=us-central1`

---

## Security Best Practices

1. **Never commit secrets to the repository**
2. **Use separate GCP projects for dev and production**
3. **Rotate service account keys regularly (if not using Workload Identity)**
4. **Audit secret access regularly** (GitHub Settings > Security > Audit log)
5. **Use Workload Identity Federation** instead of service account keys whenever possible
6. **Limit service account permissions** to only what's needed
7. **Enable 2FA** on all accounts with access to secrets

---

**Last Updated**: 2025-12-11
