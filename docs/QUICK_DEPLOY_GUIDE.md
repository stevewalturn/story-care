# 🚀 Quick Deploy Guide - Video Processor to Cloud Run

Simple deployment using GitHub Actions (same approach as main server deployment).

---

## ✅ What You Need

The video processor deployment now uses the **exact same approach as your main server**:
- ✅ Creates `.env.build` file from environment secret
- ✅ Passes it to Docker build as `--build-arg ENV_FILE`
- ✅ Bakes environment variables into the Docker image
- ✅ No GCP Secret Manager needed!
- ✅ Separate workflows for **DEV** and **PROD**

---

## 🔧 Required GitHub Secrets

### Development Secrets
| Secret Name | Description | Example Value |
|------------|-------------|-------|
| `ENV_FILE_DEV` | Your `.env.dev` file content | (full .env.dev content) |
| `GCP_PROJECT_ID_DEV` | GCP project ID for dev | `storycare-dev-479511` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER_DEV` | WIF provider URL | `projects/.../workloadIdentityPools/...` |
| `GCP_SERVICE_ACCOUNT_DEV` | Service account email | `github-actions@...iam.gserviceaccount.com` |

### Production Secrets
| Secret Name | Description | Example Value |
|------------|-------------|-------|
| `ENV_FILE_PROD` | Your `.env.production` file content | (full .env.production content) |
| `GCP_PROJECT_ID_PROD` | GCP project ID for prod | `storycare-478114` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER_PROD` | WIF provider URL | `projects/.../workloadIdentityPools/...` |
| `GCP_SERVICE_ACCOUNT_PROD` | Service account email | `github-actions@...iam.gserviceaccount.com` |

### Environment Variables & Cloud SQL Connection

The video processor job uses the **same Cloud SQL connection and Secret Manager setup** as your main server:

**Development:**
- Cloud SQL Instance: `storycare-dev-479511:us-central1:storycare-dev`
- Database URL: From Secret Manager → `DATABASE_URL_DEV`

**Production:**
- Cloud SQL Instance: `storycare-478114:us-central1:storycare-prod`
- Database URL: From Secret Manager → `DATABASE_URL_PROD`

Your `.env.dev` and `.env.production` files in `ENV_FILE_DEV` and `ENV_FILE_PROD` secrets should include:

```bash
# Cloud Run Job Configuration (for video assembly)
CLOUD_RUN_JOB_NAME=storycare-video-processor-dev  # or storycare-video-processor-prod
CLOUD_RUN_REGION=us-central1

# Google Cloud Storage (must match your GCP project)
GCS_PROJECT_ID=storycare-dev-479511  # or storycare-478114 for prod
GCS_CLIENT_EMAIL=your-service-account@...iam.gserviceaccount.com
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GCS_BUCKET_NAME=your-bucket-name

# Node environment
NODE_ENV=development  # or production

# Note: DATABASE_URL is injected by Cloud Run from Secret Manager
# You don't need to add it to ENV_FILE - it's handled automatically!
```

**If your main server is already deployed and working, the video processor will use the same database connection!** ✅

---

## 🚀 Deploy to Development

### Auto-Deploy (Recommended)
Push to `main` branch:
```bash
git add .
git commit -m "feat: update video processor"
git push origin main
```

Workflow triggers automatically when changes are detected in:
- `jobs/video-processor/**`
- `.github/workflows/deploy-video-processor-dev.yml`

### Manual Deploy
1. Go to **GitHub** → **Actions** tab
2. Select **"Deploy Video Processor to Cloud Run (Development)"**
3. Click **"Run workflow"** → Select `main` branch → Click **"Run workflow"**

### Result
- **Job Name:** `storycare-video-processor-dev`
- **Environment:** `development`
- **NODE_ENV:** `development`

---

## 🚀 Deploy to Production

### Auto-Deploy
Push to `production` branch:
```bash
git checkout production
git merge main
git push origin production
```

