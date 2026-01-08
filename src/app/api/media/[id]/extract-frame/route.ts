import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { generatePresignedUrl } from '@/libs/GCS';
import { requireMediaAccess } from '@/middleware/RBACMiddleware';
import { mediaLibrary } from '@/models/Schema';
import { VideoService } from '@/services/VideoService';
import { handleAuthError } from '@/utils/AuthHelpers';

// POST /api/media/[id]/extract-frame
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

    // Extract last frame using VideoService
    const { imagePath } = await VideoService.extractLastFrameFromUrl(
      videoUrl,
      id,
    );

    // Build extraction metadata (separate from therapist notes)
    const generationMetadata = {
      extractedFrom: id,
      sourceVideoTitle: media.title,
      extractedAt: new Date().toISOString(),
      frameType: 'last',
    };

    // Create new media library entry for the extracted frame
    const newImages = await db.insert(mediaLibrary).values({
      title: `${media.title} - Last Frame`,
      description: `Extracted from video: ${media.title}`,
      mediaType: 'image',
      mediaUrl: imagePath, // Store GCS path, not presigned URL
      thumbnailUrl: imagePath, // Same as media URL for images
      sourceType: 'extracted',
      sourceMediaId: id, // Reference to source video
      patientId: media.patientId,
      createdByTherapistId: user.dbUserId,
      tags: media.tags ? [...media.tags, 'extracted-frame'] : ['extracted-frame'],
      status: 'completed',
      notes: null, // Keep clean for therapist use
      generationMetadata, // Extraction metadata
    }).returning();

    const newImage = (newImages as any[])[0];

    // Generate presigned URL for response
    const signedImageUrl = await generatePresignedUrl(newImage!.mediaUrl, 1);

    return NextResponse.json({
      success: true,
      image: {
        ...newImage,
        mediaUrl: signedImageUrl,
        thumbnailUrl: signedImageUrl,
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return handleAuthError(error);
    }
    console.error('Error extracting last frame:', error);
    return NextResponse.json(
      { error: 'Failed to extract last frame' },
      { status: 500 },
    );
  }
}
