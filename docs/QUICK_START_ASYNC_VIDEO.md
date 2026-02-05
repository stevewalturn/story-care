# Quick Start: Async Video Processing

## What Was Done

I've converted your synchronous FFmpeg video processing into an async workflow using Cloud Run. Here's what's new:

### ✅ New Files Created

1. **Database Migration**: `migrations/0016_create_video_processing_jobs.sql`
2. **Cloud Run Service**: `jobs/video-processor/` (Dockerfile + server.js)
3. **API Endpoints**:
   - `/api/scenes/[id]/assemble-async` - Trigger async assembly
   - `/api/video-jobs/[id]` - Get job status
   - `/api/video-jobs/[id]/webhook` - Receive updates from Cloud Run
4. **React Components**:
   - `src/hooks/useVideoJobPolling.ts` - Hook for polling job status
   - `src/components/scenes/VideoProcessingStatus.tsx` - UI component
5. **GitHub Workflow**: `.github/workflows/deploy-video-processor.yml`
6. **Documentation**: `ASYNC_VIDEO_PROCESSING.md` (comprehensive guide)

### ✅ Files Modified

1. **src/models/Schema.ts** - Added `videoProcessingJobsSchema`
2. **src/libs/Env.ts** - Added `VIDEO_PROCESSOR_URL` and `WEBHOOK_SECRET`

## How to Deploy

### Step 1: Run Database Migration

```bash
# Start Cloud SQL Proxy (if not already running)
cloud-sql-proxy storycare-478114:us-central1:storycare-dev

# In another terminal, run migration
npm run db:migrate

# Verify table created
psql "postgresql://storycare_admin:password@127.0.0.1:5432/storycare_dev" \
  -c "\d video_processing_jobs"
```

### Step 2: Create Webhook Secret

```bash
# Generate secret
WEBHOOK_SECRET=$(openssl rand -hex 32)
echo "Generated secret: $WEBHOOK_SECRET"

# Add to Google Secret Manager
echo -n "$WEBHOOK_SECRET" | \
  gcloud secrets create WEBHOOK_SECRET \
    --data-file=- \
    --replication-policy="automatic" \
    --project=storycare-478114

# Grant access to Cloud Run
gcloud secrets add-iam-policy-binding WEBHOOK_SECRET \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=storycare-478114
```

### Step 3: Deploy Video Processor to Cloud Run

#### Option A: GitHub Actions (Recommended)

```bash
# Commit and push
git add .
git commit -m "feat: add async video processing with Cloud Run"
git push origin main

# Workflow will auto-deploy to Cloud Run
# Check status: GitHub → Actions → Deploy Video Processor
```

#### Option B: Manual Deploy

```bash
# Build and push
docker build -f jobs/video-processor/Dockerfile \
  -t gcr.io/storycare-478114/storycare-video-processor:latest .

docker push gcr.io/storycare-478114/storycare-video-processor:latest

# Deploy
gcloud run deploy storycare-video-processor \
  --image gcr.io/storycare-478114/storycare-video-processor:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 4Gi \
  --cpu 2 \
  --timeout 900 \
  --max-instances 10 \
  --min-instances 0 \
  --port 8080 \
  --set-env-vars NODE_ENV=production \
  --update-secrets WEBHOOK_SECRET=WEBHOOK_SECRET:latest \
  --project=storycare-478114

# Get URL
VIDEO_PROCESSOR_URL=$(gcloud run services describe storycare-video-processor \
  --region us-central1 \
  --format 'value(status.url)' \
  --project=storycare-478114)

echo "Video Processor URL: $VIDEO_PROCESSOR_URL"
```

### Step 4: Update Main App Environment

```bash
# Update Cloud Run service
gcloud run services update storycare-app-dev \
  --region us-central1 \
  --set-env-vars VIDEO_PROCESSOR_URL=$VIDEO_PROCESSOR_URL \
  --update-secrets WEBHOOK_SECRET=WEBHOOK_SECRET:latest \
  --project=storycare-478114

# For local development, add to .env.local
echo "VIDEO_PROCESSOR_URL=$VIDEO_PROCESSOR_URL" >> .env.local
echo "WEBHOOK_SECRET=$WEBHOOK_SECRET" >> .env.local
```

### Step 5: Verify

