import type { NextRequest } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { generatePresignedUrl } from '@/libs/GCS';
import { uploadedRecordings, videoProcessingJobs } from '@/models/Schema';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/recordings/[id]/merge-status
 * Poll the status of an audio merge job for a recording
 */
export async function GET(request: NextRequest, context: RouteContext) {
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

    // Find job that matches this recording from the inputData
    const matchingJobs = await db
      .select()
      .from(videoProcessingJobs)
      .where(eq(videoProcessingJobs.jobType, 'merge_audio_chunks'))
      .orderBy(desc(videoProcessingJobs.createdAt))
      .limit(20);

    const latestJob = matchingJobs.find((j) => {
      const inputData = j.inputData as { recordingId?: string } | null;
      return inputData?.recordingId === id;
    });

    // Generate presigned URL if recording is completed and has final audio
    let audioUrl = null;
    if (recording.status === 'completed' && recording.finalAudioUrl) {
      // Only generate presigned URL if it's a GCS path (not a folder)
      if (!recording.finalAudioUrl.endsWith('/')) {
        audioUrl = await generatePresignedUrl(recording.finalAudioUrl, 1);
      }
    }

    // If no job found but recording has a status, return recording status
    if (!latestJob) {
      return NextResponse.json({
        recordingId: id,
        recordingStatus: recording.status,
        audioUrl,
        message: recording.status === 'completed'
          ? 'Recording is ready'
          : recording.status === 'merging'
            ? 'Merge in progress (job not found)'
            : `Recording status: ${recording.status}`,
      });
    }

    // Build response based on job status
    const response: Record<string, any> = {
      recordingId: id,
      recordingStatus: recording.status,
      jobId: latestJob.id,
      jobStatus: latestJob.status,
      progress: latestJob.progress,
      currentStep: latestJob.currentStep,
      startedAt: latestJob.startedAt,
      completedAt: latestJob.completedAt,
    };

    if (latestJob.status === 'completed') {
      response.audioUrl = audioUrl;
      response.message = 'Audio merge completed successfully';
    } else if (latestJob.status === 'failed') {
      response.errorMessage = latestJob.errorMessage;
      response.message = 'Audio merge failed';
    } else if (latestJob.status === 'processing') {
      response.message = `Merging audio: ${latestJob.currentStep || 'Processing...'}`;
    } else {
      response.message = 'Merge job pending';
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error checking merge status:', error);
    return handleAuthError(error);
  }
}
