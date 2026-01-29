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

  console.log(`🎵 Triggering Cloud Run Job for audio merge: ${jobPath}`);

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
 * POST /api/recordings/[id]/stop
 * Stop a recording in progress and finalize it with whatever chunks have been uploaded
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

    // Only allow stopping recordings that are in progress
    if (recording.status !== 'recording' && recording.status !== 'uploading') {
      return NextResponse.json(
        { error: `Cannot stop recording with status: ${recording.status}` },
        { status: 400 },
      );
    }

    // Get chunks
    const chunks = (recording.audioChunks as AudioChunk[]) || [];

    if (chunks.length === 0) {
      // No chunks uploaded - mark as failed
      await db
        .update(uploadedRecordings)
        .set({
          status: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(uploadedRecordings.id, id));

      await logPHIUpdate(user.dbUserId, 'recording', id, request, { action: 'stop_empty' });

      return NextResponse.json({
        success: false,
        recordingId: id,
        status: 'failed',
        error: 'No audio chunks were recorded',
      });
    }

    // Calculate totals
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.sizeBytes, 0);
    const totalDuration = chunks.reduce((sum, chunk) => sum + chunk.durationSeconds, 0);

    // Single chunk - just use it directly
    if (chunks.length === 1) {
      const finalAudioUrl = chunks[0]?.gcsPath || null;

      await db
        .update(uploadedRecordings)
        .set({
          status: 'completed',
          finalAudioUrl,
          totalDurationSeconds: totalDuration,
          totalFileSizeBytes: totalSize,
          updatedAt: new Date(),
        })
        .where(eq(uploadedRecordings.id, id));

      await logPHIUpdate(user.dbUserId, 'recording', id, request, { action: 'stop_single_chunk' });

      return NextResponse.json({
        success: true,
        recordingId: id,
        status: 'completed',
        totalDurationSeconds: totalDuration,
        totalFileSizeBytes: totalSize,
        chunksCount: 1,
      });
    }

    // Multiple chunks - trigger Cloud Run job to merge
    try {
      // Create video processing job record
      const [job] = await db
        .insert(videoProcessingJobs)
        .values({
          jobType: 'merge_audio_chunks',
          status: 'pending',
          progress: 0,
          inputData: {
            recordingId: id,
            chunks,
            totalDurationSeconds: totalDuration,
          },
          currentStep: 'Initializing audio merge',
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
          totalDurationSeconds: totalDuration,
          totalFileSizeBytes: totalSize,
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

      console.log(`✅ Audio merge job ${job.id} started for recording ${id}`);

      await logPHIUpdate(user.dbUserId, 'recording', id, request, { action: 'stop_merge', jobId: job.id });

      return NextResponse.json({
        success: true,
        recordingId: id,
        status: 'merging',
        jobId: job.id,
        totalDurationSeconds: totalDuration,
        totalFileSizeBytes: totalSize,
        chunksCount: chunks.length,
        message: 'Recording stopped. Audio chunks are being merged.',
      });
    } catch (cloudRunError: any) {
      console.error('Failed to trigger Cloud Run merge job:', cloudRunError);

      // Fall back to folder path approach
      const finalAudioUrl = `recordings/${id}/`;

      await db
        .update(uploadedRecordings)
        .set({
          status: 'completed',
          finalAudioUrl,
          totalDurationSeconds: totalDuration,
          totalFileSizeBytes: totalSize,
          updatedAt: new Date(),
        })
        .where(eq(uploadedRecordings.id, id));

      await logPHIUpdate(user.dbUserId, 'recording', id, request, { action: 'stop_fallback' });

      return NextResponse.json({
        success: true,
        recordingId: id,
        status: 'completed',
        totalDurationSeconds: totalDuration,
        totalFileSizeBytes: totalSize,
        chunksCount: chunks.length,
        warning: 'Cloud Run merge failed. Audio stored as separate chunks.',
      });
    }
  } catch (error) {
    console.error('Error stopping recording:', error);
    return handleAuthError(error);
  }
}
