# FFmpeg Setup for Video Assembly

StoryCare uses FFmpeg for video assembly in the Scenes editor. FFmpeg must be installed on the server where the application runs.

## Installation

### macOS

Using Homebrew:
```bash
brew install ffmpeg
```

Verify installation:
```bash
ffmpeg -version
```

### Ubuntu/Debian

```bash
sudo apt update
sudo apt install ffmpeg
```

Verify installation:
```bash
ffmpeg -version
```

### Windows

1. Download FFmpeg from https://ffmpeg.org/download.html
2. Extract to a directory (e.g., `C:\ffmpeg`)
3. Add `C:\ffmpeg\bin` to your system PATH
4. Verify in Command Prompt:
```bash
ffmpeg -version
```

### Docker

If deploying with Docker, add to your Dockerfile:

```dockerfile
FROM node:20-alpine

# Install FFmpeg
RUN apk add --no-cache ffmpeg

# ... rest of your Dockerfile
```

## Usage

### Video Assembly Process

The video assembly service (`src/services/VideoService.ts`) handles:

1. **Image to Video Conversion**: Converts static images to video clips with specified duration
2. **Video Trimming**: Trims video clips to the exact duration needed
3. **Concatenation**: Stitches all clips together in sequence
4. **Audio Overlay**: Adds optional background music or narration
5. **Export**: Outputs final assembled video

### API Endpoint

**POST** `/api/scenes/[id]/assemble`

Assembles a scene into a single video file.

**Request Body:**
```json
{
  "audioTrack": "https://example.com/background-music.mp3" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "sceneId": "uuid",
  "assembledVideoUrl": "/assembled-scenes/scene-uuid-timestamp.mp4",
  "durationSeconds": 45.5,
  "clipCount": 5,
  "message": "Scene assembled successfully"
}
```

**GET** `/api/scenes/[id]/assemble`

Check assembly status of a scene.

**Response:**
```json
{
  "sceneId": "uuid",
  "title": "My Scene",
  "status": "completed",
  "assembledVideoUrl": "/assembled-scenes/scene-uuid-timestamp.mp4",
  "durationSeconds": "45.5",
  "isAssembled": true
}
```

## Configuration

### Output Directory

Assembled videos are saved to: `public/assembled-scenes/`

The directory is created automatically if it doesn't exist.

### Video Settings

Default settings (can be customized in `VideoService.ts`):
- **Resolution**: 1920x1080 (Full HD)
- **Frame Rate**: 30 fps
- **Video Codec**: H.264 (libx264)
- **Audio Codec**: AAC
- **Pixel Format**: yuv420p (for broad compatibility)

### Temporary Files

Temporary files during assembly are stored in: `/tmp/video-assembly/`

These files are automatically cleaned up after assembly (optional - can be disabled for debugging).

## Performance Considerations

### Processing Time

Assembly time depends on:
- Number of clips
- Total duration
- Server CPU performance
- Whether clips are images (requires conversion) or videos

**Estimates:**
- 5 clips, 30 seconds total: ~30-60 seconds
- 10 clips, 60 seconds total: ~60-120 seconds
- 20 clips, 120 seconds total: ~120-240 seconds

### Memory Usage

FFmpeg operations are memory-intensive. Ensure:
- At least 2GB RAM available for video processing
- Sufficient disk space in `/tmp` for temporary files
- Consider queueing for multiple simultaneous assemblies

### Production Recommendations

For production deployments:

1. **Background Processing**: Use a job queue (e.g., Bull, BullMQ) to process assemblies in the background
2. **Progress Tracking**: Implement WebSocket or polling to show assembly progress
3. **Cloud Storage**: Upload assembled videos to S3/GCS instead of local disk
4. **Dedicated Workers**: Use separate worker processes/containers for video processing
5. **Rate Limiting**: Limit concurrent assemblies to prevent resource exhaustion

Example with Bull queue:

```typescript
// src/queues/videoQueue.ts
import { Queue } from 'bull';

export const videoQueue = new Queue('video-assembly', {
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

// Processor
videoQueue.process(async (job) => {
  const { sceneId } = job.data;
  // ... assembly logic
  job.progress(50); // Update progress
  // ...
});
```

## Troubleshooting

### "FFmpeg not found" Error

**Issue**: API returns 503 with message about FFmpeg not installed

**Solutions**:
1. Install FFmpeg using instructions above
2. Ensure FFmpeg is in system PATH
3. Restart Node.js process after installation
4. In Docker, rebuild image with FFmpeg included

### "Failed to download media" Error

**Issue**: Cannot download media files for assembly

**Solutions**:
1. Ensure media URLs are accessible from server
2. Check network/firewall settings
3. For local files, verify file paths are correct
4. Check media file permissions

### "Assembly timeout" Error

**Issue**: Assembly takes too long and times out

**Solutions**:
1. Reduce clip count or duration
2. Increase API timeout in Next.js config
3. Use background job processing
4. Optimize video resolution/fps settings

### "Out of memory" Error

**Issue**: FFmpeg process runs out of memory

**Solutions**:
1. Increase Node.js memory limit: `node --max-old-space-size=4096`
2. Process clips in smaller batches
3. Reduce video resolution (e.g., 1280x720)
4. Use dedicated worker with more RAM

## Testing

Test FFmpeg installation:

```bash
# Check version
ffmpeg -version

# Test image to video conversion
ffmpeg -loop 1 -i input.jpg -c:v libx264 -t 5 -pix_fmt yuv420p output.mp4

# Test video concatenation
echo "file 'video1.mp4'" > concat.txt
echo "file 'video2.mp4'" >> concat.txt
ffmpeg -f concat -safe 0 -i concat.txt -c copy output.mp4
```

## Development

For local development without FFmpeg:

The API will return a 503 error with instructions if FFmpeg is not installed. The UI handles this gracefully with an alert message.

To skip video assembly during development:
1. Comment out FFmpeg check in `/api/scenes/[id]/assemble/route.ts`
2. Return mock data instead of calling VideoService
3. Use static video URLs for testing

## Support

If you encounter issues with video assembly:

1. Check FFmpeg installation: `ffmpeg -version`
2. Review server logs for detailed error messages
3. Test FFmpeg commands manually
4. Verify file paths and permissions
5. Check available disk space and memory

For production support, contact your DevOps team or hosting provider about FFmpeg availability.
