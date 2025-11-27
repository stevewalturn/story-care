# GitHub Actions Setup for Cloud Run

This guide shows you how to set up GitHub Actions to automatically deploy StoryCare to Google Cloud Run when you push to the `main` branch.

## 🎯 Overview

GitHub Actions will:
- ✅ Build Docker image with all environment variables
- ✅ Push image to Google Container Registry
- ✅ Deploy to Cloud Run
- ✅ Run health checks
- ✅ Show deployment URL in GitHub Actions logs

Already configured workflows:
- **`CI.yml`** - Existing comprehensive CI checks (lint, test, build, E2E)
- **`deploy-cloud-run.yml`** - New Cloud Run deployment workflow (created)

---

## 🚀 Quick Setup (5 minutes)

### Option A: Using Service Account Key (Fastest - Less Secure)

#### Step 1: Create Service Account

```bash
# Set your project ID
export PROJECT_ID=storycare-478114

# Create service account
gcloud iam service-accounts create github-actions \
  --description="GitHub Actions deployment" \
  --display-name="GitHub Actions"

# Grant necessary roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

#### Step 2: Create and Download Key

```bash
# Create key
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=github-actions@${PROJECT_ID}.iam.gserviceaccount.com

# IMPORTANT: This file contains sensitive credentials!
# Copy the contents - you'll add it to GitHub Secrets
cat github-actions-key.json

# Delete the file after copying (security best practice)
rm github-actions-key.json
```

#### Step 3: Add Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

**Required Secrets:**

| Secret Name | Value | Description |
|------------|-------|-------------|
| `GCP_PROJECT_ID` | Your GCP project ID | e.g., `storycare-prod-123456` |
| `GCP_SA_KEY` | Contents of `github-actions-key.json` | The entire JSON file contents |

**Build-Time Secrets (for Docker build):**

| Secret Name | Source |
|------------|--------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | From your .env |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | From your .env |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | From your .env |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | From your .env |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | From your .env |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | From your .env |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | From your .env |
| `NEXT_PUBLIC_APP_URL` | Your Cloud Run URL |
| `DATABASE_URL` | Your Neon database URL |

**Optional (Monitoring):**

| Secret Name | Source |
|------------|--------|
| `NEXT_PUBLIC_SENTRY_DSN` | From your .env |
| `NEXT_PUBLIC_POSTHOG_KEY` | From your .env |
| `NEXT_PUBLIC_POSTHOG_HOST` | From your .env |
| `NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN` | From your .env |

**Note:** Runtime secrets (Firebase private keys, API keys, etc.) are loaded from GCP Secret Manager, not GitHub Secrets.

#### Step 4: Deploy!

```bash
git add .
git commit -m "feat: add GitHub Actions deployment"
git push origin main
```

Watch the deployment in **Actions** tab on GitHub!

---

### Option B: Using Workload Identity Federation (Recommended - More Secure)

Workload Identity Federation allows GitHub Actions to authenticate without storing long-lived credentials.

#### Step 1: Create Workload Identity Pool

```bash
export PROJECT_ID=storycare-478114
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# Create workload identity pool
gcloud iam workload-identity-pools create "github-actions-pool" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --display-name="GitHub Actions Pool"

# Create workload identity provider
gcloud iam workload-identity-pools providers create-oidc "github-actions-provider" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github-actions-pool" \
  --display-name="GitHub Actions Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository_owner == 'akbar904'" \
  --issuer-uri="https://token.actions.githubusercontent.com"
```

#### Step 2: Create Service Account

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions"

# Grant necessary roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Allow GitHub Actions to impersonate the service account
gcloud iam service-accounts add-iam-policy-binding \
  "github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --project="${PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-actions-pool/attribute.repository/akbar904/story-care"
```

#### Step 3: Get Workload Identity Provider

```bash
# Get the full provider name
gcloud iam workload-identity-pools providers describe "github-actions-provider" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github-actions-pool" \
  --format="value(name)"

# Output will be something like:
# projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider
```

#### Step 4: Add Secrets to GitHub

Add these secrets to GitHub (Settings → Secrets → Actions):

| Secret Name | Value |
|------------|-------|
| `GCP_PROJECT_ID` | Your project ID |
| `WIF_PROVIDER` | The full provider name from Step 3 |
| `WIF_SERVICE_ACCOUNT` | `github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com` |

Plus all the build-time secrets from Option A.

#### Step 5: Update Workflow

In `.github/workflows/deploy-cloud-run.yml`, uncomment the Workload Identity section and comment out the Service Account section:

```yaml
# Option 1: Authenticate via Workload Identity Federation (Recommended)
- name: Authenticate to Google Cloud (Workload Identity)
  uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
    service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}

# Option 2: Authenticate via Service Account Key (Quick Setup)
# Comment this out when using Workload Identity
# - name: Authenticate to Google Cloud (Service Account)
#   uses: google-github-actions/auth@v2
#   with:
#     credentials_json: ${{ secrets.GCP_SA_KEY }}
```

#### Step 6: Deploy!

```bash
git add .
git commit -m "feat: enable Workload Identity Federation"
git push origin main
```

