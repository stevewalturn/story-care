# 🚀 Deploy Cloud Run Video Processor Using ENV_FILE_DEV

Simple deployment using GitHub Actions with `ENV_FILE_DEV` secret (no GCP Secret Manager needed!)

---

## ✅ What Was Changed

The GitHub Actions workflow now:
- ✅ Reads environment variables from `ENV_FILE_DEV` GitHub secret
- ✅ Parses `.env` format automatically
- ✅ Passes vars directly to Cloud Run Job (no GCP Secret Manager)
- ✅ Handles multiline values (like `GCS_PRIVATE_KEY`)

**File modified:** `.github/workflows/deploy-video-processor.yml`

---

## 📝 Step 1: Add ENV_FILE_DEV to GitHub Secrets

### Copy Your `.env.local` Content

Your `.env.local` file already has everything needed:

```bash
DATABASE_URL="postgresql://postgres:I|0PRO]3ya4NC_BY@127.0.0.1:5432/storycare_dev?sslmode=disable"
GCS_PROJECT_ID=storycare-dev-479511
GCS_BUCKET_NAME=storycare-dev-media-192837
GCS_CLIENT_EMAIL=storycare-storage-admin@storycare-dev-479511.iam.gserviceaccount.com
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...END PRIVATE KEY-----\n"
```

### Add to GitHub Secrets

1. **Go to your GitHub repo**
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret**
4. Name: `ENV_FILE_DEV`
5. Value: **Paste your entire `.env.local` content** (or the variables shown above)
6. Click **Add secret**

---

## 🚀 Step 2: Deploy

### Option A: Push to Main (Auto-Deploy)

```bash
git add .
git commit -m "feat: use ENV_FILE_DEV for Cloud Run deployment"
git push origin main
```

The workflow will automatically trigger when it detects changes to:
- `jobs/video-processor/**`
- `.github/workflows/deploy-video-processor.yml`

### Option B: Manual Trigger from GitHub

1. Go to **GitHub** → **Actions** tab
2. Select **"Deploy Video Processor to Cloud Run"** workflow
3. Click **"Run workflow"** dropdown
4. Select `main` branch
5. Click **"Run workflow"** button

---

## 🔍 Step 3: Monitor Deployment

### Watch GitHub Actions

```
https://github.com/<your-org>/<your-repo>/actions
```

You'll see:
- ✅ Checkout code
- ✅ Authenticate to Google Cloud
- ✅ Build Docker image
- ✅ Push to GCR
- ✅ **Parse Environment Variables from ENV_FILE_DEV** ← New!
- ✅ Create or Update Cloud Run Job
- ✅ Verify Job Deployment

### Check Cloud Run Job

```bash
gcloud run jobs describe storycare-video-processor \
  --region us-central1 \
  --project storycare-478114
```

---

## 🧪 Step 4: Test the Deployment

### Test Manual Execution

```bash
gcloud run jobs execute storycare-video-processor \
  --region us-central1 \
  --project storycare-478114 \
  --update-env-vars JOB_ID=test-123,SCENE_ID=test-scene-456
```

### View Logs

```bash
# List recent executions
gcloud run jobs executions list \
  --job=storycare-video-processor \
  --region=us-central1 \
  --limit=5

# View logs for latest execution
EXECUTION=$(gcloud run jobs executions list \
  --job=storycare-video-processor \
  --region=us-central1 \
  --limit=1 \
  --format="value(name)")

gcloud run jobs executions logs read $EXECUTION \
  --job=storycare-video-processor \
  --region=us-central1
```

### Test from Your App

```bash
npm run dev
open http://localhost:3000/scenes
```

1. Create a scene with clips
2. Click "Export" button
3. You should see:
   - "Video assembly started!"
   - Progress bar: "Downloading clips... 30%"
   - Progress bar: "Assembling video... 70%"
   - "Video assembly completed!"

---

## 📋 Required GitHub Secrets

| Secret Name | Description | How to Get |
|------------|-------------|-----------|
| `ENV_FILE_DEV` | **Your `.env.local` file contents** | Copy from `/Users/lpt-799/Code/walturn/story-care/.env.local` |
| `GCP_PROJECT_ID` | `storycare-478114` | Your GCP project ID |
| `WIF_PROVIDER` | Workload Identity Federation provider URL | See setup below |
| `WIF_SERVICE_ACCOUNT` | Service account email | See setup below |

