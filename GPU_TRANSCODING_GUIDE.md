# GPU-Accelerated Video Transcoding Guide

> 🚀 **New to GPU transcoding?** Start with [GPU_TRANSCODING_QUICKSTART.md](./GPU_TRANSCODING_QUICKSTART.md)

> ⚠️ **Important**: You must complete one-time setup before deployment. See Quick Start guide above.

---

This comprehensive guide describes how to use GPU-accelerated video transcoding with Cloud Run Jobs for StoryCare.

## Table of Contents

- [Overview](#overview)
- [Workflow Overview](#workflow-overview)
- [Setup vs Deployment](#setup-vs-deployment)
- [Architecture](#architecture)
- [Setup Instructions](#setup-instructions)
- [Usage](#usage)
- [FFmpeg Arguments Reference](#ffmpeg-arguments-reference)
- [Performance Comparison](#performance-comparison)
- [Cost Considerations](#cost-considerations)
- [When to Use GPU vs CPU](#when-to-use-gpu-vs-cpu)
- [Monitoring and Debugging](#monitoring-and-debugging)
- [Maintenance](#maintenance)
- [Security Considerations](#security-considerations)
- [Support](#support)

## Overview

StoryCare uses **two different video processing systems**:

1. **CPU-based Scene Assembly** (Existing)
   - Located in main Cloud Run service
   - Used for: Scene assembly, image-to-video conversion, simple concatenation
   - FFmpeg installed in Alpine Linux
   - Good for: Quick operations, synchronous processing

2. **GPU-accelerated Transcoding** (New)
   - Separate Cloud Run Job with NVIDIA L4 GPU
   - Used for: Heavy video encoding, format conversion, high-quality transcoding
   - FFmpeg with NVIDIA NVENC hardware acceleration
   - Good for: Batch processing, offline transcoding, heavy workloads

## Workflow Overview

Understanding the distinction between **setup** (done once) and **deployment** (done when code changes) is critical:

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
│ DEPLOYMENT (Do this when code changes)         │
├─────────────────────────────────────────────────┤
│ Option A: GitHub Actions                        │
│ • Go to Actions → Deploy Video Transcoding Job  │
│                                                 │
│ Option B: gcloud CLI                            │
│ • gcloud run jobs deploy ...                    │
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

## Setup vs Deployment

| Aspect | Setup (Once) | Deployment (Many) |
|--------|--------------|-------------------|
| **When** | Before first use | When code changes |
| **What** | Buckets, service account, permissions | Docker image, Cloud Run Job |
| **How** | `setup-video-transcode-buckets.sh` | GitHub Actions or gcloud CLI |
| **Duration** | ~2 minutes | ~5-10 minutes |
| **Required** | Yes (deployment fails without it) | Yes (but setup must be done first) |
| **Idempotent** | Yes (safe to run multiple times) | Yes (updates existing job) |
| **Validation** | `validate-video-transcode-setup.sh` | Automatic in GitHub Actions workflow |

**Key Insight**: Setup creates the infrastructure (buckets, permissions), deployment builds and deploys the code. You run setup once, then deploy whenever your transcoding code changes.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     StoryCare Application                    │
│                   (Cloud Run Service)                        │
│                                                              │
│  ┌──────────────────┐           ┌────────────────────────┐ │
│  │ VideoService     │           │ VideoTranscodingService│ │
│  │ (CPU FFmpeg)     │           │ (Triggers GPU Jobs)    │ │
│  │                  │           │                        │ │
│  │ - Scene assembly │           │ - Upload to GCS        │ │
│  │ - Image to video │           │ - Execute GPU job      │ │
│  │ - Concatenation  │           │ - Monitor status       │ │
│  └──────────────────┘           └────────────────────────┘ │
└────────────────┬─────────────────────────┬──────────────────┘
                 │                         │
                 │                         │ Triggers
                 │                         ▼
                 │              ┌────────────────────────────┐
                 │              │  GPU Transcoding Job       │
                 │              │  (Cloud Run Job)           │
                 │              │                            │
                 │              │  - NVIDIA L4 GPU           │
                 │              │  - FFmpeg with NVENC       │
                 │              │  - Hardware acceleration   │
                 │              └────────────────────────────┘
                 │                         │
                 │                         │
                 ▼                         ▼
    ┌─────────────────────────────────────────────────────┐
    │           Google Cloud Storage                      │
    │                                                     │
    │  ┌──────────────────┐    ┌──────────────────────┐│
    │  │ Main GCS Bucket  │    │ Preprocessing Bucket ││
    │  │ (storycare-...)  │    │ (preprocessing-...)  ││
    │  │                  │    │                      ││
    │  │ - Scenes         │    │ - Input videos       ││
    │  │ - Media library  │    │ - For GPU processing ││
    │  └──────────────────┘    └──────────────────────┘│
    │                                                   │
    │  ┌──────────────────┐                            │
    │  │ Transcoded Bucket│                            │
    │  │ (transcoded-...) │                            │
    │  │                  │                            │
    │  │ - Output videos  │                            │
    │  │ - GPU processed  │                            │
    │  └──────────────────┘                            │
    └─────────────────────────────────────────────────┘
```

## Setup Instructions

### 1. Prerequisites

- Google Cloud Project with billing enabled
- Cloud Run API enabled
- Artifact Registry API enabled
- GPU quota for NVIDIA L4 in your region (request if needed)

### 2. Request GPU Quota

Before deploying, request GPU quota:

1. Go to [Quotas page](https://console.cloud.google.com/iam-admin/quotas)
2. Search for: "Total Nvidia L4 GPU allocation without zonal redundancy, per project per region"
3. Select your region (e.g., us-central1)
4. Click "Edit Quotas" and request at least 1 GPU
5. Wait for approval (usually quick)

**Shortcut:** Deploy any Cloud Run service with GPU to automatically receive 3 nvidia-l4 GPU quota.

### 3. Set Up Cloud Storage Buckets

Run the setup script to create the required buckets:

```bash
# Make sure your GCP project is set
export GCP_PROJECT_ID="your-project-id"

# Run the setup script
./scripts/setup-video-transcode-buckets.sh
```

This creates:
- `preprocessing-{project-id}` - Input bucket for videos to transcode
- `transcoded-{project-id}` - Output bucket for transcoded videos
- Service account: `video-encoding@{project-id}.iam.gserviceaccount.com`

### 4. Deploy the GPU Transcoding Job

#### Option A: Using GitHub Actions (Recommended)

1. Go to GitHub Actions
2. Select "Deploy Video Transcoding Job (GPU)"
3. Click "Run workflow"
4. Choose environment (dev or prod)
5. Wait for deployment to complete

#### Option B: Using gcloud CLI

```bash
# Set variables
export PROJECT_ID="your-project-id"
export REGION="us-central1"

# Build and push image
gcloud builds submit \
  --tag ${REGION}-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/video-transcoding \
  --file Dockerfile.transcode \
  --machine-type E2-HIGHCPU-32

# Deploy job
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

## Usage

### Method 1: Direct Job Execution (gcloud)

Best for: Manual transcoding, testing, one-off operations

```bash
# 1. Upload video to preprocessing bucket
gcloud storage cp your-video.mp4 gs://preprocessing-${PROJECT_ID}/

# 2. Execute transcoding job
gcloud run jobs execute video-encoding-job \
  --region us-central1 \
  --args="your-video.mp4,output.mp4,-vcodec,h264_nvenc,-cq,21,-movflags,+faststart"

# 3. Download transcoded video
gcloud storage cp gs://transcoded-${PROJECT_ID}/output.mp4 ./
```

### Method 2: Using VideoTranscodingService (Programmatic)

Best for: Application-triggered transcoding, automated workflows

```typescript
import { VideoTranscodingService } from '@/services/VideoTranscodingService';

// Upload video for transcoding
const filename = await VideoTranscodingService.uploadForTranscoding(
  videoBuffer,
  'input-video.mp4'
);

// Start GPU transcoding job
const job = await VideoTranscodingService.startTranscodingJob({
  inputPath: filename,
  outputFilename: 'output-video.mp4',
  format: 'h264',
  quality: 'high',
  width: 1920,
  height: 1080,
  fps: 30,
});

// Check job status (poll every few seconds)
const status = await VideoTranscodingService.getJobStatus(job.executionName);

// Get transcoded video URL
if (status.status === 'SUCCEEDED') {
  const url = await VideoTranscodingService.getTranscodedVideoUrl('output-video.mp4');
  console.log('Transcoded video:', url);
}

// Cleanup
await VideoTranscodingService.deletePreprocessingVideo(filename);
```

### Method 3: API Route (Future)

You can create an API route to trigger transcoding:

```typescript
// src/app/api/transcode/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { VideoTranscodingService } from '@/services/VideoTranscodingService';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('video') as File;

    if (!file) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload for transcoding
    const filename = await VideoTranscodingService.uploadForTranscoding(
      buffer,
      file.name
    );

    // Start transcoding job
    const job = await VideoTranscodingService.startTranscodingJob({
      inputPath: filename,
      outputFilename: `transcoded-${file.name}`,
      quality: 'high',
    });

    return NextResponse.json({
      success: true,
      executionName: job.executionName,
      message: 'Transcoding job started',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

## FFmpeg Arguments Reference

### GPU Encoders

- `h264_nvenc` - H.264 (most compatible, good quality)
- `hevc_nvenc` - H.265/HEVC (better compression, smaller files)
- `av1_nvenc` - AV1 (best compression, newer format)

### Quality Presets

Use `-cq` (Constant Quality) parameter:

- `-cq 18` - Ultra high quality (large files)
- `-cq 21` - High quality (recommended)
- `-cq 23` - Medium quality (balanced)
- `-cq 28` - Low quality (small files)

### Speed Presets

Use `-preset` parameter:

- `-preset fast` - Faster encoding, slightly lower quality
- `-preset medium` - Balanced (default)
- `-preset slow` - Slower encoding, better quality

### Common Options

```bash
# Basic H.264 transcoding
-vcodec h264_nvenc -cq 21 -preset medium

# High quality with smaller file size
-vcodec hevc_nvenc -cq 21 -preset slow

# Resize video
-vcodec h264_nvenc -s 1280x720 -cq 23

# Change frame rate
-vcodec h264_nvenc -r 30 -cq 23

# Web-optimized (fast start)
-vcodec h264_nvenc -cq 21 -movflags +faststart

# Audio transcoding
-vcodec h264_nvenc -acodec aac -ab 128k -cq 21
```

### Full Example

```bash
gcloud run jobs execute video-encoding-job \
  --region us-central1 \
  --args="input.mp4,output.mp4,-vcodec,hevc_nvenc,-cq,21,-preset,slow,-s,1920x1080,-r,30,-acodec,aac,-ab,192k,-movflags,+faststart"
```

## Performance Comparison

### CPU-based (Current Scene Assembly)

- **Hardware:** Cloud Run service (2-4 vCPUs)
- **Encoder:** libx264 (software)
- **Use case:** Scene assembly, quick operations
- **Speed:** 5-10 minutes for 2-minute video
- **Cost:** Included in service runtime

### GPU-accelerated (New Transcoding Job)

- **Hardware:** NVIDIA L4 GPU (8 vCPUs, 32GB RAM)
- **Encoder:** h264_nvenc (hardware)
- **Use case:** Heavy transcoding, format conversion
- **Speed:** 30-60 seconds for 2-minute video
- **Cost:** ~$0.80/hour (job execution time only)

**Speed improvement:** 5-10x faster than CPU

## Cost Considerations

### Cloud Run Job Pricing (us-central1)

- **GPU (NVIDIA L4):** ~$0.80/hour
- **CPU (8 vCPU):** ~$0.40/hour
- **Memory (32GB):** ~$0.04/hour
- **Total:** ~$1.24/hour

### Example Costs

**Transcoding 10 videos (2 minutes each):**
- Processing time: ~10 minutes (1 minute per video)
- Cost: ~$0.21

**Transcoding 100 videos:**
- Processing time: ~100 minutes
- Cost: ~$2.07

### Cost Optimization Tips

1. **Use quality presets wisely**
   - Don't use "ultra" quality unless necessary
   - "high" quality is usually sufficient

2. **Batch processing**
   - Process multiple videos in sequence
   - Reduces job startup overhead

3. **Clean up old files**
   - Use `VideoTranscodingService.cleanupOldFiles()`
   - Prevents GCS storage costs

4. **Right-size videos**
   - Don't transcode to higher resolution than source
   - Match frame rate to source when possible

5. **Use CPU for simple tasks**
   - Scene assembly (existing VideoService)
   - Image-to-video conversion
   - Simple concatenation

## When to Use GPU vs CPU

### Use GPU Transcoding (Cloud Run Job) for:

✅ Heavy video encoding (>5 minutes)
✅ Format conversion (MP4 to HEVC/AV1)
✅ Large files (>500MB)
✅ Batch processing multiple videos
✅ High-quality encoding requirements
✅ Offline/asynchronous processing

### Use CPU Assembly (Existing Service) for:

✅ Scene assembly (concatenating clips)
✅ Image-to-video conversion
✅ Quick operations (<1 minute)
✅ Real-time/synchronous needs
✅ Small files (<100MB)
✅ Simple format changes

## Monitoring and Debugging

### Check Job Status

```bash
# List all job executions
gcloud run jobs executions list \
  --job video-encoding-job \
  --region us-central1

# Get execution details
gcloud run jobs executions describe EXECUTION_NAME \
  --region us-central1

# View logs
gcloud logging read "resource.type=cloud_run_job AND resource.labels.job_name=video-encoding-job" \
  --limit 50 \
  --format json
```

### Common Issues

#### 1. "Quota exceeded" error

**Solution:** Request GPU quota in Quotas page (see Setup step 2)

#### 2. "FFmpeg not found" in logs

**Solution:** Rebuild Docker image with Dockerfile.transcode

#### 3. "Input file not found"

**Solution:** Verify file exists in preprocessing bucket:
```bash
gcloud storage ls gs://preprocessing-${PROJECT_ID}/
```

#### 4. Job fails with exit code 1

**Solution:** Check logs for FFmpeg errors:
```bash
gcloud logging read "resource.type=cloud_run_job" --limit 100
```

## Maintenance

### Update FFmpeg Version

Edit `Dockerfile.transcode` and change FFmpeg version:

```dockerfile
RUN wget https://ffmpeg.org/releases/ffmpeg-7.0.tar.bz2
```

Then redeploy using GitHub Actions or gcloud.

### Clean Up Old Files

Run cleanup periodically:

```typescript
// Delete files older than 7 days
await VideoTranscodingService.cleanupOldFiles(7);
```

Or use GCS lifecycle policies:

```bash
cat > lifecycle.json << EOF
{
  "lifecycle": {
    "rule": [{
      "action": {"type": "Delete"},
      "condition": {"age": 7}
    }]
  }
}
EOF

gcloud storage buckets update gs://preprocessing-${PROJECT_ID} \
  --lifecycle-file=lifecycle.json

gcloud storage buckets update gs://transcoded-${PROJECT_ID} \
  --lifecycle-file=lifecycle.json
```

## Security Considerations

1. **Service Account Permissions**
   - Minimal permissions (read preprocessing, write transcoded)
   - No access to main application bucket

2. **Bucket Access**
   - Uniform bucket-level access enabled
   - Service account-only access (no public)

3. **Signed URLs**
   - Use signed URLs for temporary access
   - 1-hour expiration by default

4. **Input Validation**
   - Validate file types before uploading
   - Check file sizes to prevent abuse
   - Sanitize filenames

## Support

For issues or questions:

1. Check Cloud Run logs
2. Verify GPU quota
3. Test with sample video
4. Review FFmpeg arguments
5. Contact DevOps team

## References

- [Google Cloud Run GPU Documentation](https://cloud.google.com/run/docs/configuring/services/gpu)
- [FFmpeg NVIDIA Hardware Acceleration](https://docs.nvidia.com/video-technologies/video-codec-sdk/ffmpeg-with-nvidia-gpu/)
- [Cloud Run Jobs Documentation](https://cloud.google.com/run/docs/create-jobs)

---

**Last Updated:** 2025-12-02
**Version:** 1.0.0
