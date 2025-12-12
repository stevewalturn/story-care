# 🚀 Cloud Run Video Processor Deployment Tutorial

Complete step-by-step guide to deploy the FFmpeg video processor to Google Cloud Run Jobs.

---

## 📋 Prerequisites

Before you begin, ensure you have:

1. **Google Cloud Platform Account**
   - Active GCP project: `storycare-478114`
   - Billing enabled on the project

2. **Required Tools Installed:**
   ```bash
   # Check if installed
   gcloud --version     # Google Cloud SDK
   docker --version     # Docker Desktop
   ```

3. **Install Missing Tools:**
   - **Google Cloud SDK**: https://cloud.google.com/sdk/docs/install
   - **Docker Desktop**: https://docs.docker.com/get-docker/

---

## 🔑 Step 1: Set Up GCP Secrets

Your Cloud Run Job needs access to these secrets:

### **Required Secrets:**
- `DATABASE_URL_DEV` - PostgreSQL connection string
- `GCS_PROJECT_ID` - Google Cloud project ID
- `GCS_CLIENT_EMAIL` - Service account email
- `GCS_PRIVATE_KEY` - Service account private key
- `GCS_BUCKET_NAME` - Storage bucket name

### **Create Secrets:**

```bash
# Authenticate with GCP
gcloud auth login

# Set your project
gcloud config set project storycare-478114

# Create DATABASE_URL secret
echo -n "postgresql://user:pass@host:5432/dbname" | \
  gcloud secrets create DATABASE_URL_DEV \
    --data-file=- \
    --replication-policy="automatic"

# Create GCS secrets
echo -n "storycare-478114" | \
  gcloud secrets create GCS_PROJECT_ID \
    --data-file=- \
    --replication-policy="automatic"

echo -n "your-service-account@storycare-478114.iam.gserviceaccount.com" | \
  gcloud secrets create GCS_CLIENT_EMAIL \
    --data-file=- \
    --replication-policy="automatic"

echo -n "-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n" | \
  gcloud secrets create GCS_PRIVATE_KEY \
    --data-file=- \
    --replication-policy="automatic"

echo -n "storycare-media-bucket" | \
  gcloud secrets create GCS_BUCKET_NAME \
    --data-file=- \
    --replication-policy="automatic"
```

### **Verify Secrets:**
```bash
gcloud secrets list
```

---

## 🚀 Step 2: Deploy Using Script (EASIEST METHOD)

### **Quick Deploy:**

```bash
# Make script executable
chmod +x scripts/deploy-video-processor.sh

# Run deployment
./scripts/deploy-video-processor.sh
```

### **What the Script Does:**
1. ✅ Checks prerequisites (gcloud, docker)
2. ✅ Builds Docker image with FFmpeg
3. ✅ Pushes to Google Container Registry (GCR)
4. ✅ Creates/updates Cloud Run Job
5. ✅ Configures resources (4GB RAM, 2 CPUs)
6. ✅ Links secrets
7. ✅ Sets 1-hour timeout

### **Expected Output:**
```
========================================
  Deployment Successful! 🎉
========================================

📝 Job Details:

   Job Name: storycare-video-processor
   Region: us-central1
   Memory: 4Gi
   CPU: 2
   Timeout: 3600s (1 hour)
   Max Retries: 3
```

---

## 🛠️ Step 3: Manual Deployment (Alternative)

If you prefer manual control:

### **3.1 Build Docker Image:**
```bash
cd /Users/lpt-799/Code/walturn/story-care

docker build \
  -f jobs/video-processor/Dockerfile \
  -t gcr.io/storycare-478114/storycare-video-processor:latest \
  .
```

### **3.2 Push to Google Container Registry:**
```bash
# Configure Docker auth
gcloud auth configure-docker gcr.io

# Push image
docker push gcr.io/storycare-478114/storycare-video-processor:latest
```

