# Cloud Run Jobs for Async Video Processing

## Overview

This implementation uses **Cloud Run Jobs** (not Services) for async video processing. This is the optimal architecture for batch video assembly tasks.

## Why Cloud Run Jobs?

| Feature | Cloud Run Jobs ✅ | Cloud Run Services |
|---------|------------------|-------------------|
| **Cost** | Only pay during execution | Pay for idle time if min-instances > 0 |
| **Timeout** | Up to 24 hours | Up to 60 minutes |
| **Architecture** | One-time execution | Always-on HTTP server |
| **Triggering** | Cloud Run Jobs API | HTTP POST request |
| **Webhooks** | Not needed (updates DB directly) | Required for status updates |
| **Best for** | Batch processing, async tasks | APIs, real-time webhooks |

##Architecture

```
Frontend (Scenes Page)
   ↓
Main App API (/api/scenes/[id]/assemble-async)
   ↓ Creates job in DB
   ↓ Triggers Cloud Run Job via Jobs API
   ↓
Cloud Run Job Execution
   ↓ Reads env vars (JOB_ID, SCENE_ID, INPUT_DATA)
   ↓ Processes video with FFmpeg
   ↓ Updates DB directly
   ↓ Uploads to GCS
   ↓ Exits
   ↓
Frontend polls /api/video-jobs/[id]
   ↓ Shows progress
   ↓ Displays video when complete
```

## Key Files

1. **`jobs/video-processor/execute.js`** - Job executor script (replaces HTTP server)
2. **`jobs/video-processor/Dockerfile`** - Container definition
3. **`src/app/api/scenes/[id]/assemble-async/route.ts`** - Triggers job via Cloud Run Jobs API
4. **`.github/workflows/deploy-video-processor.yml`** - Deploys as Cloud Run Job

## Setup & Deployment

### Prerequisites

1. **Google Cloud Project**: storycare-478114
2. **Required Secrets in Secret Manager**:
   - `DATABASE_URL_DEV` - PostgreSQL connection string
   - `GCS_PROJECT_ID`, `GCS_CLIENT_EMAIL`, `GCS_PRIVATE_KEY` - GCS credentials
   - `GCS_BUCKET_NAME` - Bucket for videos

### Step 1: Install Dependencies

```bash
# Install Google Cloud Run SDK
npm install @google-cloud/run
```

### Step 2: Deploy Cloud Run Job

#### Option A: GitHub Actions (Recommended)

```bash
git add .
git commit -m "feat: convert to Cloud Run Jobs"
git push origin main

# Workflow auto-deploys the job
# Check: GitHub → Actions → Deploy Video Processor
```

#### Option B: Manual Deployment

```bash
./scripts/deploy-video-processor.sh
```

#### Option C: gcloud CLI

```bash
# Build and push image
docker build -f jobs/video-processor/Dockerfile \
  -t gcr.io/storycare-478114/storycare-video-processor:latest .

docker push gcr.io/storycare-478114/storycare-video-processor:latest

# Create Cloud Run Job
gcloud run jobs create storycare-video-processor \
  --image gcr.io/storycare-478114/storycare-video-processor:latest \
  --region us-central1 \
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
  --set-secrets GCS_BUCKET_NAME=GCS_BUCKET_NAME:latest \
  --project storycare-478114
```

### Step 3: Verify Deployment

```bash
# Check job exists
gcloud run jobs describe storycare-video-processor \
  --region us-central1 \
  --project storycare-478114

# Expected output:
# ✅ Job ready
# ✅ Image: gcr.io/storycare-478114/storycare-video-processor:latest
# ✅ Memory: 4Gi, CPU: 2
# ✅ Timeout: 3600s
```

## How It Works

### 1. Frontend Triggers Assembly

```tsx
const response = await fetch(`/api/scenes/${sceneId}/assemble-async`, {
  method: 'POST'
});

const { jobId, executionName } = await response.json();
console.log('Job triggered:', executionName);
```

### 2. API Creates Job Record & Triggers Cloud Run Job

```typescript
// src/app/api/scenes/[id]/assemble-async/route.ts

import { JobsClient } from '@google-cloud/run').v2;

const client = new JobsClient();

// Execute job with environment variables
const [operation] = await client.runJob({
  name: 'projects/storycare-478114/locations/us-central1/jobs/storycare-video-processor',
  overrides: {
    containerOverrides: [{
      env: [
        { name: 'JOB_ID', value: job.id },
        { name: 'SCENE_ID', value: sceneId },
        { name: 'INPUT_DATA', value: JSON.stringify(inputData) },
      ],
    }],
  },
});
```

### 3. Job Executes (jobs/video-processor/execute.js)

```javascript
// Read environment variables
const jobId = process.env.JOB_ID;
const sceneId = process.env.SCENE_ID;
const inputData = JSON.parse(process.env.INPUT_DATA);

// Process video with FFmpeg
// Download clips → Assemble → Upload to GCS

// Update database directly (no webhook needed)
await db.update(videoProcessingJobs)
  .set({ status: 'completed', outputUrl, thumbnailUrl })
  .where(eq(videoProcessingJobs.id, jobId));

// Exit
process.exit(0);
```

### 4. Frontend Polls for Updates

```tsx
// Polls /api/video-jobs/[jobId] every 2 seconds
const { job, isCompleted } = useVideoJobPolling({
  jobId,
  pollInterval: 2000,
});

if (isCompleted) {
  console.log('Video ready:', job.outputUrl);
}
```

## Monitoring

### View Job Executions

