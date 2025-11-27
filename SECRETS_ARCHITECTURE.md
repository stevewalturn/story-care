# Secrets Architecture - Simplified!

## 🎯 Overview

We use a **hybrid approach** for managing secrets:
1. **GitHub Secrets** → Build-time environment variables (public configs)
2. **GCP Secret Manager** → Runtime secrets (sensitive data like DATABASE_URL)

---

## 📦 What Goes Where?

### GitHub Secrets (Build-Time)

These are **baked into the Docker image** during build. They're public or semi-public values:

| Secret Name | Contents | Used For |
|------------|----------|----------|
| `ENV_FILE_DEV` | All `NEXT_PUBLIC_*` variables + `DATABASE_URL` for migrations | Development builds |
| `ENV_FILE_PROD` | All `NEXT_PUBLIC_*` variables + `DATABASE_URL` for migrations | Production builds |
| `GCP_PROJECT_ID` | `storycare-478114` | GCP project ID |
| `WIF_PROVIDER` | Workload Identity Provider path | Authentication |
| `WIF_SERVICE_ACCOUNT` | Service account email | Authentication |

**Example ENV_FILE_DEV:**
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=storycare-dev.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=storycare-dev
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=storycare-dev.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=8113147247
NEXT_PUBLIC_FIREBASE_APP_ID=1:8113147247:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABC123
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
DATABASE_URL="postgresql://postgres:PASSWORD@127.0.0.1:5432/storycare_dev?sslmode=disable"
```

### GCP Secret Manager (Runtime)

These are loaded **at runtime** by Cloud Run. They're truly sensitive:

| Secret Name | Contents | Used For |
|------------|----------|----------|
| `DATABASE_URL_DEV` | Cloud SQL connection string (unix socket format) | Dev database connection |
| `DATABASE_URL` | Cloud SQL connection string (unix socket format) | Prod database connection |

**Example DATABASE_URL_DEV:**
```bash
postgresql://postgres:I|0PRO]3ya4NC_BY@/storycare_dev?host=/cloudsql/storycare-478114:us-central1:storycare-dev
```

---

## 🔄 How It Works

### During Docker Build (GitHub Actions):

```yaml
# 1. Load ENV_FILE from GitHub Secret
- name: Create .env file from secret
  run: |
    echo "${{ secrets.ENV_FILE_DEV }}" > .env.build

# 2. Build Docker image with ENV_FILE
- name: Build Docker image
  run: |
    docker build \
      --build-arg ENV_FILE="$(cat .env.build)" \
      -t gcr.io/PROJECT/SERVICE:TAG \
      .
```

**What happens:**
1. ✅ All `NEXT_PUBLIC_*` variables are baked into the image
2. ✅ `DATABASE_URL` is used during build for migrations
3. ✅ Image is built and pushed to Google Container Registry

### During Cloud Run Deployment:

```yaml
# Deploy with Cloud SQL connection and runtime secrets
- name: Deploy to Cloud Run
  run: |
    gcloud run deploy SERVICE \
      --image gcr.io/PROJECT/SERVICE:TAG \
      --add-cloudsql-instances=INSTANCE_NAME \
      --update-secrets=DATABASE_URL=DATABASE_URL_DEV:latest
```

**What happens:**
1. ✅ Cloud Run mounts the Cloud SQL unix socket
2. ✅ Cloud Run loads `DATABASE_URL` from GCP Secret Manager
3. ✅ App connects to database via unix socket (no proxy needed!)

---

## 🔐 Security Benefits

### Why This Approach?

**GitHub Secrets (ENV_FILE):**
- ✅ Public configs like Firebase API keys (safe to be in client bundle)
- ✅ Easy to update (just regenerate and update one secret)
- ✅ Version controlled in GitHub Actions
- ✅ No cost (GitHub Secrets are free)

**GCP Secret Manager (DATABASE_URL only):**
- ✅ Truly sensitive (database password)
- ✅ Loaded at runtime (not baked into image)
- ✅ Automatic rotation without rebuilding image
- ✅ Cloud Run native integration
- ✅ IAM-based access control

---

## 📝 Adding New Secrets

### For Public/Build-Time Variables (like NEXT_PUBLIC_*):

1. Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_NEW_API_URL=https://api.example.com
   ```

