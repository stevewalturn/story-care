import type { NextRequest } from 'next/server';
import type { AudioChunk } from '@/models/Schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { logPHIUpdate } from '@/libs/AuditLogger';
import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { uploadedRecordings, videoProcessingJobs } from '@/models/Schema';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * Trigger Cloud Run job to merge audio chunks
 */
async function triggerMergeJob(jobId: string, recordingId: string, chunks: AudioChunk[]) {
  const projectId = Env.GCS_PROJECT_ID || 'storycare-478114';
  const region = Env.CLOUD_RUN_REGION || 'us-central1';
  const jobName = 'storycare-video-processor';

  // Import Google Cloud Run client
  const { JobsClient } = require('@google-cloud/run').v2;

  const client = new JobsClient();
  const parent = `projects/${projectId}/locations/${region}`;
  const jobPath = `${parent}/jobs/${jobName}`;

  console.log(`🎵 Triggering Cloud Run Job for audio merge retry: ${jobPath}`);

  // Execute the job with environment variables
  const [operation] = await client.runJob({
    name: jobPath,
    overrides: {
      containerOverrides: [{
        env: [
          { name: 'JOB_ID', value: jobId },
          { name: 'JOB_TYPE', value: 'merge_audio_chunks' },
          { name: 'RECORDING_ID', value: recordingId },
          { name: 'CHUNKS_DATA', value: JSON.stringify(chunks) },
        ],
      }],
    },
  });

  return operation.name;
}

/**
 * POST /api/recordings/[id]/retry-merge
 * Retry a failed audio merge job
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireTherapist(request);
    const { id } = await context.params;

    // Fetch recording
    const [recording] = await db
      .select()
      .from(uploadedRecordings)
      .where(eq(uploadedRecordings.id, id))
      .limit(1);

    if (!recording) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }

    // Verify ownership
    if (recording.therapistId !== user.dbUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only allow retrying failed recordings
    if (recording.status !== 'failed') {
      return NextResponse.json(
        { error: `Can only retry failed recordings. Current status: ${recording.status}` },
        { status: 400 },
      );
    }

    // Get chunks
    const chunks = (recording.audioChunks as AudioChunk[]) || [];

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'No audio chunks available to merge' },
        { status: 400 },
      );
    }

    if (chunks.length === 1) {
      // Single chunk - just complete directly
      const finalAudioUrl = chunks[0]?.gcsPath || null;

      await db
        .update(uploadedRecordings)
        .set({
          status: 'completed',
          finalAudioUrl,
          updatedAt: new Date(),
        })
        .where(eq(uploadedRecordings.id, id));

      await logPHIUpdate(user.dbUserId, 'recording', id, request, { action: 'retry_single_chunk' });

      return NextResponse.json({
        success: true,
        recordingId: id,
        status: 'completed',
        chunksCount: 1,
      });
    }

    // Multiple chunks - trigger new Cloud Run job to merge
    try {
      // Create new video processing job record
      const [job] = await db
        .insert(videoProcessingJobs)
        .values({
          jobType: 'merge_audio_chunks',
          status: 'pending',
          progress: 0,
          inputData: {
            recordingId: id,
            chunks,
            totalDurationSeconds: recording.totalDurationSeconds,
            isRetry: true,
          },
          currentStep: 'Retrying audio merge',
          createdByUserId: user.dbUserId,
        })
        .returning();

      if (!job) {
        throw new Error('Failed to create processing job');
      }

      // Update recording status to merging
      await db
        .update(uploadedRecordings)
        .set({
          status: 'merging',
          updatedAt: new Date(),
        })
        .where(eq(uploadedRecordings.id, id));

      // Trigger Cloud Run job
      const executionName = await triggerMergeJob(job.id, id, chunks);

      // Update job with execution info
      await db
        .update(videoProcessingJobs)
        .set({
          status: 'processing',
          cloudRunJobId: executionName || null,
          startedAt: new Date(),
        })
        .where(eq(videoProcessingJobs.id, job.id));

      console.log(`✅ Retry audio merge job ${job.id} started for recording ${id}`);

      await logPHIUpdate(user.dbUserId, 'recording', id, request, { action: 'retry_merge', jobId: job.id });

      return NextResponse.json({
        success: true,
        recordingId: id,
        status: 'merging',
        jobId: job.id,
        chunksCount: chunks.length,
        message: 'Retrying audio merge. This may take a moment.',
      });
    } catch (cloudRunError: any) {
      console.error('Failed to trigger Cloud Run merge job:', cloudRunError);

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to start merge job',
          details: cloudRunError.message,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Error retrying merge:', error);
    return handleAuthError(error);
  }
}
