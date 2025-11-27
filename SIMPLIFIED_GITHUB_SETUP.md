# Simplified GitHub Secrets Setup

This guide shows you how to set up GitHub Actions with **just 4 secrets** instead of 15+!

## 🎯 Overview

Instead of adding each environment variable as a separate GitHub secret, we'll:
1. ✅ Put all your env vars in ONE secret (`ENV_FILE`)
2. ✅ Add only 3 more secrets for authentication
3. ✅ Done! No need to manage 15+ individual secrets

---

## 📝 Step 1: Create Your ENV_FILE

Run this script to generate the content:

```bash
./create-env-for-github.sh
```

This will:
1. Read your `.env.local` file
2. Extract all build-time variables (NEXT_PUBLIC_*, DATABASE_URL)
3. Create `.env.github` file
4. Display the content to copy

**Example output:**
```bash
# Build-time environment variables for Docker build
# This file should be copied to GitHub Secret: ENV_FILE

NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=storycare-dev.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=storycare-dev
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=storycare-dev.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABC123
NEXT_PUBLIC_APP_URL=https://storycare-app-xyz-uc.a.run.app
NEXT_PUBLIC_SENTRY_DSN=https://...
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
DATABASE_URL=postgresql://user:pass@host/db
```

---

## 🔑 Step 2: Add 4 Secrets to GitHub

Go to: **https://github.com/akbar904/story-care/settings/secrets/actions**

### Option A: Using Workload Identity Federation (Recommended - More Secure)

Add these 4 secrets:

| Secret Name | Value | Where to Get |
|------------|-------|--------------|
| `ENV_FILE` | Output from `create-env-for-github.sh` | Run the script above |
| `GCP_PROJECT_ID` | `storycare-478114` | Copy from here |
| `WIF_PROVIDER` | `projects/832961952490/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider` | Run WIF setup commands below |
| `WIF_SERVICE_ACCOUNT` | `github-actions@storycare-478114.iam.gserviceaccount.com` | Copy from here |

### Option B: Using Service Account Key (Faster Setup - Less Secure)

Add these 3 secrets:

| Secret Name | Value | Where to Get |
|------------|-------|--------------|
| `ENV_FILE` | Output from `create-env-for-github.sh` | Run the script above |
| `GCP_PROJECT_ID` | `storycare-478114` | Copy from here |
| `GCP_SA_KEY` | Contents of `github-actions-key.json` | You already have this |

---

## 🚀 Step 3: Set Up Workload Identity Federation (Optional but Recommended)

Only if you chose Option A above. Run these commands:

```bash
export PROJECT_ID=storycare-478114
export PROJECT_NUMBER=832961952490

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
```

After running these commands, the `WIF_PROVIDER` value will be:
```
projects/832961952490/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider
```

---

## ✅ Step 4: Update GitHub Workflow (Only if using WIF)

If you're using Workload Identity Federation (Option A), edit `.github/workflows/deploy-cloud-run.yml`:

**Change from:**
```yaml
# Option 2: Authenticate via Service Account Key (Quick Setup)
- name: Authenticate to Google Cloud (Service Account)
  uses: google-github-actions/auth@v2
  with:
    credentials_json: ${{ secrets.GCP_SA_KEY }}
```

**To:**
```yaml
# Option 1: Authenticate via Workload Identity Federation (Recommended)
- name: Authenticate to Google Cloud (Workload Identity)
  uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
    service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}
```

---

## 🎉 Step 5: Deploy!

Push to main branch to trigger deployment:

```bash
git add .
git commit -m "chore: simplify GitHub secrets with ENV_FILE"
git push origin main
```

Watch the deployment at:
**https://github.com/akbar904/story-care/actions**

---

## 📊 Before vs After

### Before (Old Way):
```
✗ NEXT_PUBLIC_FIREBASE_API_KEY
✗ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
✗ NEXT_PUBLIC_FIREBASE_PROJECT_ID
✗ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
✗ NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
✗ NEXT_PUBLIC_FIREBASE_APP_ID
✗ NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
✗ NEXT_PUBLIC_APP_URL
✗ NEXT_PUBLIC_SENTRY_DSN
✗ NEXT_PUBLIC_POSTHOG_KEY
✗ NEXT_PUBLIC_POSTHOG_HOST
✗ DATABASE_URL
✗ GCP_PROJECT_ID
✗ WIF_PROVIDER
✗ WIF_SERVICE_ACCOUNT

Total: 15 secrets 😰
```

### After (New Way):
```
✓ ENV_FILE (contains all env vars in one secret)
✓ GCP_PROJECT_ID
✓ WIF_PROVIDER
✓ WIF_SERVICE_ACCOUNT

Total: 4 secrets 🎉
```

---

## 🔄 Updating Environment Variables

When you need to update env vars (e.g., change Firebase config):

1. Update your `.env.local` file
2. Run `./create-env-for-github.sh` again
3. Copy new content to GitHub Secret `ENV_FILE`
4. Done! One update instead of updating 10+ individual secrets

---

## 🐛 Troubleshooting

### Error: "ENV_FILE not found" during build

**Problem:** GitHub secret `ENV_FILE` is empty or not set.

**Solution:**
1. Run `./create-env-for-github.sh`
2. Copy the output
3. Add to GitHub Secrets as `ENV_FILE`

### Error: "Missing environment variable NEXT_PUBLIC_..."

**Problem:** Your `.env.local` is missing some variables.

**Solution:**
1. Check your `.env.local` has all required variables
2. Run `./create-env-for-github.sh` again
3. Update the `ENV_FILE` secret on GitHub

### Error: "Permission denied" on script

**Solution:**
```bash
chmod +x create-env-for-github.sh
./create-env-for-github.sh
```

---

## 📝 What Gets Included in ENV_FILE?

The script only includes **build-time** variables:
- ✅ `NEXT_PUBLIC_*` - Public variables baked into the build
- ✅ `DATABASE_URL` - Needed for migrations during build

**NOT included** (loaded from GCP Secret Manager at runtime):
- ✗ Private API keys (OPENAI_API_KEY, DEEPGRAM_API_KEY, etc.)
- ✗ Firebase service account credentials
- ✗ GCS credentials
- ✗ Arcjet keys

This is more secure - sensitive keys are never stored in GitHub!

---

## 🔐 Security Notes

1. **ENV_FILE secret** contains only build-time public variables
2. **Runtime secrets** (API keys, etc.) come from GCP Secret Manager
3. **WIF is more secure** than service account keys (no long-lived credentials)
4. **Never commit** `.env.local` or `.env.github` to git

---

## 📚 Quick Reference

### Required GitHub Secrets (Option A - WIF):
```
ENV_FILE
GCP_PROJECT_ID
WIF_PROVIDER
WIF_SERVICE_ACCOUNT
```

### Required GitHub Secrets (Option B - Service Account Key):
```
ENV_FILE
GCP_PROJECT_ID
GCP_SA_KEY
```

### Required GCP Secret Manager Secrets:
These are loaded at runtime by Cloud Run (already set up):
- DATABASE_URL
- FIREBASE_PROJECT_ID
- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY
- GCS_PROJECT_ID
- GCS_CLIENT_EMAIL
- GCS_PRIVATE_KEY
- GCS_BUCKET_NAME
- DEEPGRAM_API_KEY
- OPENAI_API_KEY
- STABILITY_API_KEY
- ARCJET_KEY
- (and others)

---

**Last Updated:** 2025-01-15
**Repository:** akbar904/story-care
**Project ID:** storycare-478114