---

## 🔧 One-Time Setup: Workload Identity Federation (WIF)

If you don't have WIF set up yet, run these commands:

```bash
# 1. Enable APIs
gcloud services enable iamcredentials.googleapis.com run.googleapis.com \
  --project=storycare-478114

# 2. Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions" \
  --project=storycare-478114

# 3. Grant permissions
gcloud projects add-iam-policy-binding storycare-478114 \
  --member="serviceAccount:github-actions@storycare-478114.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding storycare-478114 \
  --member="serviceAccount:github-actions@storycare-478114.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# 4. Get your project number
PROJECT_NUMBER=$(gcloud projects describe storycare-478114 --format="value(projectNumber)")
echo "Project Number: $PROJECT_NUMBER"

# 5. Create Workload Identity Pool
gcloud iam workload-identity-pools create github-pool \
  --location="global" \
  --project=storycare-478114

# 6. Create WIF Provider
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --project=storycare-478114

# 7. Allow GitHub repo to impersonate service account
# Replace YOUR_GITHUB_ORG and YOUR_GITHUB_REPO with your actual values
gcloud iam service-accounts add-iam-policy-binding \
  github-actions@storycare-478114.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/YOUR_GITHUB_ORG/YOUR_GITHUB_REPO" \
  --project=storycare-478114

# 8. Get WIF provider URL (add this to GitHub secrets as WIF_PROVIDER)
gcloud iam workload-identity-pools providers describe github-provider \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --format="value(name)" \
  --project=storycare-478114

# 9. Get service account email (add this to GitHub secrets as WIF_SERVICE_ACCOUNT)
echo "github-actions@storycare-478114.iam.gserviceaccount.com"
```

---

## ✅ Quick Checklist

- [ ] `ENV_FILE_DEV` added to GitHub secrets (paste your `.env.local`)
- [ ] `GCP_PROJECT_ID` added to GitHub secrets (`storycare-478114`)
- [ ] `WIF_PROVIDER` added to GitHub secrets (from step 8 above)
- [ ] `WIF_SERVICE_ACCOUNT` added to GitHub secrets (from step 9 above)
- [ ] Pushed to main or triggered workflow manually
- [ ] Deployment successful (check GitHub Actions logs)
- [ ] Cloud Run Job created/updated (check with `gcloud run jobs describe`)
- [ ] Tested manual execution (`gcloud run jobs execute`)
- [ ] Tested from app (`http://localhost:3000/scenes`)

---

## 🎉 Benefits of This Approach

✅ **No GCP Secret Manager needed** - Uses GitHub secrets only
✅ **Simple updates** - Just update `ENV_FILE_DEV` in GitHub
✅ **Version controlled** - `.env` format you already use
✅ **Easy to debug** - All vars visible in workflow logs (masked)
✅ **Fast deployment** - No secret creation/management overhead

---

## 🐛 Troubleshooting

### "Failed to parse ENV_FILE_DEV"
- Make sure `ENV_FILE_DEV` secret contains valid `.env` format
- Each line should be: `KEY=value` or `KEY="value"`
- Multiline values (like private keys) should use `\n` for newlines

### "Permission denied" on GitHub Actions
- Verify WIF setup completed successfully
- Check service account has correct roles (`run.admin`, `storage.admin`)
- Ensure GitHub repo is correctly specified in step 7

### Job fails with database error
- Check `DATABASE_URL` in `ENV_FILE_DEV` is correct
- For Cloud Run, use Cloud SQL connection string (not localhost)
- Example: `postgresql://user:pass@/dbname?host=/cloudsql/project:region:instance`

### Private key not working
- Ensure `GCS_PRIVATE_KEY` includes full key with `\n` preserved
- Should start with `-----BEGIN PRIVATE KEY-----\n`
- Should end with `\n-----END PRIVATE KEY-----\n`

---

## 🎯 That's It!

No GCP Secret Manager setup needed. Just:
1. Add `ENV_FILE_DEV` to GitHub secrets (your `.env.local` content)
2. Push to main or trigger workflow
3. Done! 🚀

The Cloud Run Job will receive all environment variables directly from your GitHub secret.