2. Regenerate ENV_FILE:
   ```bash
   ./create-env-for-github.sh
   ```

3. Update GitHub Secret:
   - Go to: https://github.com/akbar904/story-care/settings/secrets/actions
   - Update `ENV_FILE_DEV` or `ENV_FILE_PROD`
   - Paste new content from script output

4. Redeploy:
   ```bash
   git push origin dev  # Triggers rebuild with new ENV_FILE
   ```

### For Runtime Secrets (like API keys):

**Option 1: Add to GCP Secret Manager** (recommended for truly sensitive data)

```bash
echo -n "your-api-key" | gcloud secrets create NEW_API_KEY \
  --data-file=- \
  --project=storycare-478114
```

Then update workflow:
```yaml
--update-secrets=DATABASE_URL=DATABASE_URL_DEV:latest,NEW_API_KEY=NEW_API_KEY:latest
```

**Option 2: Add to ENV_FILE** (if it's not super sensitive)

Just add it to `.env.local` and regenerate `ENV_FILE_DEV/PROD`.

---

## 🚀 Deployment Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Push to GitHub (dev or main branch)                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. GitHub Actions Workflow Runs                            │
│    - Load ENV_FILE_DEV from GitHub Secrets                 │
│    - Build Docker image with ENV_FILE as build arg         │
│    - All NEXT_PUBLIC_* vars baked into image               │
│    - DATABASE_URL used for migrations during build         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Push Image to Google Container Registry                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Deploy to Cloud Run                                     │
│    - Mount Cloud SQL unix socket                           │
│    - Load DATABASE_URL from GCP Secret Manager             │
│    - Connect to database via unix socket                   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. App Running on Cloud Run                                │
│    - Uses NEXT_PUBLIC_* from build (baked in)              │
│    - Uses DATABASE_URL from runtime (GCP Secret Manager)   │
│    - Connects to Cloud SQL automatically                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Quick Reference

### Local Development
```bash
# .env.local
DATABASE_URL="postgresql://postgres:PASSWORD@127.0.0.1:5432/storycare_dev?sslmode=disable"
NEXT_PUBLIC_FIREBASE_API_KEY=...
# etc.
```

### GitHub Secrets (5 total)
```
ENV_FILE_DEV       → All NEXT_PUBLIC_* + DATABASE_URL (for build)
ENV_FILE_PROD      → All NEXT_PUBLIC_* + DATABASE_URL (for build)
GCP_PROJECT_ID     → storycare-478114
WIF_PROVIDER       → projects/832961952490/...
WIF_SERVICE_ACCOUNT → github-actions@storycare-478114.iam.gserviceaccount.com
```

### GCP Secret Manager (2 total)
```
DATABASE_URL_DEV → postgresql://postgres:PASSWORD@/storycare_dev?host=/cloudsql/...
DATABASE_URL     → postgresql://postgres:PASSWORD@/storycare_prod?host=/cloudsql/...
```

---

## ✅ Why This is Better

**Before:**
- ❌ 30+ individual GitHub Secrets to manage
- ❌ Hard to update multiple secrets at once
- ❌ Risk of forgetting to update one
- ❌ Lots of `--update-secrets` parameters

**After:**
- ✅ Just 5 GitHub Secrets (4 for WIF + 1 ENV_FILE per environment)
- ✅ Update all public configs by regenerating ENV_FILE
- ✅ Only 1 GCP secret per environment (DATABASE_URL)
- ✅ Clean, simple workflow files
- ✅ Separation of concerns (public vs private)

---

## 🔄 Migration Path (If Adding More Secrets Later)

If you need to add more runtime secrets (like API keys), you have options:

**Option 1: Keep in ENV_FILE** (easiest)
- Good for: API keys that aren't super sensitive
- Just add to `.env.local` and regenerate

**Option 2: Add to GCP Secret Manager** (most secure)
- Good for: Database credentials, private keys
- Create secret in GCP
- Add to `--update-secrets` in workflow

**Recommendation:**
- Start with ENV_FILE for everything except DATABASE_URL
- Move to GCP Secret Manager only if you need runtime secret rotation

---

**Last Updated:** 2025-11-27
**Repository:** akbar904/story-care
**Project:** storycare-478114
