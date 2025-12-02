# GPU Video Transcoding Quick Start

⚠️ **Important**: This feature requires TWO separate steps:
- **Step 1**: One-time setup (creates buckets and permissions) ← **YOU MUST DO THIS FIRST**
- **Step 2**: Deployment (builds and deploys the job) ← **DO THIS AFTER SETUP**

---

## Step 1: One-Time Infrastructure Setup (10 minutes)

### What This Does

The setup script automatically creates and configures everything you need:
- ✅ `preprocessing-{project-id}` bucket (for input videos)
- ✅ `transcoded-{project-id}` bucket (for output videos)
- ✅ `video-encoding@{project-id}` service account
- ✅ IAM permissions (read-only on input, read-write on output)

### Prerequisites

Before running the setup script, make sure you have:
- [ ] Google Cloud SDK (`gcloud`) installed
- [ ] Authenticated with `gcloud auth login`
- [ ] Selected your project with `gcloud config set project PROJECT_ID`
- [ ] Billing enabled on your GCP project

### Commands

```bash
# Set your project ID (replace with your actual project ID)
export GCP_PROJECT_ID="storycare-478114"

# Optional: Preview what will be created (dry-run mode)
./scripts/setup-video-transcode-buckets.sh --dry-run

# Run the actual setup
./scripts/setup-video-transcode-buckets.sh
```

### Success Indicators

You should see output similar to:

```
==========================================
✅ Setup Complete!
==========================================

📦 Buckets created:
  Input:  gs://preprocessing-storycare-478114
  Output: gs://transcoded-storycare-478114

👤 Service account: video-encoding@storycare-478114.iam.gserviceaccount.com

📋 Next steps:
  1. Run validation: ./scripts/validate-video-transcode-setup.sh
  2. Deploy job: See GPU_TRANSCODING_QUICKSTART.md
==========================================
```

### Troubleshooting

| Error | Solution |
|-------|----------|
| `gcloud: command not found` | Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install |
| `ERROR: Not authenticated` | Run `gcloud auth login` and follow the prompts |
| `ERROR: Cannot access project` | Verify project ID with `gcloud projects list` |
| `Permission denied` | Ensure you have Owner or Editor role on the project |

---

## Step 2: Validate Setup (2 minutes)

Before deploying, verify that everything was created correctly:

```bash
# Run the validation script
./scripts/validate-video-transcode-setup.sh
```

### Expected Output

```
Validating GPU Transcoding Setup...

✅ gcloud CLI installed (version 400.0.0)
✅ Authenticated as user@example.com
✅ Project storycare-478114 accessible
✅ Preprocessing bucket exists
✅ Transcoded bucket exists
✅ Service account video-encoding@... exists
✅ Preprocessing bucket permissions OK
✅ Transcoded bucket permissions OK
⚠️  Cloud Run Job not deployed yet (this is expected)
⚠️  GPU quota not verified (check manually if needed)

==========================================
✅ Setup is valid! Ready for deployment.
==========================================
```

If you see ✅ for all required checks, proceed to deployment!

---

## Step 3: Request GPU Quota (5 minutes)

Before deploying the GPU job, you need GPU quota in your region.

### Option A: Automatic Quota (Easiest)

Deploy any Cloud Run service with GPU to automatically receive 3 nvidia-l4 GPU quota:

```bash
# This automatically grants you GPU quota
gcloud run services create test-gpu-service \
  --image=gcr.io/cloudrun/hello \
  --region=us-central1 \
  --gpu=1 \
  --gpu-type=nvidia-l4
```

### Option B: Manual Quota Request

