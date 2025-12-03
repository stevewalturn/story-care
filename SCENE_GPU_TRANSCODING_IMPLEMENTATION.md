# Scene Creator GPU Transcoding - Implementation Guide

## ✅ Completed
1. Database schema updated with:
   - `scene_audio_tracks` table for multiple audio layers
   - `fitAudioToDuration` field in scenes table
   - `transcodingJobId` field to link to GPU jobs
   - Type exports added

## 🚧 Remaining Implementation Tasks

### 1. Add Audio Processing Methods to VideoService

**File:** `src/services/VideoService.ts`

Add these methods after the existing helper methods:

```typescript
/**
 * Process multiple audio tracks - merge them into one
 */
private static async mergeAudioTracks(
  audioFiles: string[],
  outputPath: string,
  volumes?: number[],
): Promise<void> {
  if (audioFiles.length === 0) return;

  if (audioFiles.length === 1) {
    // Single track - just copy
    fs.copyFileSync(audioFiles[0], outputPath);
    return;
  }

  // Multiple tracks - mix them
  const inputs = audioFiles.map(f => `-i "${f}"`).join(' ');
  const volumeFilters = volumes
    ? audioFiles.map((_, i) => `[${i}:a]volume=${(volumes[i] || 100) / 100}[a${i}]`).join(';')
    : '';
  const mixInputs = volumes
    ? audioFiles.map((_, i) => `[a${i}]`).join('')
    : audioFiles.map((_, i) => `[${i}:a]`).join('');

  const filterComplex = volumes
    ? `-filter_complex "${volumeFilters};${mixInputs}amix=inputs=${audioFiles.length}:duration=longest"`
    : `-filter_complex "${mixInputs}amix=inputs=${audioFiles.length}:duration=longest"`;

  const command = `ffmpeg ${inputs} ${filterComplex} -c:a aac "${outputPath}" -y`;
  await execAsync(command);
}

/**
 * Loop audio to match video duration
 */
private static async loopAudioToFit(
  audioPath: string,
  targetDurationSeconds: number,
  outputPath: string,
): Promise<void> {
  // Get audio duration
  const { stdout } = await execAsync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
  );
  const audioDuration = parseFloat(stdout.trim());

  if (audioDuration >= targetDurationSeconds) {
    // Audio is longer - just trim it
    const command = `ffmpeg -i "${audioPath}" -t ${targetDurationSeconds} -c:a aac "${outputPath}" -y`;
    await execAsync(command);
  } else {
    // Audio is shorter - loop it with crossfade
    const loops = Math.ceil(targetDurationSeconds / audioDuration);
    const fadeOut = Math.min(2, audioDuration * 0.1); // 10% fade or 2s max

    const command = `ffmpeg -stream_loop ${loops} -i "${audioPath}" -t ${targetDurationSeconds} -af "afade=t=out:st=${targetDurationSeconds - fadeOut}:d=${fadeOut}" -c:a aac "${outputPath}" -y`;
    await execAsync(command);
  }
}

/**
 * Fit audio to video duration (stretch/compress)
 */
private static async fitAudioToDuration(
  audioPath: string,
  targetDurationSeconds: number,
  outputPath: string,
): Promise<void> {
  // Get audio duration
  const { stdout } = await execAsync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
  );
  const audioDuration = parseFloat(stdout.trim());
  const tempo = audioDuration / targetDurationSeconds;

  // Use atempo filter (supports 0.5x to 2.0x)
  if (tempo >= 0.5 && tempo <= 2.0) {
    const command = `ffmpeg -i "${audioPath}" -filter:a "atempo=${tempo}" -c:a aac "${outputPath}" -y`;
    await execAsync(command);
  } else {
    // For extreme ratios, use rubberband (if available) or just trim/loop
    console.warn(`Audio tempo ratio ${tempo} is extreme, falling back to loop/trim`);
    await this.loopAudioToFit(audioPath, targetDurationSeconds, outputPath);
  }
}

/**
 * Process multiple audio tracks with settings
 */
private static async processAudioTracks(
  audioTracks: Array<{
    audioUrl: string;
    volume?: number;
    startTime?: number;
    duration?: number;
  }>,
  videoDurationSeconds: number,
  options: {
    loopAudio: boolean;
    fitAudio: boolean;
  },
): Promise<string | null> {
  if (audioTracks.length === 0) return null;

  this.ensureTempDir();

  // Download all audio tracks
  const downloadedAudios: string[] = [];
  for (let i = 0; i < audioTracks.length; i++) {
    const track = audioTracks[i];
    const filename = `audio_${i}_${Date.now()}.aac`;
    const filepath = await this.downloadMedia(track.audioUrl, filename);
    downloadedAudios.push(filepath);
  }

  // Merge if multiple tracks
  const mergedAudio = path.join(this.tempDir, `merged_${Date.now()}.aac`);
  await this.mergeAudioTracks(
    downloadedAudios,
    mergedAudio,
    audioTracks.map(t => t.volume || 100)
  );

  // Apply loop or fit if needed
  const finalAudio = path.join(this.tempDir, `final_audio_${Date.now()}.aac`);

  if (options.fitAudio) {
    await this.fitAudioToDuration(mergedAudio, videoDurationSeconds, finalAudio);
  } else if (options.loopAudio) {
    await this.loopAudioToFit(mergedAudio, videoDurationSeconds, finalAudio);
  } else {
    fs.copyFileSync(mergedAudio, finalAudio);
  }

  // Cleanup intermediate files
  downloadedAudios.forEach(f => fs.unlinkSync(f));
  if (fs.existsSync(mergedAudio)) fs.unlinkSync(mergedAudio);

  return finalAudio;
}
```

