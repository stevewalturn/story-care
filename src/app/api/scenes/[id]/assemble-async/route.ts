/**
 * Async Scene Assembly API
 * Creates a video processing job and triggers Cloud Run processing
 */

import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { generatePresignedUrl } from '@/libs/GCS';
import { mediaLibrary, sceneAudioTracks, sceneClips, scenes, videoProcessingJobs } from '@/models/Schema';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/scenes/[id]/assemble-async
 * Create async video processing job for scene assembly
 */
export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { id: sceneId } = await context.params;

    // Get scene details
    const [scene] = await db
      .select()
      .from(scenes)
      .where(eq(scenes.id, sceneId))
      .limit(1);

    if (!scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
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
        { status: 400 }
      );
    }

    // Transform clips for video service with presigned URLs
    const videoClips = await Promise.all(
      clips.map(async (c) => {
        if (!c.media) {
          throw new Error(`Media not found for clip ${c.clip.id}`);
        }

        const gcsPath = c.media.mediaUrl || c.media.thumbnailUrl || '';
        if (!gcsPath) {
          throw new Error(`No media URL found for clip ${c.clip.id}`);
        }

        // Generate presigned URL (24 hour expiry for Cloud Run processing)
        const presignedUrl = await generatePresignedUrl(gcsPath, 24);

        return {
          mediaUrl: presignedUrl,
          startTime: Number.parseFloat(c.clip.startTimeSeconds || '0'),
          duration:
            Number.parseFloat(c.clip.endTimeSeconds || '0') -
            Number.parseFloat(c.clip.startTimeSeconds || '0'),
          type: (c.media.mediaType === 'video' ? 'video' : 'image') as 'video' | 'image',
        };
      })
    );

    // Get audio tracks
    const audioTracksData = await db
      .select()
      .from(sceneAudioTracks)
      .where(eq(sceneAudioTracks.sceneId, sceneId))
      .orderBy(sceneAudioTracks.sequenceNumber);

    // Transform audio tracks with presigned URLs
    const audioTracks = await Promise.all(
      audioTracksData.map(async (track) => {
        let gcsPath = track.audioUrl;

        if (track.audioId) {
          const [media] = await db
            .select({ mediaUrl: mediaLibrary.mediaUrl })
            .from(mediaLibrary)
            .where(eq(mediaLibrary.id, track.audioId))
            .limit(1);

          if (media?.mediaUrl) {
            gcsPath = media.mediaUrl;
          }
        }

        const presignedUrl = await generatePresignedUrl(gcsPath, 24);

        return {
          audioUrl: presignedUrl || track.audioUrl,
          volume: track.volume || 100,
          startTimeSeconds: Number.parseFloat(track.startTimeSeconds || '0'),
        };
      })
    );

    // Prepare input data for Cloud Run
    const inputData = {
      sceneId,
      clips: videoClips,
      audioTracks,
      loopAudio: scene.loopAudio || false,
      fitAudioToDuration: scene.fitAudioToDuration || false,
    };

    // Create video processing job in database
    const jobResult = await db
      .insert(videoProcessingJobs)
      .values({
        sceneId,
        jobType: 'scene_assembly',
        status: 'pending',
        progress: 0,
        inputData,
        currentStep: 'Initializing',
        createdByUserId: scene.createdByTherapistId || undefined,
      })
      .returning();

    const job = jobResult[0];
    if (!job) {
      return NextResponse.json(
        { error: 'Failed to create video processing job' },
        { status: 500 },
      );
    }

    console.log(`🎬 Created video processing job ${job.id} for scene ${sceneId}`);

    // Update scene status to processing
    await db
      .update(scenes)
      .set({
        status: 'processing',
        updatedAt: new Date(),
      })
      .where(eq(scenes.id, sceneId));

    // Trigger Cloud Run Job using Google Cloud Run API
    const projectId = Env.GCS_PROJECT_ID || 'storycare-478114';
    const region = Env.CLOUD_RUN_REGION || 'us-central1';

    // Determine job name based on environment
    const jobName = 'storycare-video-processor';

    try {
      // Import Google Cloud Run client
      const { JobsClient } = require('@google-cloud/run').v2;

      const client = new JobsClient();
      const parent = `projects/${projectId}/locations/${region}`;
      const jobPath = `${parent}/jobs/${jobName}`;

      console.log(`🎬 Triggering Cloud Run Job: ${jobPath}`);

      // Execute the job with environment variables
      const [operation] = await client.runJob({
        name: jobPath,
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

      // Get execution name from operation
      const executionName = operation.name;
      console.log(`✅ Job ${job.id} execution started: ${executionName}`);

      // Update job with Cloud Run execution info
      await db
        .update(videoProcessingJobs)
        .set({
          status: 'processing',
          cloudRunJobId: executionName || null,
          startedAt: new Date(),
        })
        .where(eq(videoProcessingJobs.id, job.id));

      return NextResponse.json(
        {
          success: true,
          jobId: job.id,
          sceneId,
          executionName,
          status: 'processing',
          message: 'Video processing job created and triggered',
        },
        { status: 202 }
      );
    } catch (error: any) {
      console.error(`❌ Failed to trigger Cloud Run Job for ${job.id}:`, error);

      // Mark job and scene as failed
      await db
        .update(videoProcessingJobs)
        .set({
          status: 'failed',
          errorMessage: `Failed to trigger Cloud Run Job: ${error.message}`,
        })
        .where(eq(videoProcessingJobs.id, job.id));

      await db
        .update(scenes)
        .set({
          status: 'failed',
          processingError: `Failed to start video processing: ${error.message}`,
          updatedAt: new Date(),
        })
        .where(eq(scenes.id, sceneId));

      return NextResponse.json(
        {
          error: 'Failed to trigger video processing',
          jobId: job.id,
          details: error.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error creating video processing job:', error);

    // Update scene status to failed
    try {
      const { id } = await context.params;
      await db
        .update(scenes)
        .set({
          status: 'failed',
          processingError: error.message,
          updatedAt: new Date(),
        })
        .where(eq(scenes.id, id));
    } catch (updateError) {
      console.error('Error updating scene status:', updateError);
    }

    return NextResponse.json(
      {
        error: 'Failed to create video processing job',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scenes/[id]/assemble-async
 * Check async assembly job status
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id: sceneId } = await context.params;

    // Get the latest job for this scene
    const [job] = await db
      .select()
      .from(videoProcessingJobs)
      .where(eq(videoProcessingJobs.sceneId, sceneId))
      .orderBy(videoProcessingJobs.createdAt)
      .limit(1);

    if (!job) {
      return NextResponse.json(
        { error: 'No processing job found for this scene' },
        { status: 404 }
      );
    }

    // Get scene info
    const [scene] = await db
      .select()
      .from(scenes)
      .where(eq(scenes.id, sceneId))
      .limit(1);

    // Generate presigned URLs if video is ready
    let assembledVideoUrl = null;
    let thumbnailUrl = null;

    if (job.status === 'completed' && job.outputUrl) {
      assembledVideoUrl = await generatePresignedUrl(job.outputUrl, 1);
    }
    if (job.status === 'completed' && job.thumbnailUrl) {
      thumbnailUrl = await generatePresignedUrl(job.thumbnailUrl, 1);
    }

    return NextResponse.json({
      jobId: job.id,
      sceneId,
      status: job.status,
      progress: job.progress,
      currentStep: job.currentStep,
      assembledVideoUrl,
      thumbnailUrl,
      errorMessage: job.errorMessage,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      durationSeconds: job.durationSeconds,
      sceneStatus: scene?.status,
    });
  } catch (error: any) {
    console.error('Error checking assembly status:', error);
    return NextResponse.json(
      {
        error: 'Failed to check assembly status',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
