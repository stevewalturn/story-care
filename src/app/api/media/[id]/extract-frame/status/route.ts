import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { generatePresignedUrl, uploadFile } from '@/libs/GCS';
import { requireMediaAccess } from '@/middleware/RBACMiddleware';
import { mediaLibrary } from '@/models/Schema';
import { VideoTranscodingService } from '@/services/VideoTranscodingService';
import { handleAuthError } from '@/utils/AuthHelpers';

// GET /api/media/[id]/extract-frame/status
// Poll for frame extraction job status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Verify user has access to this media
    const user = await requireMediaAccess(request, id);

    // Get query parameters
    const jobId = request.nextUrl.searchParams.get('jobId');
    const outputFilename = request.nextUrl.searchParams.get('outputFilename');
    const sourceVideoTitle = request.nextUrl.searchParams.get('sourceVideoTitle');
    const patientId = request.nextUrl.searchParams.get('patientId');
    const tags = request.nextUrl.searchParams.get('tags');

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId parameter' },
        { status: 400 },
      );
    }

    if (!outputFilename) {
      return NextResponse.json(
        { error: 'Missing outputFilename parameter' },
        { status: 400 },
      );
    }

    console.log('[Extract Frame Status] Checking job:', {
      mediaId: id,
      jobId,
      outputFilename,
    });

    // Check job status via Cloud Run
    const jobStatus = await VideoTranscodingService.getJobStatus(jobId);

    console.log('[Extract Frame Status] Job status:', {
      mediaId: id,
      status: jobStatus.status,
    });

    if (jobStatus.status === 'SUCCEEDED') {
      // Check if output file exists in transcoded bucket
      const fileExists = await VideoTranscodingService.fileExistsInTranscodedBucket(outputFilename);

      if (!fileExists) {
        // Job completed but file not found - might still be uploading
        console.log('[Extract Frame Status] Job succeeded but file not found yet');
        return NextResponse.json({
          success: true,
          status: 'processing',
          message: 'Job completed, waiting for file...',
        });
      }

      // Get the extracted frame from transcoded bucket
      const frameUrl = await VideoTranscodingService.getExtractedFrameUrl(outputFilename);

      // Download the frame and upload to main media bucket
      const frameResponse = await fetch(frameUrl);
      const frameBuffer = Buffer.from(await frameResponse.arrayBuffer());

      // Upload to main GCS bucket
      const { path: mediaPath } = await uploadFile(
        frameBuffer,
        `extracted-${id}.jpg`,
        { folder: 'media/images', contentType: 'image/jpeg' },
      );

      // Get source video for metadata
      const [sourceMedia] = await db
        .select()
        .from(mediaLibrary)
        .where(eq(mediaLibrary.id, id))
        .limit(1);

      // Build extraction metadata
      const generationMetadata = {
        extractedFrom: id,
        sourceVideoTitle: sourceVideoTitle || sourceMedia?.title || 'Unknown',
        extractedAt: new Date().toISOString(),
        frameType: 'last',
        jobId,
      };

      // Parse tags if provided
      let parsedTags: string[] = ['extracted-frame'];
      if (tags) {
        try {
          const tagArray = JSON.parse(tags);
          if (Array.isArray(tagArray)) {
            parsedTags = [...tagArray, 'extracted-frame'];
          }
        } catch {
          // Use default tags
        }
      }

      // Create new media library entry for the extracted frame
      const newImages = await db.insert(mediaLibrary).values({
        title: `${sourceVideoTitle || sourceMedia?.title || 'Video'} - Last Frame`,
        description: `Extracted from video: ${sourceVideoTitle || sourceMedia?.title || 'Unknown'}`,
        mediaType: 'image',
        mediaUrl: mediaPath,
        thumbnailUrl: mediaPath,
        sourceType: 'extracted',
        sourceMediaId: id,
        patientId: patientId || sourceMedia?.patientId || null,
        createdByTherapistId: user.dbUserId,
        tags: parsedTags,
        status: 'completed',
        notes: null,
        generationMetadata,
      }).returning();

      const newImage = (newImages as any[])[0];

      // Generate presigned URL for response
      const signedImageUrl = await generatePresignedUrl(newImage!.mediaUrl, 1);

      // Clean up preprocessing files
      try {
        const inputFilename = `frame-extract-input-${id}-${outputFilename.split('-').pop()?.replace('.jpg', '')}.mp4`;
        await VideoTranscodingService.deletePreprocessingVideo(inputFilename);
        await VideoTranscodingService.deleteTranscodedVideo(outputFilename);
      } catch (cleanupError) {
        console.warn('[Extract Frame Status] Cleanup warning:', cleanupError);
      }

      console.log('[Extract Frame Status] Frame extracted successfully:', {
        mediaId: id,
        newImageId: newImage.id,
      });

      return NextResponse.json({
        success: true,
        status: 'completed',
        image: {
          ...newImage,
          mediaUrl: signedImageUrl,
          thumbnailUrl: signedImageUrl,
        },
      });
    } else if (jobStatus.status === 'FAILED') {
      console.error('[Extract Frame Status] Job failed:', {
        mediaId: id,
        error: jobStatus.error,
      });

      return NextResponse.json({
        success: false,
        status: 'failed',
        error: jobStatus.error || 'Frame extraction failed',
      });
    } else {
      // Still running or pending
      return NextResponse.json({
        success: true,
        status: 'processing',
        jobStatus: jobStatus.status,
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