1. Go to [Quotas page](https://console.cloud.google.com/iam-admin/quotas)
2. Search for: "Total Nvidia L4 GPU allocation without zonal redundancy, per project per region"
3. Select your region (e.g., `us-central1`)
4. Click "Edit Quotas" and request at least 1 GPU
5. Wait for approval (usually instant or within minutes)

---

## Step 4: Deploy GPU Job (5 minutes)

Now that setup is complete, deploy the transcoding job.

### Option A: GitHub Actions (Recommended)

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Select **"Deploy Video Transcoding Job (GPU)"**
4. Click **"Run workflow"**
5. Choose environment (dev or prod)
6. Click **"Run workflow"** (green button)
7. Wait for deployment to complete (~5-10 minutes)

### Option B: gcloud CLI

```bash
# Build and deploy
export PROJECT_ID="storycare-478114"
export REGION="us-central1"

# Build Docker image
gcloud builds submit \
  --tag ${REGION}-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/video-transcoding \
  --file Dockerfile.transcode \
  --machine-type E2-HIGHCPU-32

# Deploy Cloud Run Job
gcloud run jobs create video-encoding-job \
  --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/video-transcoding \
  --region ${REGION} \
  --memory 32Gi \
  --cpu 8 \
  --gpu 1 \
  --gpu-type nvidia-l4 \
  --no-gpu-zonal-redundancy \
  --max-retries 1 \
  --service-account video-encoding@${PROJECT_ID}.iam.gserviceaccount.com \
  --add-volume=name=input-volume,type=cloud-storage,bucket=preprocessing-${PROJECT_ID},readonly=true \
  --add-volume-mount=volume=input-volume,mount-path=/inputs \
  --add-volume=name=output-volume,type=cloud-storage,bucket=transcoded-${PROJECT_ID} \
  --add-volume-mount=volume=output-volume,mount-path=/outputs
```

---

## Step 5: Test (5 minutes)

Now test the transcoding job with a sample video.

### 5.1 Upload a Test Video

```bash
# Upload a video to the preprocessing bucket
gcloud storage cp your-test-video.mp4 gs://preprocessing-${PROJECT_ID}/
```

### 5.2 Run Transcoding Job

```bash
# Execute the job to transcode the video
gcloud run jobs execute video-encoding-job \
  --region us-central1 \
  --args="your-test-video.mp4,output.mp4,-vcodec,h264_nvenc,-cq,21,-movflags,+faststart"
```

### 5.3 Monitor Job Progress

```bash
# View logs in real-time
gcloud logging tail "resource.type=cloud_run_job AND resource.labels.job_name=video-encoding-job" \
  --format="value(textPayload)"
```

### 5.4 Download Result

```bash
# Once complete, download the transcoded video
gcloud storage cp gs://transcoded-${PROJECT_ID}/output.mp4 ./
```

---

## Common Transcoding Patterns

Once setup is complete, use these patterns for different use cases:

### High Quality H.264 (Recommended)
```bash
gcloud run jobs execute video-encoding-job \
  --region us-central1 \
  --args="input.mp4,output.mp4,-vcodec,h264_nvenc,-cq,21,-preset,slow,-movflags,+faststart"
```

### Compress Large File (HEVC)
```bash
gcloud run jobs execute video-encoding-job \
  --region us-central1 \
  --args="input.mp4,output.mp4,-vcodec,hevc_nvenc,-cq,23,-preset,medium"
```

### Resize to 720p
```bash
gcloud run jobs execute video-encoding-job \
  --region us-central1 \
  --args="input.mp4,output.mp4,-vcodec,h264_nvenc,-s,1280x720,-cq,23"
```

### Change Frame Rate to 30fps
```bash
gcloud run jobs execute video-encoding-job \
  --region us-central1 \
  --args="input.mp4,output.mp4,-vcodec,h264_nvenc,-r,30,-cq,23"
```

---

## Workflow Summary

```
┌─────────────────────────────────────────────────┐
│ ONE-TIME SETUP (Do this first!)                │
├─────────────────────────────────────────────────┤
│ 1. Run setup script                             │
│    ./scripts/setup-video-transcode-buckets.sh   │
│                                                 │
│ Creates:                                        │
│ • preprocessing-{project} bucket                │
│ • transcoded-{project} bucket                   │
│ • video-encoding service account                │
│ • IAM permissions                               │
└────────────────┬────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────┐
│ VALIDATE SETUP (Recommended)                   │
├─────────────────────────────────────────────────┤
│ ./scripts/validate-video-transcode-setup.sh     │
└────────────────┬────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────┐
│ REQUEST GPU QUOTA (One-time)                   │
├─────────────────────────────────────────────────┤
│ Deploy any GPU service OR request via console   │
└────────────────┬────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────┐
│ DEPLOYMENT (Do this when code changes)         │
├─────────────────────────────────────────────────┤
│ Option A: GitHub Actions                        │
│ Option B: gcloud CLI                            │
└────────────────┬────────────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────────────┐
│ USAGE (Ongoing)                                 │
├─────────────────────────────────────────────────┤
│ • Upload video to preprocessing bucket          │
│ • Execute job to transcode                      │
│ • Download from transcoded bucket               │
└─────────────────────────────────────────────────┘
```

---

## Troubleshooting Common Issues

### Issue: "Bucket not found" when deploying

**Cause**: You haven't run the setup script yet

**Solution**: Run Step 1 (One-Time Setup) first

### Issue: "GPU quota exceeded"

**Cause**: No GPU quota in your region

**Solution**: See Step 3 (Request GPU Quota)

### Issue: "Service account not found"

**Cause**: Setup script didn't complete successfully

**Solution**:
1. Run validation script to check what's missing
2. Re-run setup script (it's safe to run multiple times)

### Issue: Job execution fails

**Cause**: Various reasons - check logs

**Solution**:
```bash
# View detailed logs
gcloud logging read "resource.type=cloud_run_job AND resource.labels.job_name=video-encoding-job" \
  --limit 50 \
  --format json
```

### Issue: "Input file not found"

**Cause**: File doesn't exist in preprocessing bucket

**Solution**:
```bash
# List files in preprocessing bucket
gcloud storage ls gs://preprocessing-${PROJECT_ID}/

# Upload your file
gcloud storage cp your-file.mp4 gs://preprocessing-${PROJECT_ID}/
```

---

## Next Steps

- **For detailed documentation**: See [GPU_TRANSCODING_GUIDE.md](./GPU_TRANSCODING_GUIDE.md)
- **For FFmpeg options**: See [GPU_TRANSCODING_GUIDE.md#ffmpeg-arguments-reference](./GPU_TRANSCODING_GUIDE.md#ffmpeg-arguments-reference)
- **For programmatic usage**: See [VideoTranscodingService.ts](./src/services/VideoTranscodingService.ts)
- **For cost optimization**: See [GPU_TRANSCODING_GUIDE.md#cost-considerations](./GPU_TRANSCODING_GUIDE.md#cost-considerations)

---

## Questions?

If you're stuck:
1. Run the validation script to diagnose issues
2. Check the troubleshooting section above
3. Review the detailed guide: [GPU_TRANSCODING_GUIDE.md](./GPU_TRANSCODING_GUIDE.md)

**Remember**: Setup (Step 1) must be done ONCE before deployment (Step 4). After that, you only need to deploy when code changes.
