# Update GitHub Secrets - Quick Guide

## Step 1: Run the Workload Identity Federation Setup

Run these commands in your terminal (already configured for your project):

```bash
# Set environment variables
export PROJECT_ID=storycare-478114
export PROJECT_NUMBER=832961952490
export GITHUB_OWNER=akbar904
export GITHUB_REPO=story-care

# Verify values
echo "Project ID: $PROJECT_ID"
echo "Project Number: $PROJECT_NUMBER"
echo "GitHub Repo: $GITHUB_OWNER/$GITHUB_REPO"

# 1. Create Workload Identity Pool
gcloud iam workload-identity-pools create "github-actions-pool" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --display-name="GitHub Actions Pool"

# 2. Create OIDC Provider
gcloud iam workload-identity-pools providers create-oidc "github-actions-provider" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github-actions-pool" \
  --display-name="GitHub Actions Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository_owner == 'akbar904'" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# 3. Link GitHub to Service Account
gcloud iam service-accounts add-iam-policy-binding \
  "github-actions@${PROJECT_ID}.iam.gserviceaccount.com" \
  --project="${PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-actions-pool/attribute.repository/akbar904/story-care"

# 4. Get Provider Name (copy this output!)
gcloud iam workload-identity-pools providers describe "github-actions-provider" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github-actions-pool" \
  --format="value(name)"
```

**Expected output from step 4:**
```
projects/832961952490/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider
```

---

## Step 2: Add Secrets to GitHub

Go to: **https://github.com/akbar904/story-care/settings/secrets/actions**

Click **"New repository secret"** for each of these:

### Core Secrets (Required for WIF)

| Secret Name | Value |
|------------|-------|
| `GCP_PROJECT_ID` | `storycare-478114` |
| `WIF_PROVIDER` | `projects/832961952490/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider` |
| `WIF_SERVICE_ACCOUNT` | `github-actions@storycare-478114.iam.gserviceaccount.com` |

### Build-Time Environment Variables (Required)

These are needed during Docker build (they get baked into the image):

| Secret Name | Where to find value |
|------------|-------------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | From your `.env.local` or Firebase Console |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | From your `.env.local` or Firebase Console |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | From your `.env.local` or Firebase Console |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | From your `.env.local` or Firebase Console |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | From your `.env.local` or Firebase Console |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | From your `.env.local` or Firebase Console |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | From your `.env.local` or Firebase Console (optional) |
| `NEXT_PUBLIC_APP_URL` | `https://storycare-app-YOUR_HASH-uc.a.run.app` (will get this after first deployment) |
| `DATABASE_URL` | From your Neon PostgreSQL dashboard |

### Optional Monitoring Secrets

| Secret Name | Where to find value |
|------------|-------------------|
| `NEXT_PUBLIC_SENTRY_DSN` | From Sentry project settings |
| `NEXT_PUBLIC_POSTHOG_KEY` | From PostHog project settings |
| `NEXT_PUBLIC_POSTHOG_HOST` | Usually `https://app.posthog.com` |
| `NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN` | From Better Stack settings |

---

## Step 3: Enable Workload Identity in Workflow

The workflow file is already set up! You just need to uncomment the WIF section and comment out the service account key section:

```bash
# Edit the workflow file
nano .github/workflows/deploy-cloud-run.yml
```

Change lines 33-46 from:
```yaml
# Option 1: Authenticate via Workload Identity Federation (Recommended)
# Uncomment this block after setting up Workload Identity Federation
# - name: Authenticate to Google Cloud (Workload Identity)
#   uses: google-github-actions/auth@v2
#   with:
#     workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
#     service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}

# Option 2: Authenticate via Service Account Key (Quick Setup)
# Comment out this block after setting up Workload Identity Federation
- name: Authenticate to Google Cloud (Service Account)
  uses: google-github-actions/auth@v2
  with:
    credentials_json: ${{ secrets.GCP_SA_KEY }}
```

To:
```yaml
# Option 1: Authenticate via Workload Identity Federation (Recommended)
- name: Authenticate to Google Cloud (Workload Identity)
  uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
    service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}

# Option 2: Authenticate via Service Account Key (Quick Setup)
# Comment out this block after setting up Workload Identity Federation
# - name: Authenticate to Google Cloud (Service Account)
#   uses: google-github-actions/auth@v2
#   with:
#     credentials_json: ${{ secrets.GCP_SA_KEY }}
```

---

## Step 4: Quick Helper - Get Your .env Values

If you need to copy values from your `.env.local`, run:

```bash
# Show Firebase values
grep "NEXT_PUBLIC_FIREBASE" .env.local

# Show other public values
grep "NEXT_PUBLIC" .env.local

# Show database URL
grep "DATABASE_URL" .env.local
```

**IMPORTANT:**
- Copy these values one by one to GitHub Secrets
- DO NOT include the `NEXT_PUBLIC_` prefix in the value itself
- Example: If your .env has `NEXT_PUBLIC_FIREBASE_API_KEY=AIza...`, just copy `AIza...` to GitHub

---

## Step 5: Test the Deployment

After adding all secrets:

```bash
# Commit the workflow change (if you edited it)
git add .github/workflows/deploy-cloud-run.yml
git commit -m "chore: enable Workload Identity Federation for GitHub Actions"
git push origin update-nextjs-config

# Then merge to main branch (or push directly to main if you prefer)
# The GitHub Action will trigger automatically
```

Watch the deployment at:
**https://github.com/akbar904/story-care/actions**

---

## Troubleshooting

### "Secret not found" error
- Check that secret names match exactly (case-sensitive)
- Go to https://github.com/akbar904/story-care/settings/secrets/actions
- Verify all required secrets are listed

### "Permission denied" error
- Make sure you ran all the `gcloud` commands above
- Verify service account has correct roles:
  ```bash
  gcloud projects get-iam-policy storycare-478114 \
    --flatten="bindings[].members" \
    --filter="bindings.members:github-actions@storycare-478114.iam.gserviceaccount.com"
  ```

### "Workload Identity Federation failed"
- Verify `WIF_PROVIDER` value is correct (should start with `projects/832961952490/...`)
- Check that repository owner is `akbar904` in the provider condition

### "Build argument not provided"
- Add the missing secret to GitHub repository secrets
- Make sure you copied the value correctly (no extra spaces)

---

## Quick Copy-Paste Values

**For GitHub Secrets:**

```
GCP_PROJECT_ID = storycare-478114

WIF_PROVIDER = projects/832961952490/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider

WIF_SERVICE_ACCOUNT = github-actions@storycare-478114.iam.gserviceaccount.com
```

**Note:** The other secrets (Firebase, Database, etc.) need to come from your actual `.env.local` file or service dashboards.

---

**Last Updated:** 2025-01-15
**Repository:** akbar904/story-care
**Project ID:** storycare-478114
