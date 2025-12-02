# Video Transcoding Job

GPU-accelerated video transcoding using Cloud Run Jobs with NVIDIA L4 GPU.

## Quick Start

### 1. Deploy the Job

```bash
# Using GitHub Actions (recommended)
# Go to Actions → Deploy Video Transcoding Job (GPU) → Run workflow

# Or using gcloud:
gcloud builds submit --tag us-central1-docker.pkg.dev/YOUR_PROJECT/cloud-run-source-deploy/video-transcoding --file ../../Dockerfile.transcode
```

### 2. Upload a Video

```bash
gcloud storage cp your-video.mp4 gs://preprocessing-YOUR_PROJECT/
```

### 3. Run Transcoding

```bash
gcloud run jobs execute video-encoding-job \
  --region us-central1 \
  --args="your-video.mp4,output.mp4,-vcodec,h264_nvenc,-cq,21,-movflags,+faststart"
```

### 4. Download Result

```bash
gcloud storage cp gs://transcoded-YOUR_PROJECT/output.mp4 ./
```

## Files

- **entrypoint.sh** - Job entrypoint that runs FFmpeg
- **../../Dockerfile.transcode** - Docker image with GPU FFmpeg
- **README.md** - This file

## Common Transcoding Patterns

### High Quality H.264
```bash
--args="input.mp4,output.mp4,-vcodec,h264_nvenc,-cq,21,-preset,slow,-movflags,+faststart"
```

### Compress Large File (HEVC)
```bash
--args="input.mp4,output.mp4,-vcodec,hevc_nvenc,-cq,23,-preset,medium"
```

### Resize to 720p
```bash
--args="input.mp4,output.mp4,-vcodec,h264_nvenc,-s,1280x720,-cq,23"
```

### Change Frame Rate
```bash
--args="input.mp4,output.mp4,-vcodec,h264_nvenc,-r,30,-cq,23"
```

## Monitoring

### View Job Executions
```bash
gcloud run jobs executions list --job video-encoding-job --region us-central1
```

### View Logs
```bash
gcloud logging read "resource.type=cloud_run_job" --limit 50
```

### Check GPU Usage
Logs will show GPU info automatically when job runs.

## Cost

- **~$0.80/hour** for GPU
- **~$0.40/hour** for CPU (8 vCPU)
- **~$0.04/hour** for Memory (32GB)
- **Total: ~$1.24/hour**

Only charged for actual execution time (not idle).

## See Also

- [GPU_TRANSCODING_GUIDE.md](../../GPU_TRANSCODING_GUIDE.md) - Complete guide
- [FFMPEG_SETUP.md](../../FFMPEG_SETUP.md) - CPU-based FFmpeg
- [VideoService.ts](../../src/services/VideoService.ts) - CPU scene assembly
- [VideoTranscodingService.ts](../../src/services/VideoTranscodingService.ts) - GPU transcoding service
