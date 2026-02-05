# GitHub Actions Setup for Cloud Run - Dev & Production

This guide shows you how to set up GitHub Actions to deploy StoryCare to Google Cloud Run with separate development and production environments.

## 🎯 Overview

**Two Separate Workflows:**

### Development Workflow (`deploy-dev.yml`)
- ✅ **Trigger:** Automatic on push to `main` branch
- ✅ **GCP Project:** `storycare-dev-479511`
- ✅ **Service:** `storycare-app-dev`
- ✅ **Purpose:** Continuous deployment for testing

### Production Workflow (`deploy-prod.yml`)
- ✅ **Trigger:** Manual only (workflow_dispatch)
- ✅ **GCP Project:** `storycare-478114`
- ✅ **Service:** `storycare-app`
- ✅ **Purpose:** Controlled production releases

Both workflows:
- ✅ Build Docker image with environment variables from GitHub Secrets
- ✅ Push image to Google Container Registry (gcr.io)
- ✅ Deploy to Cloud Run
- ✅ Run health checks
- ✅ Show deployment URL in logs

---

## 🚀 Setup Guide

### Step 1: Set Up Workload Identity Federation (WIF)

You'll need to set up WIF for **both** GCP projects.

#### Development Project Setup

```bash
# Set development project variables
export DEV_PROJECT_ID=storycare-dev-479511
export DEV_PROJECT_NUMBER=$(gcloud projects describe $DEV_PROJECT_ID --format="value(projectNumber)")

# Create workload identity pool
gcloud iam workload-identity-pools create "github-actions-pool" \
  --project="${DEV_PROJECT_ID}" \
  --location="global" \
  --display-name="GitHub Actions Pool (Dev)"

# Create workload identity provider
gcloud iam workload-identity-pools providers create-oidc "github-actions-provider" \
  --project="${DEV_PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github-actions-pool" \
  --display-name="GitHub Actions Provider (Dev)" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository_owner == 'akbar904'" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Create service account
gcloud iam service-accounts create github-actions-dev \
  --project="${DEV_PROJECT_ID}" \
  --display-name="GitHub Actions (Dev)"

# Grant necessary roles
gcloud projects add-iam-policy-binding $DEV_PROJECT_ID \
  --member="serviceAccount:github-actions-dev@${DEV_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $DEV_PROJECT_ID \
  --member="serviceAccount:github-actions-dev@${DEV_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $DEV_PROJECT_ID \
  --member="serviceAccount:github-actions-dev@${DEV_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Allow GitHub Actions to impersonate the service account
gcloud iam service-accounts add-iam-policy-binding \
  "github-actions-dev@${DEV_PROJECT_ID}.iam.gserviceaccount.com" \
  --project="${DEV_PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${DEV_PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-actions-pool/attribute.repository/akbar904/story-care"

# Get the WIF provider (save this for GitHub Secrets)
echo "Copy this for GCP_WORKLOAD_IDENTITY_PROVIDER_DEV:"
gcloud iam workload-identity-pools providers describe "github-actions-provider" \
  --project="${DEV_PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github-actions-pool" \
  --format="value(name)"
```

#### Production Project Setup

```bash
# Set production project variables
export PROD_PROJECT_ID=storycare-478114
export PROD_PROJECT_NUMBER=$(gcloud projects describe $PROD_PROJECT_ID --format="value(projectNumber)")

# Create workload identity pool
gcloud iam workload-identity-pools create "github-actions-pool" \
  --project="${PROD_PROJECT_ID}" \
  --location="global" \
  --display-name="GitHub Actions Pool (Prod)"

# Create workload identity provider
gcloud iam workload-identity-pools providers create-oidc "github-actions-provider" \
  --project="${PROD_PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github-actions-pool" \
  --display-name="GitHub Actions Provider (Prod)" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository_owner == 'akbar904'" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Create service account
gcloud iam service-accounts create github-actions-prod \
  --project="${PROD_PROJECT_ID}" \
  --display-name="GitHub Actions (Prod)"

# Grant necessary roles
gcloud projects add-iam-policy-binding $PROD_PROJECT_ID \
  --member="serviceAccount:github-actions-prod@${PROD_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROD_PROJECT_ID \
  --member="serviceAccount:github-actions-prod@${PROD_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROD_PROJECT_ID \
  --member="serviceAccount:github-actions-prod@${PROD_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Allow GitHub Actions to impersonate the service account
gcloud iam service-accounts add-iam-policy-binding \
  "github-actions-prod@${PROD_PROJECT_ID}.iam.gserviceaccount.com" \
  --project="${PROD_PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROD_PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-actions-pool/attribute.repository/akbar904/story-care"

# Get the WIF provider (save this for GitHub Secrets)
echo "Copy this for GCP_WORKLOAD_IDENTITY_PROVIDER_PROD:"
gcloud iam workload-identity-pools providers describe "github-actions-provider" \
  --project="${PROD_PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github-actions-pool" \
  --format="value(name)"
```