---

## 📋 GitHub Secrets Checklist

Here's the complete list of secrets you need to add to GitHub:

### Core Secrets
- [ ] `GCP_PROJECT_ID`
- [ ] `GCP_SA_KEY` (Option A) OR `WIF_PROVIDER` + `WIF_SERVICE_ACCOUNT` (Option B)

### Build-Time Environment Variables
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `DATABASE_URL`

### Optional (Monitoring)
- [ ] `NEXT_PUBLIC_SENTRY_DSN`
- [ ] `NEXT_PUBLIC_POSTHOG_KEY`
- [ ] `NEXT_PUBLIC_POSTHOG_HOST`
- [ ] `NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN`

---

## 🔍 Monitoring Deployments

### View Deployment Status

1. Go to your GitHub repository
2. Click **Actions** tab
3. Click on the latest workflow run
4. Expand steps to see detailed logs

### Check Deployment URL

The deployment URL will be shown in the workflow logs under the "Show deployment URL" step.

### Manual Trigger

You can manually trigger a deployment:

1. Go to **Actions** tab
2. Click **Deploy to Cloud Run** workflow
3. Click **Run workflow** button
4. Select `main` branch
5. Click **Run workflow**

---

## 🔒 Security Best Practices

### Service Account Key (Option A)
- ✅ Never commit `GCP_SA_KEY` to git
- ✅ Store only in GitHub Secrets
- ✅ Rotate keys periodically (every 90 days)
- ✅ Delete downloaded JSON files after adding to GitHub
- ⚠️ Service account keys are long-lived credentials

### Workload Identity Federation (Option B)
- ✅ No long-lived credentials stored
- ✅ Automatic credential rotation
- ✅ More secure than service account keys
- ✅ Recommended for production
- ✅ Credentials are short-lived tokens

### Additional Security
- ✅ Use branch protection rules for `main` branch
- ✅ Require pull request reviews before merging
- ✅ Enable required status checks (CI must pass)
- ✅ Use environment protection rules for production
- ✅ Regularly audit service account permissions

---

## 🐛 Troubleshooting

### Error: "Permission denied"

**Problem:** Service account doesn't have required permissions.

**Solution:**
```bash
# Re-grant permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.admin"
```

### Error: "Invalid credentials"

**Problem:** `GCP_SA_KEY` is malformed.

**Solution:**
1. Ensure you copied the entire JSON file contents
2. No extra spaces or line breaks
3. Should start with `{` and end with `}`

### Error: "Secret not found"

**Problem:** GitHub secret name doesn't match workflow.

**Solution:**
1. Check secret names in GitHub Settings → Secrets
2. Names are case-sensitive
3. Must match exactly what's in the workflow YAML

### Error: "Build argument not provided"

**Problem:** Missing build-time environment variable in GitHub Secrets.

**Solution:**
Add the missing secret to GitHub repository secrets.

### Error: "Workload Identity Federation failed"

**Problem:** WIF not configured correctly.

**Solution:**
1. Verify provider name is correct
2. Check service account email is correct
3. Ensure repository owner condition matches (`akbar904`)

---

## 🆚 GitHub Actions vs Cloud Build

You can use both! They serve different purposes:

| Feature | GitHub Actions | Cloud Build |
|---------|---------------|-------------|
| **Trigger** | Push to GitHub | Push to GitHub or manual |
| **Visibility** | In GitHub UI | In GCP Console |
| **Secrets** | GitHub Secrets | GCP Secret Manager |
| **Speed** | ~5-8 minutes | ~5-8 minutes |
| **Cost** | 2,000 free min/month | 120 free min/day |
| **Best for** | GitHub-centric teams | GCP-centric teams |

**Recommendation:** Use GitHub Actions for better visibility and integration with your development workflow.

---

## 📊 Workflow Features

The GitHub Actions workflow includes:

- ✅ **Multi-stage Docker build** - Optimized image size
- ✅ **Health checks** - Verifies deployment succeeded
- ✅ **Automatic rollback** - If health check fails
- ✅ **Environment variables** - From GitHub Secrets and GCP Secret Manager
- ✅ **Deployment URL** - Shown in workflow logs
- ✅ **Build caching** - Faster subsequent builds
- ✅ **Manual trigger** - Deploy on-demand via GitHub UI

---

## 🎯 Next Steps

After GitHub Actions is working:

1. **Set up branch protection:**
   - Settings → Branches → Add rule
   - Branch name pattern: `main`
   - Require pull request reviews
   - Require status checks (CI must pass)

2. **Enable environment protection:**
   - Settings → Environments → New environment
   - Name: `production`
   - Add required reviewers
   - Update workflow to use environment

3. **Set up notifications:**
   - Settings → Webhooks
   - Add Slack/Discord webhook for deployment notifications

4. **Monitor costs:**
   - GitHub Actions usage: Settings → Billing
   - GCP costs: Cloud Console → Billing

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Google Cloud Run GitHub Action](https://github.com/google-github-actions/deploy-cloudrun)
- [Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [GitHub Actions Security](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)

---

**Last Updated:** 2025-01-15
**Version:** 1.0.0