```bash
# List all executions
gcloud run jobs executions list \
  --job=storycare-video-processor \
  --region=us-central1 \
  --project=storycare-478114

# Output:
# EXECUTION_NAME                              STATUS    STARTED              COMPLETED
# storycare-video-processor-abc123            Succeeded 2025-01-15 10:30:00  2025-01-15 10:31:45
```

### View Logs for Specific Execution

```bash
# Get execution name from list above
gcloud run jobs executions logs read storycare-video-processor-abc123 \
  --job=storycare-video-processor \
  --region=us-central1 \
  --project=storycare-478114
```

### View All Job Logs

```bash
gcloud logging read \
  "resource.type=cloud_run_job AND resource.labels.job_name=storycare-video-processor" \
  --limit=50 \
  --project=storycare-478114
```

### Database Queries

```sql
-- Active jobs
SELECT id, scene_id, status, progress, cloud_run_job_id, created_at
FROM video_processing_jobs
WHERE status IN ('pending', 'processing')
ORDER BY created_at DESC;

-- Recently completed jobs
SELECT id, scene_id, duration_seconds, completed_at
FROM video_processing_jobs
WHERE status = 'completed'
ORDER BY completed_at DESC
LIMIT 10;

-- Failed jobs
SELECT id, scene_id, error_message, cloud_run_job_id
FROM video_processing_jobs
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;
```

## Testing

### Manual Job Execution

```bash
# Execute job manually with test data
gcloud run jobs execute storycare-video-processor \
  --region us-central1 \
  --project storycare-478114 \
  --update-env-vars JOB_ID=test-job-123,SCENE_ID=test-scene-456,INPUT_DATA='{"clips":[],"audioTracks":[]}'

# Monitor execution
gcloud run jobs executions logs tail storycare-video-processor \
  --region us-central1 \
  --project=storycare-478114
```

### End-to-End Test

1. Create a scene with clips in UI
2. Click "Assemble Scene (Async)"
3. Observe job creation in database
4. Monitor Cloud Run execution logs
5. Verify video appears when complete

## Cost Estimate

**Cloud Run Jobs Pricing**:
- CPU: $0.00002400/vCPU-second
- Memory: $0.00000250/GiB-second
- Requests: $0.40/million

**Example** (45-second video assembly):
- CPU: 45s × 2 vCPU × $0.000024 = $0.00216
- Memory: 45s × 4 GiB × $0.0000025 = $0.00045
- **Total per job**: ~$0.0026 (0.26 cents)

**Monthly** (1000 videos):
- Processing: $2.60
- Storage (GCS): ~$2.00
- **Total**: ~$5/month

**Compared to Cloud Run Services**:
- Service with min-instances=0: Same cost
- Service with min-instances=1: +$40/month for idle time
- **Jobs are cheaper!** ✅

## Troubleshooting

### Job Stuck in "Pending"

**Cause**: Job not triggered or API call failed

**Solution**:
```bash
# Check if job exists
gcloud run jobs describe storycare-video-processor \
  --region us-central1 \
  --project storycare-478114

# Check API logs
gcloud run services logs tail storycare-app-dev \
  --region us-central1 \
  --project storycare-478114 \
  --filter="assemble-async"
```

### Job Fails Immediately

**Cause**: Missing environment variables or invalid input data

**Solution**:
```bash
# View execution logs
gcloud run jobs executions logs read [EXECUTION_NAME] \
  --job=storycare-video-processor \
  --region=us-central1 \
  --project=storycare-478114

# Check for errors like:
# ❌ Missing required environment variable: DATABASE_URL
```

### Database Not Updating

**Cause**: Job can't connect to Cloud SQL

**Solution**:
```bash
# Verify DATABASE_URL secret exists
gcloud secrets describe DATABASE_URL_DEV --project=storycare-478114

# Check Cloud SQL connection string format
# Should be: postgresql://user:pass@/db?host=/cloudsql/PROJECT:REGION:INSTANCE
```

## Differences from Cloud Run Services

| Aspect | Cloud Run Jobs (Current) | Cloud Run Services (Old) |
|--------|--------------------------|--------------------------|
| **Trigger** | `client.runJob()` API call | `fetch(serviceUrl)` HTTP POST |
| **Status Updates** | Direct database updates | Webhook callbacks |
| **Endpoint** | No HTTP endpoint | `https://...run.app` URL |
| **Monitoring** | `gcloud run jobs executions list` | `gcloud run services logs tail` |
| **Environment** | Per-execution env vars | Service-level env vars |
| **Scaling** | 1 task per job | Multiple concurrent requests |
| **Cost** | Only during execution | Charges for idle if min-instances > 0 |

## Migration Checklist

- [x] Replaced HTTP server with job executor
- [x] Updated Dockerfile to run `execute.js`
- [x] Updated API to use Cloud Run Jobs API
- [x] Removed webhook endpoint
- [x] Updated GitHub Actions workflow
- [x] Updated deployment script
- [ ] Install `@google-cloud/run` SDK: `npm install @google-cloud/run`
- [ ] Deploy Cloud Run Job
- [ ] Test manual execution
- [ ] Update environment secrets in Secret Manager
- [ ] Test end-to-end with real scene

## Next Steps

1. **Deploy the job**: Run `./scripts/deploy-video-processor.sh`
2. **Install SDK**: `npm install @google-cloud/run`
3. **Test manually**: Execute job with test data
4. **Integrate frontend**: Update scenes page to use async endpoint
5. **Monitor**: Watch executions and logs

---

**Questions?** Check `ASYNC_VIDEO_PROCESSING.md` for more details or view Cloud Run Jobs documentation.
