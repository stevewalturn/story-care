import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { generatePresignedUrl } from '@/libs/GCS';
import { requireMediaAccess } from '@/middleware/RBACMiddleware';
import { mediaLibrary } from '@/models/Schema';
import { VideoTranscodingService } from '@/services/VideoTranscodingService';
import { handleAuthError } from '@/utils/AuthHelpers';

// POST /api/media/[id]/extract-frame
// Starts an async frame extraction job via Cloud Run Jobs
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Verify user has access to this media
    const user = await requireMediaAccess(request, id);

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

    // Generate presigned URL for the video (1 hour expiry)
    const videoUrl = await generatePresignedUrl(media.mediaUrl, 1);
    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Failed to access video' },
        { status: 500 },
      );
    }

    // Generate unique filenames for the job
    const timestamp = Date.now();
    const inputFilename = `frame-extract-input-${id}-${timestamp}.mp4`;
    const outputFilename = `frame-extract-${id}-${timestamp}.jpg`;

    console.log('[Extract Frame] Starting async job:', {
      mediaId: id,
      inputFilename,
      outputFilename,
    });

    // Upload video to preprocessing bucket for Cloud Run Job
    await VideoTranscodingService.uploadFromUrl(videoUrl, inputFilename);

    // Start frame extraction job via Cloud Run Jobs (has FFmpeg installed)
    const job = await VideoTranscodingService.startFrameExtractionJob({
      inputPath: inputFilename,
      outputFilename,
      timestamp: 'last',
    });

    console.log('[Extract Frame] Job started:', {
      mediaId: id,
      executionName: job.executionName,
      outputFilename,
    });

    // Return job info for polling
    // The client will poll /api/media/[id]/extract-frame/status for completion
    return NextResponse.json({
      success: true,
      status: 'processing',
      jobId: job.executionName,
      outputFilename,
      mediaId: id,
      sourceVideoTitle: media.title,
      patientId: media.patientId,
      therapistId: user.dbUserId,
      tags: media.tags,
    });
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
