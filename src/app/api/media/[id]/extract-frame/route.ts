import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { generatePresignedUrl } from '@/libs/GCS';
import { requireMediaAccess } from '@/middleware/RBACMiddleware';
import { mediaLibrary, videoProcessingJobs } from '@/models/Schema';
import { handleAuthError } from '@/utils/AuthHelpers';

// POST /api/media/[id]/extract-frame
// Starts an async frame extraction job via Cloud Run Jobs
// Uses same pattern as scene assembly - presigned URLs via environment variables
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Verify user has access to this media
    const user = await requireMediaAccess(request, id);

    // Parse request body for optional sessionId
    let sessionId: string | undefined;
    try {
      const body = await request.json();
      sessionId = body.sessionId;
    } catch {
      // Body is optional, ignore parse errors
    }

    // Get the video media item
    const [media] = await db
      .select()
      .from(mediaLibrary)
      .where(eq(mediaLibrary.id, id))
      .limit(1);

    if (!media) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 },
      );
    }

    if (media.mediaType !== 'video') {
      return NextResponse.json(
        { error: 'Media is not a video' },
        { status: 400 },
      );
    }

    // Generate presigned URL for the video (24 hour expiry for Cloud Run processing)
    const videoPresignedUrl = await generatePresignedUrl(media.mediaUrl, 24);
    if (!videoPresignedUrl) {
      return NextResponse.json(
        { error: 'Failed to access video' },
        { status: 500 },
      );
    }

    console.log('[Extract Frame] Starting async job:', {
      mediaId: id,
      videoTitle: media.title,
    });

    // Create video processing job in database (same pattern as scene assembly)
    const jobResult = await db
      .insert(videoProcessingJobs)
      .values({
        jobType: 'extract_frame',
        status: 'pending',
        progress: 0,
        inputData: {
          mediaId: id,
          sessionId,
          videoUrl: videoPresignedUrl,
          sourceVideoTitle: media.title,
          patientId: media.patientId,
          therapistId: user.dbUserId,
          tags: media.tags,
        },
        currentStep: 'Initializing',
        createdByUserId: user.dbUserId,
      })
      .returning();

    const job = jobResult[0];
    if (!job) {
      return NextResponse.json(
        { error: 'Failed to create video processing job' },
        { status: 500 },
      );
    }

    console.log(`🖼️ Created frame extraction job ${job.id} for media ${id}`);

    // Trigger Cloud Run Job using Google Cloud Run API (same as scene assembly)
    const projectId = Env.GCS_PROJECT_ID || 'storycare-478114';
    const region = Env.CLOUD_RUN_REGION || 'us-central1';
    const jobName = 'storycare-video-processor';

    try {
      // Import Google Cloud Run client
      const { JobsClient } = await import('@google-cloud/run');

      const client = new JobsClient();
      const parent = `projects/${projectId}/locations/${region}`;
      const jobPath = `${parent}/jobs/${jobName}`;

      console.log(`🖼️ Triggering Cloud Run Job: ${jobPath}`);

      // Execute the job with environment variables (same pattern as scene assembly)
      console.log(`🖼️ Executing Cloud Run Job with credentials for project: ${Env.GCS_PROJECT_ID}`);
      const [operation] = await client.runJob({
        name: jobPath,
        overrides: {
          containerOverrides: [{
            env: [
              { name: 'JOB_ID', value: job.id },
              { name: 'JOB_TYPE', value: 'extract_frame' },
              { name: 'MEDIA_ID', value: id },
              { name: 'INPUT_URL', value: videoPresignedUrl },
              { name: 'SOURCE_VIDEO_TITLE', value: media.title || 'Video' },
              { name: 'PATIENT_ID', value: media.patientId || '' },
              { name: 'THERAPIST_ID', value: user.dbUserId || '' },
              { name: 'TAGS', value: JSON.stringify(media.tags || []) },
            ],
          }],
        },
      });

      // Get execution name from operation
      const executionName = operation.name;
      console.log(`✅ Job ${job.id} execution started: ${executionName}`, {
        jobPath,
        operationName: operation.name,
        operationDone: operation.done,
      });

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
          mediaId: id,
          executionName,
          status: 'processing',
          message: 'Frame extraction job created and triggered',
        },
        { status: 202 },
      );
    } catch (cloudRunError: any) {
      console.error(`❌ Failed to trigger Cloud Run Job for ${job.id}:`, {
        error: cloudRunError.message,
        code: cloudRunError.code,
        details: cloudRunError.details,
        stack: cloudRunError.stack,
      });

      // Mark job as failed
      await db
        .update(videoProcessingJobs)
        .set({
          status: 'failed',
          errorMessage: `Failed to trigger Cloud Run Job: ${cloudRunError.message}`,
        })
        .where(eq(videoProcessingJobs.id, job.id));

      return NextResponse.json(
        {
          error: 'Failed to trigger frame extraction',
          jobId: job.id,
          details: cloudRunError.message,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return handleAuthError(error);
    }
    console.error('[Extract Frame] Error starting extraction job:', error);
    return NextResponse.json(
      { error: 'Failed to start frame extraction' },
      { status: 500 },
    );
  }
}