### Manual Deploy
1. Go to **GitHub** → **Actions** tab
2. Select **"Deploy Video Processor to Cloud Run (Production)"**
3. Click **"Run workflow"** → Select `production` branch → Click **"Run workflow"**

### Result
- **Job Name:** `storycare-video-processor-prod`
- **Environment:** `production`
- **NODE_ENV:** `production`

---

## 🔍 Monitor Deployment

### GitHub Actions
```
https://github.com/<your-org>/<your-repo>/actions
```

### Check Cloud Run Job Status

**Development:**
```bash
gcloud run jobs describe storycare-video-processor-dev \
  --region us-central1 \
  --project <GCP_PROJECT_ID_DEV>
```

**Production:**
```bash
gcloud run jobs describe storycare-video-processor-prod \
  --region us-central1 \
  --project <GCP_PROJECT_ID_PROD>
```

---

## 🧪 Test the Deployment

### 1. Test Manual Execution

**Development:**
```bash
gcloud run jobs execute storycare-video-processor-dev \
  --region us-central1 \
  --project <GCP_PROJECT_ID_DEV> \
  --update-env-vars JOB_ID=test-123,SCENE_ID=test-456
```

**Production:**
```bash
gcloud run jobs execute storycare-video-processor-prod \
  --region us-central1 \
  --project <GCP_PROJECT_ID_PROD> \
  --update-env-vars JOB_ID=test-123,SCENE_ID=test-456
```

### 2. View Execution Logs

**Development:**
```bash
# List recent executions
gcloud run jobs executions list \
  --job=storycare-video-processor-dev \
  --region=us-central1 \
  --project=<GCP_PROJECT_ID_DEV> \
  --limit=5

# View logs for latest execution
EXECUTION=$(gcloud run jobs executions list \
  --job=storycare-video-processor-dev \
  --region=us-central1 \
  --project=<GCP_PROJECT_ID_DEV> \
  --limit=1 \
  --format="value(name)")

gcloud run jobs executions logs read $EXECUTION \
  --job=storycare-video-processor-dev \
  --region=us-central1 \
  --project=<GCP_PROJECT_ID_DEV>
```

### 3. Test from Your App

**Development:**
```bash
npm run dev
open http://localhost:3000/scenes
```

**Production:**
```
https://your-production-domain.com/scenes
```

1. Create a scene with multiple clips
2. Click **"Export"** button
3. Watch the progress bar update in real-time:
   - "Video assembly started!"
   - "Downloading clips... 30%"
   - "Assembling video... 70%"
   - "Uploading to GCS... 95%"
   - "Video assembly completed!" 🎉

---

## 📝 What Changed

### New Workflow Files:

1. **`.github/workflows/deploy-video-processor-dev.yml`**
   - Triggers on push to `main` branch
   - Uses `ENV_FILE_DEV` secret
   - Uses `GCP_PROJECT_ID_DEV`, `GCP_WORKLOAD_IDENTITY_PROVIDER_DEV`, `GCP_SERVICE_ACCOUNT_DEV`
   - Deploys job: `storycare-video-processor-dev`
   - Sets `NODE_ENV=development`
   - **Connects to Cloud SQL**: `storycare-dev-479511:us-central1:storycare-dev`
   - **Injects DATABASE_URL** from Secret Manager: `DATABASE_URL_DEV`

2. **`.github/workflows/deploy-video-processor-prod.yml`**
   - Triggers on push to `production` branch
   - Uses `ENV_FILE_PROD` secret
   - Uses `GCP_PROJECT_ID_PROD`, `GCP_WORKLOAD_IDENTITY_PROVIDER_PROD`, `GCP_SERVICE_ACCOUNT_PROD`
   - Deploys job: `storycare-video-processor-prod`
   - Sets `NODE_ENV=production`
   - **Connects to Cloud SQL**: `storycare-478114:us-central1:storycare-prod`
   - **Injects DATABASE_URL** from Secret Manager: `DATABASE_URL_PROD`

### Updated Files:

1. **`jobs/video-processor/Dockerfile`**
   - ✅ Fixed: Removed `ffprobe` (included with `ffmpeg` package)
   - Added `ARG ENV_FILE` to accept build arg
   - Creates `/app/.env` file from ENV_FILE arg

2. **`src/app/(auth)/scenes/ScenesClient.tsx`**
   - Changed `/assemble` to `/assemble-async`
   - Added `useVideoJobPolling` hook
   - Added real-time progress bar UI

---

## ✅ Checklist

### Development
- [ ] `ENV_FILE_DEV` GitHub secret set (your `.env.dev` content)
- [ ] `GCP_PROJECT_ID_DEV` GitHub secret set
- [ ] `GCP_WORKLOAD_IDENTITY_PROVIDER_DEV` GitHub secret set
- [ ] `GCP_SERVICE_ACCOUNT_DEV` GitHub secret set
- [ ] Pushed to main branch
- [ ] Deployment successful (check GitHub Actions)
- [ ] Cloud Run Job `storycare-video-processor-dev` created
- [ ] Tested from `http://localhost:3000/scenes`

### Production
- [ ] `ENV_FILE_PROD` GitHub secret set (your `.env.production` content)
- [ ] `GCP_PROJECT_ID_PROD` GitHub secret set
- [ ] `GCP_WORKLOAD_IDENTITY_PROVIDER_PROD` GitHub secret set
- [ ] `GCP_SERVICE_ACCOUNT_PROD` GitHub secret set
- [ ] Pushed to production branch
- [ ] Deployment successful (check GitHub Actions)
- [ ] Cloud Run Job `storycare-video-processor-prod` created
- [ ] Tested from production URL

---

## 🐛 Troubleshooting

### "ffprobe (no such package)" error
✅ **FIXED** - `ffprobe` is now removed from Dockerfile (it's included with `ffmpeg`)

### "Permission denied" on GitHub Actions
- The service account should already have permissions from main server deployment
- If not, grant `roles/run.admin`:
  ```bash
  gcloud projects add-iam-policy-binding <PROJECT_ID> \
    --member="serviceAccount:<SERVICE_ACCOUNT_EMAIL>" \
    --role="roles/run.admin"
  ```

### Job fails with database error
- Check `DATABASE_URL` in `ENV_FILE_DEV` or `ENV_FILE_PROD` is correct
- For Cloud Run Jobs, use Cloud SQL connection (not localhost)

### ENV_FILE not found during build
- Verify `ENV_FILE_DEV` or `ENV_FILE_PROD` GitHub secret is set
- Check GitHub Actions logs for "Create .env file from secret" step

### Wrong environment deployed
- **Dev deploys to main branch** → uses `ENV_FILE_DEV`
- **Prod deploys to production branch** → uses `ENV_FILE_PROD`
- Check which branch you pushed to

### Job not found error (Resource does not exist)
- Ensure `CLOUD_RUN_JOB_NAME` in your ENV_FILE matches the deployed job name
- Dev: `CLOUD_RUN_JOB_NAME=storycare-video-processor-dev`
- Prod: `CLOUD_RUN_JOB_NAME=storycare-video-processor-prod`
- If not set, the API will auto-detect based on `NODE_ENV`

---

## 💡 Key Benefits

✅ **Separate dev/prod** - Independent deployments with different configs
✅ **Same as main server** - Uses identical deployment approach
✅ **No GCP Secrets** - Everything in GitHub secrets
✅ **Simple updates** - Just update `ENV_FILE_DEV` or `ENV_FILE_PROD` in GitHub
✅ **Secure** - Environment variables baked into image at build time
✅ **Easy debugging** - Same workflow you already know
✅ **Fixed ffprobe error** - Dockerfile no longer includes invalid package

---

## 🎉 That's It!

The video processor deployment now works **exactly like your main server deployment** with separate workflows for dev and prod!

**Development:** Push to `main` → Auto-deploys with `ENV_FILE_DEV`
**Production:** Push to `production` → Auto-deploys with `ENV_FILE_PROD`

**Next:** Test the `/scenes` page and watch the progress bar in action! 🚀