---

### Step 2: Prepare Environment Files

#### Development Environment File

Create a complete `.env.dev` file with all your development environment variables:

```bash
# Example structure (use your actual values)
# Firebase Authentication (Dev)
NEXT_PUBLIC_FIREBASE_API_KEY=your_dev_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=storycare-dev-479511.firebaseapp.com
# ... all other dev environment variables

# Database
DATABASE_URL=postgresql://user:pass@dev-host:5432/db

# API Keys
DEEPGRAM_API_KEY=your_dev_key
OPENAI_API_KEY=your_dev_key
# ... etc
```

#### Production Environment File

Create a complete `.env.production` file with all your production environment variables:

```bash
# Example structure (use your actual values)
# Firebase Authentication (Prod)
NEXT_PUBLIC_FIREBASE_API_KEY=your_prod_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=storycare-478114.firebaseapp.com
# ... all other prod environment variables

# Database
DATABASE_URL=postgresql://user:pass@prod-host:5432/db

# API Keys
DEEPGRAM_API_KEY=your_prod_key
OPENAI_API_KEY=your_prod_key
# ... etc
```

---

### Step 3: Add Secrets to GitHub

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

#### Development Secrets

| Secret Name | Value | Description |
|------------|-------|-------------|
| `ENV_FILE_DEV` | Entire contents of `.env.dev` | All dev environment variables as one secret |
| `GCP_PROJECT_ID_DEV` | `storycare-dev-479511` | Development GCP project ID |
| `GCP_SERVICE_ACCOUNT_DEV` | `github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com` | Dev service account email |
| `GCP_WORKLOAD_IDENTITY_PROVIDER_DEV` | `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider` | From Step 1 dev setup |

#### Production Secrets

| Secret Name | Value | Description |
|------------|-------|-------------|
| `ENV_FILE_PROD` | Entire contents of `.env.production` | All prod environment variables as one secret |
| `GCP_PROJECT_ID_PROD` | `storycare-478114` | Production GCP project ID |
| `GCP_SERVICE_ACCOUNT_PROD` | `github-actions-prod@storycare-478114.iam.gserviceaccount.com` | Prod service account email |
| `GCP_WORKLOAD_IDENTITY_PROVIDER_PROD` | `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider` | From Step 1 prod setup |

**Important:** For multi-line private keys in `ENV_FILE_DEV` and `ENV_FILE_PROD`, keep the `\n` characters intact:
```
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQI...\n-----END PRIVATE KEY-----\n"
```

---

### Step 4: Deploy!

#### Development Deployment (Automatic)

Development deploys automatically when you push to the `main` branch:

```bash
git add .
git commit -m "feat: your changes"
git push origin main
```

Watch the deployment in GitHub **Actions** tab → **Deploy to Development**

#### Production Deployment (Manual)

Production deployments are manual for safety:

1. Go to your GitHub repository
2. Click **Actions** tab
3. Click **Deploy to Production** workflow
4. Click **Run workflow** button
5. Type `deploy` in the confirmation field
6. Click **Run workflow**

Watch the deployment progress in real-time!

---

## 📋 GitHub Secrets Checklist

### Development Environment
- [ ] `ENV_FILE_DEV` - Complete .env file for development
- [ ] `GCP_PROJECT_ID_DEV` - `storycare-dev-479511`
- [ ] `GCP_SERVICE_ACCOUNT_DEV` - Service account email
- [ ] `GCP_WORKLOAD_IDENTITY_PROVIDER_DEV` - Full WIF provider path

### Production Environment
- [ ] `ENV_FILE_PROD` - Complete .env file for production
- [ ] `GCP_PROJECT_ID_PROD` - `storycare-478114`
- [ ] `GCP_SERVICE_ACCOUNT_PROD` - Service account email
- [ ] `GCP_WORKLOAD_IDENTITY_PROVIDER_PROD` - Full WIF provider path

---

## 🔍 Monitoring Deployments

### View Deployment Status

1. Go to your GitHub repository
2. Click **Actions** tab
3. Click on the latest workflow run
4. Expand steps to see detailed logs
5. Check the summary for deployment URL

### Check Service URLs

After deployment, get your service URLs:

