# Async Video Processing with Cloud Run

## Overview

This document describes the async video processing system for StoryCare's scene assembly feature. The system offloads long-running FFmpeg video assembly jobs to a dedicated Cloud Run service, providing:

- **Scalability**: Process multiple videos concurrently
- **Reliability**: Job tracking with automatic retries
- **Performance**: 15-minute timeout (vs 60s on main app)
- **Cost Efficiency**: Pay-per-use with auto-scaling to zero

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────────┐
│                 │         │                  │         │                     │
│  Frontend       │────1───▶│  Main App        │────2───▶│  Cloud Run          │
│  (Scenes Page)  │         │  (Next.js)       │         │  (Video Processor)  │
│                 │         │                  │         │                     │
└─────────────────┘         └──────────────────┘         └─────────────────────┘
        │                           │                              │
        │                           │                              │
        │        3. Poll            │     4. Webhook              │
        │        Status             │     Updates                 │
        │                           │                              │
        └───────────────────────────┴──────────────────────────────┘
                                    │
                                    ▼
                           ┌──────────────────┐
                           │                  │
                           │  PostgreSQL DB   │
                           │  (Job Tracking)  │
                           │                  │
                           └──────────────────┘
```

### Flow:

1. **Frontend triggers job**: User clicks "Assemble Scene" → POST to `/api/scenes/[id]/assemble-async`
2. **Main app creates job**:
   - Insert row in `video_processing_jobs` table
   - Update scene status to `processing`
   - Trigger Cloud Run service via HTTP POST
3. **Cloud Run processes video**:
   - Download clips from GCS (via presigned URLs)
   - Assemble video with FFmpeg
   - Upload result to GCS
   - Send webhook updates to main app
4. **Frontend polls for updates**:
   - Poll `/api/video-jobs/[jobId]` every 2 seconds
   - Show progress bar with current step
   - Display video when complete

## Database Schema

### `video_processing_jobs` Table

```sql
CREATE TABLE video_processing_jobs (
  id UUID PRIMARY KEY,

  -- Job metadata
  job_type job_type NOT NULL,  -- 'scene_assembly', 'video_generation', 'transcoding'
  status job_status NOT NULL DEFAULT 'pending',  -- 'pending', 'processing', 'completed', 'failed'

  -- Resource references
  scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,
  media_id UUID REFERENCES media_library(id) ON DELETE SET NULL,

  -- Progress tracking
  progress INTEGER DEFAULT 0 NOT NULL,  -- 0-100
  current_step VARCHAR(255),  -- e.g., "Downloading clips", "Encoding video"

  -- Input/Output
  input_data JSONB,  -- Clips, audio tracks, settings
  output_url TEXT,  -- Final video URL in GCS
  thumbnail_url TEXT,

  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Cloud Run tracking
  cloud_run_job_id VARCHAR(255),
  cloud_run_log_url TEXT,

  -- Performance metrics
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_seconds INTEGER,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### 1. Create Async Job
```http
POST /api/scenes/[sceneId]/assemble-async
Content-Type: application/json

Response (202 Accepted):
{
  "success": true,
  "jobId": "uuid",
  "sceneId": "uuid",
  "status": "processing",
  "message": "Video processing job created and triggered"
}
```

### 2. Check Job Status
```http
GET /api/scenes/[sceneId]/assemble-async

Response (200 OK):
{
  "jobId": "uuid",
  "sceneId": "uuid",
  "status": "processing",
  "progress": 75,
  "currentStep": "Merging audio tracks",
  "startedAt": "2025-01-15T10:30:00Z",
  "assembledVideoUrl": null,
  "thumbnailUrl": null
}
```

### 3. Get Job by ID
```http
GET /api/video-jobs/[jobId]

Response (200 OK):
{
  "job": {
    "id": "uuid",
    "status": "completed",
    "progress": 100,
    "outputUrl": "gs://bucket/scenes/scene-uuid/video.mp4",
    "thumbnailUrl": "gs://bucket/scenes/scene-uuid/thumbnail.jpg",
    "durationSeconds": 45
  }
}
```

### 4. List All Jobs
```http
GET /api/video-jobs?sceneId=uuid&status=processing&limit=50

Response (200 OK):
{
  "jobs": [...],
  "total": 10
}
```

### 5. Webhook (Internal)
```http
POST /api/video-jobs/[jobId]/webhook
Authorization: Bearer <WEBHOOK_SECRET>
Content-Type: application/json

{
  "jobId": "uuid",
  "status": "processing",
  "progress": 50,
  "currentStep": "Processing video clips"
}
```

## Cloud Run Service

### Dockerfile

Located at: `jobs/video-processor/Dockerfile`

```dockerfile
FROM node:20-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg ffprobe bash curl

# Copy application code
COPY jobs/video-processor ./jobs/video-processor
COPY src/services/VideoService.ts ./src/services/VideoService.ts
# ... other files

CMD ["node", "jobs/video-processor/server.js"]
```

### Server (jobs/video-processor/server.js)

Key endpoints:
- `GET /health` - Health check
- `POST /process` - Trigger video processing

## Deployment

### Prerequisites

1. **Google Cloud Project**: storycare-478114 (or your project ID)
2. **Cloud SQL Instance**: storycare-dev (already configured)
3. **GCS Bucket**: For storing assembled videos
4. **Secrets**:
   - `WEBHOOK_SECRET` - Secure token for webhook auth
   - `DATABASE_URL_DEV` - PostgreSQL connection string

### Step 1: Create Webhook Secret

```bash
# Generate random secret
openssl rand -hex 32

# Add to Google Secret Manager
echo -n "your-webhook-secret" | \
  gcloud secrets create WEBHOOK_SECRET \
    --data-file=- \
    --replication-policy="automatic"

# Grant Cloud Run access
gcloud secrets add-iam-policy-binding WEBHOOK_SECRET \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Step 2: Run Database Migration

```bash
# Start Cloud SQL Proxy (if not running)
cloud-sql-proxy storycare-478114:us-central1:storycare-dev

# Run migration
npm run db:migrate

# Verify table created
psql "postgresql://user:pass@127.0.0.1:5432/storycare_dev" \
  -c "\d video_processing_jobs"
```

### Step 3: Deploy Video Processor Service

#### Option A: GitHub Actions (Recommended)

```bash
# Push to main branch (workflow triggers automatically)
git add .
git commit -m "feat: add async video processing"
git push origin main

# Or trigger manually
# Go to: GitHub → Actions → Deploy Video Processor → Run workflow
```

#### Option B: Manual Deployment

```bash
# Set project
export PROJECT_ID=storycare-478114
export SERVICE_NAME=storycare-video-processor
export REGION=us-central1

# Build Docker image
docker build \
  -f jobs/video-processor/Dockerfile \
  -t gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
  .

# Push to GCR
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

# Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 4Gi \
  --cpu 2 \
  --timeout 900 \
  --max-instances 10 \
  --min-instances 0 \
  --port 8080 \
  --set-env-vars NODE_ENV=production \
  --update-secrets WEBHOOK_SECRET=WEBHOOK_SECRET:latest

# Get service URL
gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --format 'value(status.url)'
```

### Step 4: Update Main App Environment

```bash
# Get video processor URL from Step 3
export VIDEO_PROCESSOR_URL="https://storycare-video-processor-xxx.run.app"

# Update main app on Cloud Run
gcloud run services update storycare-app-dev \
  --region us-central1 \
  --set-env-vars VIDEO_PROCESSOR_URL=$VIDEO_PROCESSOR_URL \
  --update-secrets WEBHOOK_SECRET=WEBHOOK_SECRET:latest

# Or update in .env.local for local development
echo "VIDEO_PROCESSOR_URL=$VIDEO_PROCESSOR_URL" >> .env.local
echo "WEBHOOK_SECRET=your-webhook-secret" >> .env.local
```

### Step 5: Verify Deployment

```bash
# Health check
curl https://storycare-video-processor-xxx.run.app/health

# Expected response:
# {
#   "status": "healthy",
#   "service": "video-processor",
#   "ffmpeg": true,
#   "timestamp": "2025-01-15T10:30:00.000Z"
# }
```

## Frontend Integration

### 1. Using the React Hook

```tsx
import { useVideoJobPolling } from '@/hooks/useVideoJobPolling';

function SceneEditor({ sceneId }: { sceneId: string }) {
  const { job, isProcessing, isCompleted, isFailed } = useVideoJobPolling({
    sceneId,
    enabled: true,
    pollInterval: 2000,
    onComplete: (job) => {
      console.log('Video ready!', job.assembledVideoUrl);
      toast.success('Scene assembled successfully!');
    },
    onError: (error) => {
      console.error('Processing failed:', error);
      toast.error('Video assembly failed');
    },
  });

  return (
    <div>
      {isProcessing && (
        <div>
          Processing: {job?.progress}%
          <br />
          {job?.currentStep}
        </div>
      )}

      {isCompleted && (
        <video src={job?.assembledVideoUrl} controls />
      )}
    </div>
  );
}
```

### 2. Using the Status Component

```tsx
import { VideoProcessingStatus } from '@/components/scenes/VideoProcessingStatus';

function ScenePage({ sceneId }: { sceneId: string }) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  return (
    <div>
      <VideoProcessingStatus
        sceneId={sceneId}
        onComplete={(url, thumbnail) => {
          setVideoUrl(url);
          // Optionally refresh scene data
        }}
        onError={(error) => {
          console.error('Error:', error);
        }}
      />

      {videoUrl && (
        <video src={videoUrl} controls className="w-full" />
      )}
    </div>
  );
}
```

### 3. Triggering Assembly

```tsx
async function handleAssemble(sceneId: string) {
  try {
    const response = await fetch(`/api/scenes/${sceneId}/assemble-async`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to start assembly');
    }

    const data = await response.json();
    console.log('Job created:', data.jobId);

    // Now useVideoJobPolling hook will automatically track progress
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Testing

### Local Testing (Without Cloud Run)

For local development, you can test the webhook flow:

```bash
# Terminal 1: Start video processor locally
cd jobs/video-processor
PORT=8080 WEBHOOK_SECRET=test-secret node server.js

# Terminal 2: Start main app
npm run dev

# Terminal 3: Test assembly
curl -X POST http://localhost:3000/api/scenes/[sceneId]/assemble-async

# Monitor job progress
curl http://localhost:3000/api/video-jobs/[jobId]
```

### Cloud Run Testing

```bash
# Get service URL
export VIDEO_PROCESSOR_URL=$(gcloud run services describe storycare-video-processor \
  --region us-central1 \
  --format 'value(status.url)')

# Test health
curl $VIDEO_PROCESSOR_URL/health

# Test processing (requires webhook secret)
curl -X POST $VIDEO_PROCESSOR_URL/process \
  -H "Authorization: Bearer your-webhook-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "test-job-id",
    "sceneId": "test-scene-id",
    "inputData": {...},
    "webhookUrl": "https://your-app.run.app/api/video-jobs/test-job-id/webhook"
  }'
```

### End-to-End Testing

1. Create a scene with clips
2. Click "Assemble Scene (Async)"
3. Observe progress updates in UI
4. Verify video appears when complete

Expected timeline:
- Job creation: < 1s
- Cloud Run startup (cold): 5-10s
- Video assembly: 30-60s (depends on scene length)
- Total: ~40-70s for first request, ~30-60s for warm starts

## Monitoring

### Logs

```bash
# Video processor logs
gcloud run services logs tail storycare-video-processor \
  --region us-central1

# Main app logs (webhooks)
gcloud run services logs tail storycare-app-dev \
  --region us-central1 \
  --filter="api/video-jobs"
```

### Metrics

View in Cloud Console:
- **Request count**: Number of jobs processed
- **Request latency**: Processing time per job
- **Error rate**: Failed jobs percentage
- **Instance count**: Auto-scaling behavior

### Database Queries

```sql
-- Active jobs
SELECT id, scene_id, status, progress, current_step, created_at
FROM video_processing_jobs
WHERE status IN ('pending', 'processing')
ORDER BY created_at DESC;

-- Failed jobs (last 24 hours)
SELECT id, scene_id, error_message, created_at
FROM video_processing_jobs
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Average processing time
SELECT AVG(duration_seconds) as avg_duration_sec
FROM video_processing_jobs
WHERE status = 'completed'
  AND duration_seconds IS NOT NULL;

-- Job success rate
SELECT
  status,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM video_processing_jobs
GROUP BY status;
```

## Troubleshooting

### Job stuck in "pending"

**Cause**: Cloud Run service not reachable or down

**Solution**:
```bash
# Check service status
gcloud run services describe storycare-video-processor --region us-central1

# Check health endpoint
curl https://storycare-video-processor-xxx.run.app/health

# View logs
gcloud run services logs tail storycare-video-processor --region us-central1
```

### Job fails immediately

**Cause**: Invalid input data or missing presigned URLs

**Solution**:
```sql
-- Check job details
SELECT input_data, error_message
FROM video_processing_jobs
WHERE id = 'your-job-id';

-- Verify presigned URLs are valid (check expiry)
```

### Webhook not received

**Cause**: Incorrect webhook secret or URL

**Solution**:
```bash
# Verify webhook secret matches
echo $WEBHOOK_SECRET

# Test webhook endpoint manually
curl -X POST https://your-app.run.app/api/video-jobs/test-id/webhook \
  -H "Authorization: Bearer $WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"jobId":"test-id","status":"completed","progress":100}'
```

### FFmpeg errors

**Cause**: Invalid media URLs or codec issues

**Solution**:
```bash
# Check Cloud Run logs for FFmpeg output
gcloud run services logs tail storycare-video-processor \
  --region us-central1 \
  --filter="ffmpeg"

# Common issues:
# - Expired presigned URLs (extend expiry to 24 hours)
# - Unsupported video codecs (transcode to H.264)
# - Corrupted media files (re-upload)
```

## Cost Optimization

### Pricing Breakdown

**Cloud Run**:
- CPU: $0.00002400/vCPU-second (2 vCPU)
- Memory: $0.00000250/GiB-second (4 GiB)
- Requests: $0.40/million

**Example Calculation**:
- Average job: 45 seconds
- CPU cost: 45s × 2 vCPU × $0.000024 = $0.00216
- Memory cost: 45s × 4 GiB × $0.0000025 = $0.00045
- **Total per job**: ~$0.0026 (0.26 cents)

**Monthly estimate** (1000 jobs):
- Processing: $2.60
- Storage (GCS): ~$2.00
- Database: Free tier
- **Total**: ~$5/month

### Optimization Tips

1. **Reduce cold starts**: Set `--min-instances=1` for production (adds ~$40/month)
2. **Batch processing**: Process multiple scenes in one job if possible
3. **Optimize FFmpeg**: Use hardware acceleration flags
4. **GCS lifecycle**: Delete old temp files after 7 days

## Migration from Sync to Async

### Backward Compatibility

The old sync endpoint still works:
```http
POST /api/scenes/[id]/assemble
```

To migrate:
1. Update frontend to use `/assemble-async` endpoint
2. Add `<VideoProcessingStatus>` component
3. Remove old loading states
4. Test with staging scenes
5. Gradually roll out to production

### Feature Flag

Add feature flag to toggle between sync/async:

```tsx
const USE_ASYNC_PROCESSING = process.env.NEXT_PUBLIC_USE_ASYNC_PROCESSING === 'true';

function assembleScene(sceneId: string) {
  const endpoint = USE_ASYNC_PROCESSING
    ? `/api/scenes/${sceneId}/assemble-async`
    : `/api/scenes/${sceneId}/assemble`;

  return fetch(endpoint, { method: 'POST' });
}
```

## Security Considerations

1. **Webhook Authentication**: Always verify `WEBHOOK_SECRET` in webhook handlers
2. **Presigned URLs**: Use short expiry (1-24 hours) to prevent unauthorized access
3. **Rate Limiting**: Add Arcjet rate limiting to `/assemble-async` endpoint
4. **Input Validation**: Validate scene clips before creating job
5. **CORS**: Video processor only accepts requests from main app

## Future Enhancements

- [ ] Priority queue for urgent jobs
- [ ] Parallel clip processing (multiple FFmpeg instances)
- [ ] Progress streaming via WebSockets (instead of polling)
- [ ] Automatic retry for failed jobs
- [ ] Cost tracking per scene
- [ ] Email notification on completion
- [ ] GPU acceleration for faster encoding
- [ ] Multi-region deployment for global users

---

**Last Updated**: 2025-01-15
**Version**: 1.0.0
**Maintained By**: Development Team
