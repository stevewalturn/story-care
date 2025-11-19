import type { NextRequest } from 'next/server';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { generatePresignedUrl } from '@/libs/GCS';
import { mediaLibrary, sceneClips, scenes } from '@/models/Schema';
import { VideoService } from '@/services/VideoService';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/scenes/[id]/assemble - Assemble scene into video
export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id: sceneId } = await context.params;

    // Get scene details
    const [scene] = await db
      .select()
      .from(scenes)
      .where(eq(scenes.id, sceneId))
      .limit(1);

    if (!scene) {
      return NextResponse.json(
        { error: 'Scene not found' },
        { status: 404 },
      );
    }

    // Get clips for this scene with media details
    const clips = await db
      .select({
        clip: sceneClips,
        media: mediaLibrary,
      })
      .from(sceneClips)
      .leftJoin(mediaLibrary, eq(sceneClips.mediaId, mediaLibrary.id))
      .where(eq(sceneClips.sceneId, sceneId))
      .orderBy(sceneClips.sequenceNumber);

    if (clips.length === 0) {
      return NextResponse.json(
        { error: 'Scene has no clips to assemble' },
        { status: 400 },
      );
    }

    // Check if FFmpeg is available
    const hasFFmpeg = await VideoService.checkFFmpeg();
    if (!hasFFmpeg) {
      return NextResponse.json(
        {
          error: 'FFmpeg is not installed on the server. Please install FFmpeg to use video assembly.',
          instructions: 'Install FFmpeg: https://ffmpeg.org/download.html',
        },
        { status: 503 },
      );
    }

    // Transform clips for video service
    const videoClips = clips.map((c) => {
      if (!c.media) {
        throw new Error(`Media not found for clip ${c.clip.id}`);
      }

      return {
        mediaUrl: c.media.url || c.media.thumbnailUrl || '',
        startTime: Number.parseFloat(c.clip.startTimeSeconds || '0'),
        duration:
          Number.parseFloat(c.clip.endTimeSeconds || '0') - Number.parseFloat(c.clip.startTimeSeconds || '0'),
        type: (c.media.mediaType === 'video' ? 'video' : 'image') as 'video' | 'image',
      };
    });

    // Update scene status to processing
    await db
      .update(scenes)
      .set({
        status: 'processing',
        updatedAt: new Date(),
      })
      .where(eq(scenes.id, sceneId));

    // Define output path (temp location, will be uploaded to GCS)
    const outputFilename = `scene-${sceneId}-${Date.now()}.mp4`;
    const tempDir = '/tmp/video-assembly';
    const outputPath = path.join(tempDir, outputFilename);

    // Ensure temp directory exists
    const fs = require('node:fs');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Get audio track if specified in request body
    const body = await request.json().catch(() => ({}));
    const { audioTrack } = body;

    // Assemble the scene
    console.error(`Starting assembly for scene ${sceneId} with ${videoClips.length} clips`);

    await VideoService.assembleScene({
      clips: videoClips,
      outputPath,
      audioTrack,
    });

    // Calculate total duration
    const totalDuration = videoClips.reduce((sum, clip) => sum + clip.duration, 0);

    // Upload to GCS and generate thumbnail
    console.error(`Uploading assembled video to GCS for scene ${sceneId}`);
    const { videoUrl, thumbnailUrl, videoPath: gcsVideoPath, thumbnailPath: gcsThumbnailPath } =
      await VideoService.uploadToGCS(outputPath, sceneId);

    // Cleanup local temp files
    VideoService.cleanupTempFiles();

    // Update scene with GCS URLs
    await db
      .update(scenes)
      .set({
        assembledVideoUrl: gcsVideoPath, // Store GCS path for future reference
        thumbnailUrl: gcsThumbnailPath,
        durationSeconds: totalDuration.toString(),
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(scenes.id, sceneId));

    return NextResponse.json({
      success: true,
      sceneId,
      assembledVideoUrl: videoUrl, // Return signed URL for immediate access
      thumbnailUrl,
      durationSeconds: totalDuration,
      clipCount: videoClips.length,
      message: 'Scene assembled successfully',
    });
  } catch (error: any) {
    console.error('Error assembling scene:', error);

    // Update scene status to failed
    try {
      const { id } = await context.params;
      await db
        .update(scenes)
        .set({
          status: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(scenes.id, id));
    } catch (updateError) {
      console.error('Error updating scene status:', updateError);
    }

    return NextResponse.json(
      {
        error: 'Failed to assemble scene',
        details: error.message,
      },
      { status: 500 },
    );
  }
}

// GET /api/scenes/[id]/assemble - Check assembly status
export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id: sceneId } = await context.params;

    const [scene] = await db
      .select({
        id: scenes.id,
        title: scenes.title,
        status: scenes.status,
        assembledVideoUrl: scenes.assembledVideoUrl,
        thumbnailUrl: scenes.thumbnailUrl,
        durationSeconds: scenes.durationSeconds,
      })
      .from(scenes)
      .where(eq(scenes.id, sceneId))
      .limit(1);

    if (!scene) {
      return NextResponse.json(
        { error: 'Scene not found' },
        { status: 404 },
      );
    }

    // Generate presigned URLs for GCS paths
    const assembledVideoUrl = scene.assembledVideoUrl
      ? await generatePresignedUrl(scene.assembledVideoUrl, 1)
      : null;
    const thumbnailUrl = scene.thumbnailUrl
      ? await generatePresignedUrl(scene.thumbnailUrl, 1)
      : null;

    return NextResponse.json({
      sceneId: scene.id,
      title: scene.title,
      status: scene.status,
      assembledVideoUrl,
      thumbnailUrl,
      durationSeconds: scene.durationSeconds,
      isAssembled: !!scene.assembledVideoUrl,
    });
  } catch (error) {
    console.error('Error checking assembly status:', error);
    return NextResponse.json(
      { error: 'Failed to check assembly status' },
      { status: 500 },
    );
  }
}