### 2. Add GPU Assembly Method to VideoService

Add this new method to VideoService class:

```typescript
/**
 * Assemble scene with GPU-accelerated transcoding
 */
static async assembleSceneWithGPU(
  options: AssembleOptions & {
    audioTracks?: Array<{
      audioUrl: string;
      volume?: number;
      startTime?: number;
      duration?: number;
    }>;
    loopAudio?: boolean;
    fitAudio?: boolean;
  },
): Promise<{
  videoUrl: string;
  transcodingJobId?: string;
}> {
  const { clips, audioTracks = [], loopAudio = false, fitAudio = false } = options;

  // Step 1: Assemble locally with FFmpeg (existing logic)
  const tempOutput = path.join(this.tempDir, `assembled_${Date.now()}.mp4`);

  // Calculate total duration
  const totalDuration = clips.reduce((sum, clip) => sum + clip.duration, 0);

  // Process audio tracks
  const processedAudio = await this.processAudioTracks(
    audioTracks,
    totalDuration,
    { loopAudio, fitAudio }
  );

  // Use existing assembly logic but with processed audio
  await this.assembleVideo({
    ...options,
    outputPath: tempOutput,
    audioTrack: processedAudio || undefined,
  });

  // Step 2: Upload to preprocessing bucket for GPU transcoding
  const VideoTranscodingService = (await import('./VideoTranscodingService')).VideoTranscodingService;

  const inputFilename = `scene-input-${Date.now()}.mp4`;
  const outputFilename = `scene-output-${Date.now()}.mp4`;

  const videoBuffer = fs.readFileSync(tempOutput);
  await VideoTranscodingService.uploadForTranscoding(videoBuffer, inputFilename);

  // Step 3: Start GPU transcoding job
  const job = await VideoTranscodingService.startTranscodingJob({
    inputPath: inputFilename,
    outputFilename,
    format: 'h264',
    quality: 'high',
    width: options.width || 1920,
    height: options.height || 1080,
    fps: options.fps || 30,
  });

  // Step 4: Poll for completion (with timeout)
  const maxWaitTime = 5 * 60 * 1000; // 5 minutes
  const pollInterval = 3000; // 3 seconds
  const startTime = Date.now();

  let jobStatus;
  while (Date.now() - startTime < maxWaitTime) {
    jobStatus = await VideoTranscodingService.getJobStatus(job.executionName);

    if (jobStatus.status === 'SUCCEEDED') {
      break;
    } else if (jobStatus.status === 'FAILED') {
      throw new Error(`GPU transcoding failed: ${jobStatus.error || 'Unknown error'}`);
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  if (jobStatus?.status !== 'SUCCEEDED') {
    throw new Error('GPU transcoding timed out');
  }

  // Step 5: Download transcoded video
  const transcodedBuffer = await VideoTranscodingService.downloadTranscodedVideo(outputFilename);

  // Step 6: Upload final to main GCS bucket
  const finalFilename = `scenes/scene_${Date.now()}.mp4`;
  await uploadFile(transcodedBuffer, finalFilename, 'video/mp4');

  // Step 7: Cleanup
  fs.unlinkSync(tempOutput);
  if (processedAudio) fs.unlinkSync(processedAudio);
  await VideoTranscodingService.deletePreprocessingVideo(inputFilename);
  await VideoTranscodingService.deleteTranscodedVideo(outputFilename);

  return {
    videoUrl: `gs://${process.env.GCS_BUCKET_NAME}/${finalFilename}`,
    transcodingJobId: job.executionName,
  };
}
```

### 3. Update Assembly API Route

**File:** `src/app/api/scenes/[id]/assemble/route.ts`

Replace the POST handler with:

```typescript
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    // Authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let user;
    try {
      user = await verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id: sceneId } = await context.params;

    // Get scene with clips and audio tracks
    const scene = await db.query.scenes.findFirst({
      where: eq(scenes.id, sceneId),
      with: {
        sceneClips: {
          orderBy: [asc(sceneClips.sequenceNumber)],
          with: {
            media: true,
          },
        },
        sceneAudioTracks: {
          orderBy: [asc(sceneAudioTracks.sequenceNumber)],
        },
      },
    });

    if (!scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }

    // Update status to processing
    await db
      .update(scenes)
      .set({ status: 'processing', updatedAt: new Date() })
      .where(eq(scenes.id, sceneId));

    // Prepare clips for assembly
    const clips = scene.sceneClips.map(clip => ({
      mediaUrl: clip.media.fileUrl,
      startTime: parseFloat(clip.startTimeSeconds || '0'),
      duration: parseFloat(clip.endTimeSeconds || '0') - parseFloat(clip.startTimeSeconds || '0'),
      type: clip.media.mediaType as 'image' | 'video',
    }));

    // Prepare audio tracks
    const audioTracks = scene.sceneAudioTracks.map(track => ({
      audioUrl: track.audioUrl,
      volume: track.volume || 100,
      startTime: parseFloat(track.startTimeSeconds || '0'),
      duration: track.durationSeconds ? parseFloat(track.durationSeconds) : undefined,
    }));

    // Assemble with GPU transcoding
    const result = await VideoService.assembleSceneWithGPU({
      clips,
      audioTracks,
      loopAudio: scene.loopAudio || false,
      fitAudio: scene.fitAudioToDuration || false,
      outputPath: `/tmp/scene-${sceneId}.mp4`, // Not used in GPU method but required by type
      width: 1920,
      height: 1080,
      fps: 30,
    });

    // Update scene with results
    await db
      .update(scenes)
      .set({
        assembledVideoUrl: result.videoUrl,
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(scenes.id, sceneId));

    return NextResponse.json({
      success: true,
      videoUrl: result.videoUrl,
      transcodingJobId: result.transcodingJobId,
    });
  } catch (error: any) {
    console.error('[ERROR] Scene assembly failed:', error);

    // Update scene status to failed
    const { id: sceneId } = await context.params;
    await db
      .update(scenes)
      .set({
        status: 'failed',
        processingError: error.message,
        updatedAt: new Date(),
      })
      .where(eq(scenes.id, sceneId));

    return NextResponse.json(
      { error: error.message || 'Failed to assemble scene' },
      { status: 500 },
    );
  }
}
```

### 4. Create Status Polling Route

**File:** `src/app/api/scenes/[id]/assemble/status/route.ts` (NEW FILE)

```typescript
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { verifyIdToken } from '@/libs/FirebaseAdmin';
import { scenes } from '@/models/Schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    try {
      await verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id: sceneId } = await context.params;

    // Get scene
    const [scene] = await db
      .select()
      .from(scenes)
      .where(eq(scenes.id, sceneId))
      .limit(1);

    if (!scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: scene.status,
      assembledVideoUrl: scene.assembledVideoUrl,
      error: scene.processingError,
      updatedAt: scene.updatedAt,
    });
  } catch (error: any) {
    console.error('[ERROR] Get scene status failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get scene status' },
      { status: 500 },
    );
  }
}
```

### 5. Update ScenesClient UI

**File:** `src/app/(auth)/scenes/ScenesClient.tsx`

Add audio settings state (around line 80):

```typescript
const [audioSettings, setAudioSettings] = useState({
  loopAudio: false,
  fitAudio: false,
});
```

Add audio settings UI panel (around line 460, in the sidebar):

```tsx
{/* Audio Settings Panel */}
<div className="rounded-lg border border-gray-200 bg-white p-4">
  <h3 className="mb-3 text-sm font-medium text-gray-900">Audio Settings</h3>
  <div className="space-y-3">
    <label className="flex items-center space-x-2">
      <input
        type="checkbox"
        checked={audioSettings.loopAudio}
        onChange={(e) =>
          setAudioSettings({ ...audioSettings, loopAudio: e.target.checked })
        }
        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
      <span className="text-sm text-gray-700">Loop audio to fit video</span>
    </label>
    <label className="flex items-center space-x-2">
      <input
        type="checkbox"
        checked={audioSettings.fitAudio}
        onChange={(e) =>
          setAudioSettings({ ...audioSettings, fitAudio: e.target.checked })
        }
        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
      <span className="text-sm text-gray-700">Fit audio to video duration</span>
    </label>
    {audioSettings.loopAudio && audioSettings.fitAudio && (
      <p className="text-xs text-amber-600">
        Note: "Fit audio" will override "Loop audio"
      </p>
    )}
  </div>
