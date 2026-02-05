# Final Setup Steps - Do This Now!

## ✅ What's Ready:
1. ✅ Workflows configured (dev + prod)
2. ✅ Dockerfile fixed
3. ✅ DATABASE_URL secrets created in GCP
4. ✅ ENV files generated (`.env.github.dev` and `.env.github.prod`)

## 🚨 What You Need to Do:

### Step 1: Add GitHub Secrets

Go to: **https://github.com/akbar904/story-care/settings/secrets/actions**

Click "New repository secret" and add these **5 secrets**:

#### Secret 1: `ENV_FILE_DEV`

Copy this ENTIRE content:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyB6nLPaKGhoDpwqJSLzGkiLB_wmgMzh5dQ
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=storycare-dev.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=storycare-dev
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=storycare-dev.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=8113147247
NEXT_PUBLIC_FIREBASE_APP_ID=1:8113147247:web:4b8a889a69343cb7bc6c9a
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-NTTYFM0HR0
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN=
DATABASE_URL="postgresql://postgres:I|0PRO]3ya4NC_BY@127.0.0.1:5432/storycare_dev?sslmode=disable"
```

**Note:** Remove the comment lines (lines starting with `#`)!

#### Secret 2: `ENV_FILE_PROD`

Copy this content (for now, same as dev since you don't have prod database yet):

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyB6nLPaKGhoDpwqJSLzGkiLB_wmgMzh5dQ
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=storycare-dev.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=storycare-dev
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=storycare-dev.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=8113147247
NEXT_PUBLIC_FIREBASE_APP_ID=1:8113147247:web:4b8a889a69343cb7bc6c9a
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-NTTYFM0HR0
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN=
DATABASE_URL="postgresql://postgres:I|0PRO]3ya4NC_BY@127.0.0.1:5432/storycare_dev?sslmode=disable"
```

#### Secret 3: `GCP_PROJECT_ID`

```
storycare-478114
```

#### Secret 4: `WIF_PROVIDER`

```
projects/832961952490/locations/global/workloadIdentityPools/github-actions-pool/providers/github-actions-provider
```

#### Secret 5: `WIF_SERVICE_ACCOUNT`

```
github-actions@storycare-478114.iam.gserviceaccount.com
```

---

### Step 2: Set Up Workload Identity Federation

Run these commands (only once):

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

---

### Step 3: Test Deployment

```bash
# Commit and push
git add .
git commit -m "fix: update deployment workflows and Dockerfile"
git push origin main
```

This will:
1. ✅ Trigger DEV deployment automatically
2. ✅ Deploy to `storycare-app-dev` on Cloud Run
3. ✅ Connect to Cloud SQL automatically

---

### Step 4: Deploy to Production (When Ready)

**Option A: Manual Deploy**
1. Go to: https://github.com/akbar904/story-care/actions
2. Click "Deploy to Cloud Run (Production)"
3. Click "Run workflow"
4. Click "Run workflow" button

**Option B: Create Release**
```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## 🎯 Deployment Flow

```
┌─────────────────────────────────────────┐
│ Push to main branch                     │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Automatic DEV Deployment                │
│ Service: storycare-app-dev              │
│ URL: https://storycare-app-dev-xxx.run  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Test in Dev                             │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Manual Trigger or Release Tag           │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ PROD Deployment                         │
│ Service: storycare-app                  │
│ URL: https://storycare-app-xxx.run      │
└─────────────────────────────────────────┘
```

---

## ⚠️ Important Notes:

1. **ENV_FILE must NOT have comment lines** - Remove all lines starting with `#`
2. **DATABASE_URL in ENV_FILE** is for build-time migrations only
3. **DATABASE_URL from GCP Secret Manager** is used at runtime (already created ✅)
4. **Cloud SQL Proxy** only needed for local development
5. **Cloud Run** connects automatically via unix socket

---

## 🔍 Verify Setup:

### Check GitHub Secrets:
Go to: https://github.com/akbar904/story-care/settings/secrets/actions

You should see:
- ✅ ENV_FILE_DEV
- ✅ ENV_FILE_PROD
- ✅ GCP_PROJECT_ID
- ✅ WIF_PROVIDER
- ✅ WIF_SERVICE_ACCOUNT

### Check GCP Secrets:
```bash
gcloud secrets list --project=storycare-478114
```

You should see:
- ✅ DATABASE_URL
- ✅ DATABASE_URL_DEV

### Check Cloud SQL:
```bash
gcloud sql databases list --instance=storycare-dev --project=storycare-478114
```

You should see:
- ✅ storycare_dev

---

**Last Updated:** 2025-11-27
**Ready to Deploy!** 🚀