```bash
# Development
gcloud run services describe storycare-app-dev \
  --project=storycare-dev-479511 \
  --region=us-central1 \
  --format='value(status.url)'

# Production
gcloud run services describe storycare-app \
  --project=storycare-478114 \
  --region=us-central1 \
  --format='value(status.url)'
```

---

## 🔒 Security Best Practices

### Workload Identity Federation Benefits
- ✅ No long-lived credentials stored in GitHub
- ✅ Automatic credential rotation
- ✅ Short-lived tokens only
- ✅ More secure than service account keys
- ✅ Google's recommended approach

### Additional Security
- ✅ Separate dev and prod projects (isolation)
- ✅ Manual production deployments (control)
- ✅ Confirmation required for prod (`deploy` keyword)
- ✅ Environment-specific service accounts
- ✅ Minimal required IAM roles
- ✅ Repository owner verification in WIF

### Recommended
- ✅ Enable branch protection for `main` branch
- ✅ Require pull request reviews before merging
- ✅ Enable required status checks (CI must pass)
- ✅ Regularly audit service account permissions
- ✅ Monitor deployment logs for anomalies

---

## 🐛 Troubleshooting

### Error: "Workload Identity Federation failed"

**Problem:** WIF not configured correctly.

**Solution:**
1. Verify provider name matches GitHub secret
2. Check service account email is correct
3. Ensure repository owner matches (`akbar904`)
4. Confirm pool and provider names are correct

```bash
# Check WIF configuration for dev
gcloud iam workload-identity-pools providers describe "github-actions-provider" \
  --project="storycare-dev-479511" \
  --location="global" \
  --workload-identity-pool="github-actions-pool"
```

### Error: "Permission denied"

**Problem:** Service account doesn't have required permissions.

**Solution:**
```bash
# Re-grant permissions (dev example)
gcloud projects add-iam-policy-binding storycare-dev-479511 \
  --member="serviceAccount:github-actions-dev@storycare-dev-479511.iam.gserviceaccount.com" \
  --role="roles/run.admin"
```

### Error: "Invalid ENV_FILE format"

**Problem:** Multi-line secret formatting issue.

**Solution:**
1. Ensure entire .env file is copied as-is
2. Keep `\n` characters in private keys
3. Don't add extra quotes or escaping
4. Use GitHub's secret editor (paste entire file content)

### Error: "Health check failed"

**Problem:** Service isn't responding at `/api/health`.

**Solution:**
1. Check Cloud Run logs in GCP Console
2. Verify environment variables are correct
3. Ensure database connectivity
4. Check for startup errors in logs

### Production Workflow Doesn't Run

**Problem:** Forgot to type `deploy` in confirmation field.

**Solution:**
Re-run workflow and type exactly `deploy` (case-sensitive) in the confirmation field.

---

## 📊 Workflow Features

### Development Workflow
- ✅ Automatic trigger on `main` push
- ✅ Builds with `ENV_FILE_DEV`
- ✅ Deploys to `storycare-app-dev`
- ✅ Lower resource limits (0-10 instances)
- ✅ NODE_ENV=development
- ✅ Health check with retry
- ✅ Deployment summary in GitHub

### Production Workflow
- ✅ Manual trigger only (workflow_dispatch)
- ✅ Requires "deploy" confirmation
- ✅ Builds with `ENV_FILE_PROD`
- ✅ Deploys to `storycare-app`
- ✅ Higher resource limits (1-100 instances)
- ✅ NODE_ENV=production
- ✅ Strict health checks (fails on error)
- ✅ Timestamped image tags
- ✅ Deployment notification

---

## 🎯 Next Steps

After GitHub Actions is working:

1. **Set up branch protection:**
   - Settings → Branches → Add rule for `main`
   - Require pull request reviews
   - Require status checks to pass

2. **Configure custom domains:**
   - Set up custom domain in Cloud Run
   - Update `NEXT_PUBLIC_APP_URL` in environment files
   - Configure SSL certificates

3. **Set up monitoring:**
   - Enable Cloud Run logging
   - Configure error alerting in GCP
   - Set up Sentry for error tracking
   - Monitor PostHog analytics

4. **Optimize resources:**
   - Review Cloud Run instance counts
   - Adjust memory/CPU based on usage
   - Configure autoscaling parameters

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [GitHub Actions Security](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)

---

## 🔄 Updating Environment Variables

See `.github/DEPLOYMENT.md` for instructions on updating `ENV_FILE_DEV` and `ENV_FILE_PROD` secrets.

---

**Last Updated:** 2025-12-03
**Version:** 2.0.0
**Authors:** Development Team