</div>
```

Update handleExport to include audio settings (around line 400):

```typescript
const handleExport = async () => {
  try {
    setIsExporting(true);
    setExportProgress(0);

    // Save scene first with audio settings
    const savedSceneId = await handleSave(true, audioSettings);

    // Start assembly
    await authenticatedPost(
      `/api/scenes/${savedSceneId}/assemble`,
      user,
      {}
    );

    // Poll for status
    let attempts = 0;
    const maxAttempts = 100; // 5 minutes at 3s intervals

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const status = await authenticatedGet(
        `/api/scenes/${savedSceneId}/assemble/status`,
        user
      );

      if (status.status === 'completed') {
        setExportProgress(100);
        toast.success('Scene exported successfully!');
        break;
      } else if (status.status === 'failed') {
        throw new Error(status.error || 'Export failed');
      }

      // Update progress (approximate)
      setExportProgress(Math.min(95, (attempts / maxAttempts) * 100));
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error('Export timed out');
    }
  } catch (error: any) {
    console.error('Export failed:', error);
    toast.error(error.message || 'Failed to export scene');
  } finally {
    setIsExporting(false);
    setExportProgress(0);
  }
};
```

Update handleSave to save audio tracks and settings:

```typescript
const handleSave = async (silent = false, audioOpts = audioSettings) => {
  // ... existing save logic ...

  // Save audio tracks
  if (audioTracks.length > 0) {
    // Delete existing audio tracks
    await authenticatedPost(
      `/api/scenes/${savedSceneId}/audio-tracks/delete`,
      user,
      {}
    );

    // Create new audio tracks
    for (let i = 0; i < audioTracks.length; i++) {
      await authenticatedPost(
        `/api/scenes/${savedSceneId}/audio-tracks`,
        user,
        {
          audioUrl: audioTracks[i].audioUrl,
          title: audioTracks[i].title || `Audio ${i + 1}`,
          startTimeSeconds: audioTracks[i].startTime,
          durationSeconds: audioTracks[i].duration,
          volume: audioTracks[i].volume || 100,
          sequenceNumber: i,
        }
      );
    }
  }

  // Update scene with audio settings
  await authenticatedPatch(
    `/api/scenes/${savedSceneId}`,
    user,
    {
      loopAudio: audioOpts.loopAudio,
      fitAudioToDuration: audioOpts.fitAudio,
    }
  );

  return savedSceneId;
};
```

### 6. Add Audio Track Management API Routes

**File:** `src/app/api/scenes/[id]/audio-tracks/route.ts` (NEW FILE)

```typescript
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { verifyIdToken } from '@/libs/FirebaseAdmin';
import { sceneAudioTracks } from '@/models/Schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// Create audio track
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await verifyIdToken(token);

    const { id: sceneId } = await context.params;
    const body = await request.json();

    const [track] = await db
      .insert(sceneAudioTracks)
      .values({
        sceneId,
        audioUrl: body.audioUrl,
        title: body.title,
        startTimeSeconds: body.startTimeSeconds?.toString(),
        durationSeconds: body.durationSeconds?.toString(),
        volume: body.volume || 100,
        sequenceNumber: body.sequenceNumber,
      })
      .returning();

    return NextResponse.json(track);
  } catch (error: any) {
    console.error('[ERROR] Create audio track failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create audio track' },
      { status: 500 },
    );
  }
}

