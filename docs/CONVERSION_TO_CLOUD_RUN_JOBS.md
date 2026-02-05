# Conversion to Cloud Run Jobs - Summary

## What Changed

Successfully converted from **Cloud Run Service** (HTTP server) to **Cloud Run Jobs** (one-time execution) for video processing.

### Files Modified

1. ✅ **jobs/video-processor/server.js** → **DELETED** (HTTP server removed)
2. ✅ **jobs/video-processor/execute.js** → **CREATED** (Job executor script)
3. ✅ **jobs/video-processor/Dockerfile** → **UPDATED** (Changed CMD to execute job)
4. ✅ **src/app/api/scenes/[id]/assemble-async/route.ts** → **UPDATED** (Uses Cloud Run Jobs API)
5. ✅ **src/app/api/video-jobs/[id]/webhook/route.ts** → **DELETED** (Not needed)
6. ✅ **.github/workflows/deploy-video-processor.yml** → **UPDATED** (Deploys as job)
7. ✅ **scripts/deploy-video-processor.sh** → **UPDATED** (Deploys as job)
8. ✅ **CLOUD_RUN_JOBS_GUIDE.md** → **CREATED** (New documentation)

### Dependencies

✅ `@google-cloud/run` already installed (v3.0.1) in package.json

## Key Differences

### Before (Cloud Run Service)
```javascript
// HTTP server listening on port 8080
server.listen(8080);

// Triggered via HTTP POST
fetch('https://service-url.run.app/process', {
  method: 'POST',
  body: JSON.stringify({ jobId, inputData })
});

// Sends webhook updates
fetch(webhookUrl, {
  method: 'POST',
  body: JSON.stringify({ status, progress })
});
```

### After (Cloud Run Jobs)
```javascript
// One-time execution script
const jobId = process.env.JOB_ID;
processVideo(jobId);
process.exit(0);

// Triggered via Cloud Run Jobs API
const { JobsClient } = require('@google-cloud/run').v2;
const client = new JobsClient();
await client.runJob({
  name: 'projects/.../jobs/storycare-video-processor',
  overrides: {
    containerOverrides: [{
      env: [
        { name: 'JOB_ID', value: jobId },
        { name: 'SCENE_ID', value: sceneId },
      ]
    }]
  }
});

// Updates database directly (no webhook)
await db.update(videoProcessingJobs)
  .set({ status: 'completed' });
```

## Benefits of Cloud Run Jobs

| Benefit | Impact |
|---------|--------|
| **Lower Cost** | No idle charges, only pay during execution |
| **Longer Timeout** | Up to 24 hours (vs 15 minutes for services) |
| **Simpler Architecture** | No HTTP server, no webhooks needed |
| **Better Isolation** | Each job execution is completely independent |
| **Easier Monitoring** | Built-in execution history and logs |

## Deployment

### Quick Deploy
```bash
# Option 1: Script
./scripts/deploy-video-processor.sh

# Option 2: GitHub Actions
git push origin main  # Auto-deploys via workflow

# Option 3: Manual
gcloud run jobs create storycare-video-processor \
  --image gcr.io/storycare-478114/storycare-video-processor:latest \
  --region us-central1 \
  --memory 4Gi \
  --cpu 2 \
  --task-timeout 3600 \
  --max-retries 3 \
  --set-secrets DATABASE_URL=DATABASE_URL_DEV:latest \
  --project storycare-478114
```

### Required Secrets in Google Secret Manager

Make sure these exist:
- `DATABASE_URL_DEV` - PostgreSQL connection string
- `GCS_PROJECT_ID` - Google Cloud project ID
- `GCS_CLIENT_EMAIL` - Service account email
- `GCS_PRIVATE_KEY` - Service account private key
- `GCS_BUCKET_NAME` - Storage bucket name

### Create Missing Secrets

```bash
# Example: Create DATABASE_URL_DEV
echo -n "postgresql://user:pass@host/db" | \
  gcloud secrets create DATABASE_URL_DEV \
    --data-file=- \
    --replication-policy="automatic" \
    --project=storycare-478114
```

## Testing

### 1. Deploy the Job
```bash
./scripts/deploy-video-processor.sh
```

### 2. Verify Deployment
```bash
gcloud run jobs describe storycare-video-processor \
  --region us-central1 \
  --project storycare-478114
```

### 3. Test Manual Execution
```bash
gcloud run jobs execute storycare-video-processor \
  --region us-central1 \
  --project storycare-478114 \
  --update-env-vars JOB_ID=test-123,SCENE_ID=test-456
```