```bash
# Test health
curl $VIDEO_PROCESSOR_URL/health

# Expected response:
# {
#   "status": "healthy",
#   "service": "video-processor",
#   "ffmpeg": true,
#   "timestamp": "2025-01-15T..."
# }
```

## How to Use

### Frontend Integration

Replace your current scene assembly trigger with:

```tsx
// Old (synchronous - blocks for up to 60 seconds)
const handleAssemble = async () => {
  const response = await fetch(`/api/scenes/${sceneId}/assemble`, {
    method: 'POST'
  });
  const data = await response.json();
  setVideoUrl(data.assembledVideoUrl);
};

// New (asynchronous - returns immediately)
const handleAssemble = async () => {
  const response = await fetch(`/api/scenes/${sceneId}/assemble-async`, {
    method: 'POST'
  });
  const data = await response.json();
  // Job is now processing in the background
  // Use VideoProcessingStatus component to show progress
};
```

### Add Status Component

```tsx
import { VideoProcessingStatus } from '@/components/scenes/VideoProcessingStatus';

function ScenePage({ sceneId }: { sceneId: string }) {
  return (
    <div>
      {/* Show real-time processing status */}
      <VideoProcessingStatus
        sceneId={sceneId}
        onComplete={(videoUrl) => {
          console.log('Video ready:', videoUrl);
          toast.success('Scene assembled!');
        }}
        onError={(error) => {
          toast.error('Assembly failed');
        }}
      />
    </div>
  );
}
```

## Testing Locally

```bash
# Terminal 1: Start video processor
cd jobs/video-processor
PORT=8080 WEBHOOK_SECRET=test-secret node server.js

# Terminal 2: Start main app with local config
echo "VIDEO_PROCESSOR_URL=http://localhost:8080" >> .env.local
echo "WEBHOOK_SECRET=test-secret" >> .env.local
npm run dev

# Terminal 3: Test assembly
curl -X POST http://localhost:3000/api/scenes/YOUR_SCENE_ID/assemble-async

# Check status
curl http://localhost:3000/api/scenes/YOUR_SCENE_ID/assemble-async
```

## Monitoring

### View Logs

```bash
# Video processor logs
gcloud run services logs tail storycare-video-processor \
  --region us-central1 \
  --project=storycare-478114

# Main app logs
gcloud run services logs tail storycare-app-dev \
  --region us-central1 \
  --project=storycare-478114
```

### Database Queries

```sql
-- Active jobs
SELECT id, scene_id, status, progress, current_step
FROM video_processing_jobs
WHERE status IN ('pending', 'processing')
ORDER BY created_at DESC;

-- Recent completed jobs
SELECT id, scene_id, duration_seconds, completed_at
FROM video_processing_jobs
WHERE status = 'completed'
ORDER BY completed_at DESC
LIMIT 10;

-- Failed jobs
SELECT id, scene_id, error_message, created_at
FROM video_processing_jobs
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;
```

## Benefits

✅ **No More Timeouts**: 15-minute timeout vs 60-second limit
✅ **Better UX**: Users see progress instead of waiting
✅ **Scalability**: Process multiple videos concurrently
✅ **Cost-Efficient**: Pay only when processing (auto-scales to zero)
✅ **Reliability**: Persistent job tracking survives restarts

## Rollback Plan

If issues arise, you can quickly rollback:

```bash
# Disable async processing in frontend
# Change endpoint back to /assemble instead of /assemble-async

# Or keep both endpoints and use feature flag
export NEXT_PUBLIC_USE_ASYNC_PROCESSING=false
```

The old synchronous endpoint (`/api/scenes/[id]/assemble`) still works.

## Next Steps

1. ✅ Deploy to Cloud Run (follow steps above)
2. ✅ Update frontend to use async endpoint
3. ✅ Test with a real scene
4. 📊 Monitor performance and costs
5. 🎯 Gradually migrate all scenes to async processing

## Troubleshooting

**Problem**: Job stuck in "pending"
**Solution**: Check Cloud Run service is running and VIDEO_PROCESSOR_URL is set correctly

**Problem**: Webhook not received
**Solution**: Verify WEBHOOK_SECRET matches between services

**Problem**: FFmpeg errors
**Solution**: Check Cloud Run logs for detailed FFmpeg output

---

For detailed documentation, see `ASYNC_VIDEO_PROCESSING.md`

**Questions?** Check the comprehensive guide or Cloud Run logs for debugging.