// Delete all audio tracks for scene
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await verifyIdToken(token);

    const { id: sceneId } = await context.params;

    await db.delete(sceneAudioTracks).where(eq(sceneAudioTracks.sceneId, sceneId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[ERROR] Delete audio tracks failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete audio tracks' },
      { status: 500 },
    );
  }
}
```

## Testing Checklist

After implementation, test:

1. ✅ Scene assembly with no audio tracks
2. ✅ Scene assembly with single audio track
3. ✅ Scene assembly with multiple audio tracks
4. ✅ Audio looping (short audio, long video)
5. ✅ Audio fitting (stretch/compress)
6. ✅ Audio volume control per track
7. ✅ GPU transcoding job creation
8. ✅ Status polling during export
9. ✅ Error handling (failed transcoding)
10. ✅ Cleanup of temporary files

## Next Steps After Implementation

1. Run database migration to create `scene_audio_tracks` table
2. Test locally with sample scene
3. Deploy GPU transcoding job to Cloud Run (if not done)
4. Test end-to-end flow in dev environment
5. Monitor Cloud Run job logs for issues
6. Optimize audio processing based on real-world usage

## Notes

- Audio processing happens locally for speed
- GPU transcoding optimizes the final video
- Multiple audio tracks are merged before processing
- Loop and fit are mutually exclusive (fit takes precedence)
- Status polling happens every 3 seconds with 5-minute timeout
- All temporary files are cleaned up after assembly