### 4. View Execution Logs
```bash
# List executions
gcloud run jobs executions list \
  --job=storycare-video-processor \
  --region=us-central1

# View logs for specific execution
gcloud run jobs executions logs read [EXECUTION_NAME] \
  --job=storycare-video-processor \
  --region=us-central1
```

### 5. Test from Frontend
1. Create a scene with clips
2. Click "Assemble Scene"
3. Check database: `SELECT * FROM video_processing_jobs ORDER BY created_at DESC LIMIT 1`
4. Monitor: `gcloud run jobs executions list --job=storycare-video-processor`
5. Verify video appears when complete

## Monitoring

### Database Queries
```sql
-- Active jobs
SELECT id, scene_id, status, progress, cloud_run_job_id
FROM video_processing_jobs
WHERE status IN ('pending', 'processing')
ORDER BY created_at DESC;

-- Success rate
SELECT status, COUNT(*) as count
FROM video_processing_jobs
GROUP BY status;
```

### Cloud Run Commands
```bash
# List all executions
gcloud run jobs executions list --job=storycare-video-processor --region=us-central1

# View logs
gcloud run jobs executions logs read [EXECUTION_NAME] \
  --job=storycare-video-processor --region=us-central1

# Describe job configuration
gcloud run jobs describe storycare-video-processor --region=us-central1
```

## Troubleshooting

### Job Doesn't Start
**Symptom**: Job stuck in "pending" status in database

**Check**:
```bash
# Verify job exists
gcloud run jobs describe storycare-video-processor --region=us-central1

# Check API logs
gcloud run services logs tail storycare-app-dev \
  --region=us-central1 \
  --filter="assemble-async"
```

**Common Causes**:
- Job not deployed
- Cloud Run Jobs API not enabled
- Permissions issue with service account

### Job Fails Immediately
**Symptom**: Job status changes to "failed" quickly

**Check**:
```bash
# View execution logs
gcloud run jobs executions list --job=storycare-video-processor --limit=5

# Read logs for failed execution
gcloud run jobs executions logs read [EXECUTION_NAME] \
  --job=storycare-video-processor --region=us-central1
```

**Common Causes**:
- Missing environment variables (DATABASE_URL, GCS credentials)
- Invalid input data (malformed JSON in INPUT_DATA)
- Database connection failure

### Database Not Updating
**Symptom**: Job completes but video_processing_jobs table not updated

**Check**:
```bash
# Check if job has DATABASE_URL secret
gcloud run jobs describe storycare-video-processor \
  --region=us-central1 \
  --format="value(template.template.containers[0].env)"
```

**Common Causes**:
- Wrong DATABASE_URL (not Cloud SQL connection string)
- Database credentials expired
- Cloud SQL instance not accessible

## Migration Checklist

- [x] Converted HTTP server to job executor
- [x] Updated Dockerfile
- [x] Updated API to use Cloud Run Jobs API
- [x] Removed webhook endpoint
- [x] Updated GitHub Actions workflow
- [x] Updated deployment script
- [x] Created new documentation
- [ ] **Deploy Cloud Run Job** ← YOU ARE HERE
- [ ] Test manual execution
- [ ] Test end-to-end with real scene
- [ ] Monitor first production execution
- [ ] Update monitoring dashboards (if any)

## Next Steps

1. **Deploy the job**:
   ```bash
   ./scripts/deploy-video-processor.sh
   ```

2. **Verify deployment**:
   ```bash
   gcloud run jobs describe storycare-video-processor --region=us-central1
   ```

3. **Test with real scene**:
   - Create scene in UI
   - Click "Assemble Scene"
   - Monitor execution logs

4. **Monitor costs**:
   - Check billing dashboard after a few executions
   - Verify costs align with estimates (~$0.0026 per video)

5. **Cleanup old service** (if exists):
   ```bash
   # Delete old Cloud Run Service if it was deployed
   gcloud run services delete storycare-video-processor --region=us-central1
   ```

## Documentation

- **CLOUD_RUN_JOBS_GUIDE.md** - Complete guide for Cloud Run Jobs
- **ASYNC_VIDEO_PROCESSING.md** - Original async video processing docs (still relevant)
- **QUICK_START_ASYNC_VIDEO.md** - Quick start guide (needs update for jobs)

## Questions?

- **How do I monitor job executions?** See "Monitoring" section above
- **How do I debug failed jobs?** Check execution logs with `gcloud run jobs executions logs read`
- **How much will this cost?** ~$0.0026 per video, ~$5/month for 1000 videos
- **Can I still use the old sync endpoint?** Yes, `/api/scenes/[id]/assemble` still works

---

**Status**: ✅ Ready to deploy
**Last Updated**: 2025-01-15
**Migration**: Cloud Run Service → Cloud Run Jobs