### **3.3 Create Cloud Run Job:**
```bash
gcloud run jobs create storycare-video-processor \
  --image gcr.io/storycare-478114/storycare-video-processor:latest \
  --region us-central1 \
  --project storycare-478114 \
  --memory 4Gi \
  --cpu 2 \
  --task-timeout 3600 \
  --max-retries 3 \
  --parallelism 1 \
  --tasks 1 \
  --set-env-vars NODE_ENV=production \
  --set-secrets DATABASE_URL=DATABASE_URL_DEV:latest \
  --set-secrets GCS_PROJECT_ID=GCS_PROJECT_ID:latest \
  --set-secrets GCS_CLIENT_EMAIL=GCS_CLIENT_EMAIL:latest \
  --set-secrets GCS_PRIVATE_KEY=GCS_PRIVATE_KEY:latest \
  --set-secrets GCS_BUCKET_NAME=GCS_BUCKET_NAME:latest
```

### **3.4 Update Existing Job:**
```bash
gcloud run jobs update storycare-video-processor \
  --image gcr.io/storycare-478114/storycare-video-processor:latest \
  --region us-central1 \
  --project storycare-478114
```

---

## 🤖 Step 4: Set Up GitHub Actions Auto-Deploy

Your repo already has GitHub Actions configured!

### **File:** `.github/workflows/deploy-video-processor.yml`

### **Triggers:**
- ✅ Push to `main` branch (when `jobs/video-processor/**` changes)
- ✅ Manual trigger via GitHub UI

### **Required GitHub Secrets:**

Go to: **GitHub Repo → Settings → Secrets and variables → Actions**

Add these secrets:

| Secret Name | Value | How to Get |
|------------|-------|-----------|
| `GCP_PROJECT_ID` | `storycare-478114` | Your GCP project ID |
| `GCP_SA_KEY` | `{ "type": "service_account", ... }` | Service account JSON key |

### **Get Service Account Key:**

```bash
# Create service account
gcloud iam service-accounts create cloud-run-deployer \
  --display-name="Cloud Run Deployer"

# Grant permissions
gcloud projects add-iam-policy-binding storycare-478114 \
  --member="serviceAccount:cloud-run-deployer@storycare-478114.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding storycare-478114 \
  --member="serviceAccount:cloud-run-deployer@storycare-478114.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Create and download key
gcloud iam service-accounts keys create key.json \
  --iam-account=cloud-run-deployer@storycare-478114.iam.gserviceaccount.com

# Copy content of key.json and add to GitHub secrets
cat key.json
```

### **Manual Trigger from GitHub:**
1. Go to **Actions** tab
2. Select **"Deploy Video Processor to Cloud Run"**
3. Click **"Run workflow"**
4. Select `main` branch
5. Click **"Run workflow"**

---

## ✅ Step 5: Verify Deployment

### **5.1 Check Job Status:**
```bash
gcloud run jobs describe storycare-video-processor \
  --region us-central1 \
  --project storycare-478114
```

### **5.2 Test Manual Execution:**
```bash
gcloud run jobs execute storycare-video-processor \
  --region us-central1 \
  --project storycare-478114 \
  --update-env-vars JOB_ID=test-job-123,SCENE_ID=test-scene-456
```

### **5.3 View Executions:**
```bash
gcloud run jobs executions list \
  --job=storycare-video-processor \
  --region=us-central1 \
  --project=storycare-478114
```

### **5.4 View Logs:**
```bash
# Get latest execution name
EXECUTION=$(gcloud run jobs executions list \
  --job=storycare-video-processor \
  --region=us-central1 \
  --limit=1 \
  --format="value(name)")

# View logs
gcloud run jobs executions logs read $EXECUTION \
  --job=storycare-video-processor \
  --region=us-central1 \
  --project=storycare-478114
```

---

## 🌐 Step 6: Configure Next.js App

### **6.1 Install Dependencies:**
```bash
npm install @google-cloud/run
```

### **6.2 Add Environment Variables to Vercel:**

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add:
```
GCP_PROJECT_ID=storycare-478114
GCP_REGION=us-central1
CLOUD_RUN_JOB_NAME=storycare-video-processor
GCP_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

### **6.3 Test from Local Dev:**

Create `.env.local`:
```bash
GCP_PROJECT_ID=storycare-478114
GCP_REGION=us-central1
CLOUD_RUN_JOB_NAME=storycare-video-processor
GCP_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

