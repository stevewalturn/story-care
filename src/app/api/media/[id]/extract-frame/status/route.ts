import type { NextRequest } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { generatePresignedUrl } from '@/libs/GCS';
import { requireMediaAccess } from '@/middleware/RBACMiddleware';
import { mediaLibrary, videoProcessingJobs } from '@/models/Schema';
import { handleAuthError } from '@/utils/AuthHelpers';

// GET /api/media/[id]/extract-frame/status
// Poll for frame extraction job status
// Uses same pattern as scene assembly polling
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: mediaId } = await params;

    // Verify user has access to this media
    await requireMediaAccess(request, mediaId);

    // Get job ID from query params (optional - if not provided, get latest job)
    const jobId = request.nextUrl.searchParams.get('jobId');

    // Get the job (latest for this media if no jobId provided)
    let job;
    if (jobId) {
      [job] = await db
        .select()
        .from(videoProcessingJobs)
        .where(
          and(
            eq(videoProcessingJobs.id, jobId),
            eq(videoProcessingJobs.jobType, 'extract_frame'),
          ),
        )
        .limit(1);
    } else {
      // Get latest extract_frame job that references this media
      const jobs = await db
        .select()
        .from(videoProcessingJobs)
        .where(eq(videoProcessingJobs.jobType, 'extract_frame'))
        .orderBy(desc(videoProcessingJobs.createdAt))
        .limit(10);

      // Find job for this media
      job = jobs.find((j) => {
        const inputData = j.inputData as any;
        return inputData?.mediaId === mediaId;
      });
    }

    if (!job) {
      return NextResponse.json(
        { error: 'No frame extraction job found' },
        { status: 404 },
      );
    }

    console.log('[Extract Frame Status] Checking job:', {
      jobId: job.id,
      mediaId,
      status: job.status,
    });

    // Build response based on job status
    if (job.status === 'completed') {
      // Find the extracted frame in media library
      const [extractedFrame] = await db
        .select()
        .from(mediaLibrary)
        .where(
          and(
            eq(mediaLibrary.sourceMediaId, mediaId),
            eq(mediaLibrary.sourceType, 'extracted'),
          ),
        )
        .orderBy(desc(mediaLibrary.createdAt))
        .limit(1);

      let imageWithSignedUrl = null;
      if (extractedFrame) {
        const signedMediaUrl = await generatePresignedUrl(extractedFrame.mediaUrl, 1);
        const signedThumbnailUrl = await generatePresignedUrl(extractedFrame.thumbnailUrl || extractedFrame.mediaUrl, 1);

        imageWithSignedUrl = {
          ...extractedFrame,
          mediaUrl: signedMediaUrl,
          thumbnailUrl: signedThumbnailUrl,
        };
      }

      console.log('[Extract Frame Status] Job completed:', {
        jobId: job.id,
        extractedFrameId: extractedFrame?.id,
      });

      return NextResponse.json({
        success: true,
        status: 'completed',
        jobId: job.id,
        image: imageWithSignedUrl,
        progress: 100,
        currentStep: job.currentStep,
      });
    } else if (job.status === 'failed') {
      console.error('[Extract Frame Status] Job failed:', {
        jobId: job.id,
        error: job.errorMessage,
      });

      return NextResponse.json({
        success: false,
        status: 'failed',
        jobId: job.id,
        error: job.errorMessage || 'Frame extraction failed',
        progress: job.progress,
        currentStep: job.currentStep,
      });
    } else {
      // Still processing or pending
      return NextResponse.json({
        success: true,
        status: job.status,
        jobId: job.id,
        progress: job.progress,
        currentStep: job.currentStep,
        message: job.currentStep || 'Processing...',
      });
    }
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return handleAuthError(error);
    }
    console.error('[Extract Frame Status] Error checking status:', error);
    return NextResponse.json(
      { error: 'Failed to check extraction status' },
      { status: 500 },
    );
  }
}