---

## 🧪 Step 7: Test End-to-End

### **7.1 From Next.js App:**

1. Go to `http://localhost:3000/scenes`
2. Create a scene with multiple clips
3. Click "Export" button
4. Should trigger async job and show progress

### **7.2 Monitor Progress:**

```bash
# Watch job executions in real-time
watch -n 2 'gcloud run jobs executions list \
  --job=storycare-video-processor \
  --region=us-central1 \
  --limit=5'
```

### **7.3 Check Database:**

```sql
SELECT
  id,
  job_type,
  status,
  progress,
  current_step,
  cloud_run_job_id,
  created_at
FROM video_processing_jobs
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🐛 Troubleshooting

### **Issue: "Permission denied" when pushing to GCR**

**Solution:**
```bash
gcloud auth configure-docker gcr.io
gcloud auth login
```

### **Issue: "Secret not found"**

**Solution:**
```bash
# List all secrets
gcloud secrets list

# Create missing secret
echo -n "YOUR_VALUE" | \
  gcloud secrets create SECRET_NAME \
    --data-file=- \
    --replication-policy="automatic"
```

### **Issue: Job fails immediately**

**Solution:**
```bash
# Check logs
gcloud run jobs executions logs read EXECUTION_NAME \
  --job=storycare-video-processor \
  --region=us-central1

# Common issues:
# - DATABASE_URL is incorrect
# - GCS credentials are invalid
# - FFmpeg command syntax error
```

### **Issue: Job times out**

**Solution:**
```bash
# Increase timeout (max 3600s = 1 hour)
gcloud run jobs update storycare-video-processor \
  --task-timeout 3600 \
  --region us-central1
```

### **Issue: Out of memory**

**Solution:**
```bash
# Increase memory (max 32Gi)
gcloud run jobs update storycare-video-processor \
  --memory 8Gi \
  --region us-central1
```

---

## 💰 Cost Estimation

### **Cloud Run Jobs Pricing:**
- **CPU**: $0.00002400 per vCPU-second
- **Memory**: $0.00000250 per GiB-second
- **Free tier**: 180,000 vCPU-seconds + 360,000 GiB-seconds per month

### **Example Video Assembly:**
- Duration: 5 minutes (300 seconds)
- CPU: 2 vCPUs
- Memory: 4 GiB
- **Cost**: ~$0.017 per execution

### **Monthly Cost Estimate:**
- 100 videos/month: **~$1.70**
- 500 videos/month: **~$8.50**
- 1000 videos/month: **~$17.00**

---

## 📚 Additional Resources

- **Cloud Run Jobs Docs**: https://cloud.google.com/run/docs/create-jobs
- **FFmpeg Documentation**: https://ffmpeg.org/documentation.html
- **Your Implementation Guide**: `CLOUD_RUN_JOBS_GUIDE.md`
- **Architecture Overview**: `ASYNC_VIDEO_PROCESSING.md`

---

## ✅ Deployment Checklist

- [ ] GCP project created and billing enabled
- [ ] Google Cloud SDK installed (`gcloud`)
- [ ] Docker installed and running
- [ ] GCP secrets created (DATABASE_URL, GCS_*, etc.)
- [ ] Cloud Run Job deployed (`./scripts/deploy-video-processor.sh`)
- [ ] GitHub Actions secrets configured
- [ ] Vercel environment variables set
- [ ] Test execution successful
- [ ] Logs visible in Cloud Console
- [ ] Next.js app updated to use `/assemble-async`

---

## 🎉 You're Done!

Your video processor is now running on Cloud Run with:
- ✅ **4GB RAM** + **2 CPUs** dedicated to FFmpeg
- ✅ **1-hour timeout** for long videos
- ✅ **Auto-scaling** to handle multiple jobs
- ✅ **Automatic retries** on failures
- ✅ **Real-time progress tracking**

**Next:** Update your UI to use the async endpoint! (See code changes below)
