import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { logPHIAccess } from '@/libs/AuditLogger';
import { db } from '@/libs/DB';
import { generatePresignedUrlsForMedia } from '@/libs/GCS';
import { requireMediaAccess } from '@/middleware/RBACMiddleware';
import { mediaLibrary, musicGenerationTasks } from '@/models/Schema';
import { getTherapistPatientIds, handleAuthError } from '@/utils/AuthHelpers';

// GET /api/media/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Verify user has access to this media
    const user = await requireMediaAccess(request, id);

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

    // Log PHI access
    await logPHIAccess(user.dbUserId, 'media', id, request);

    // Generate fresh presigned URL (HIPAA compliant, 1-hour expiration)
    const [mediaWithSignedUrl] = await generatePresignedUrlsForMedia([media], 1);

    return NextResponse.json({ media: mediaWithSignedUrl });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return handleAuthError(error);
    }
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 },
    );
  }
}

// PUT /api/media/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Verify user has access to this media
    const user = await requireMediaAccess(request, id);

    // Therapists must be BOTH the creator AND currently assigned to the patient to edit
    if (user.role === 'therapist') {
      const [media] = await db
        .select({ createdByTherapistId: mediaLibrary.createdByTherapistId, patientId: mediaLibrary.patientId })
        .from(mediaLibrary)
        .where(eq(mediaLibrary.id, id))
        .limit(1);
      if (media) {
        if (media.createdByTherapistId !== user.dbUserId) {
          return NextResponse.json(
            { error: 'Forbidden: Only the media creator can edit this media' },
            { status: 403 },
          );
        }
        const therapistPatientIds = await getTherapistPatientIds(user.dbUserId);
        if (!therapistPatientIds.includes(media.patientId)) {
          return NextResponse.json(
            { error: 'Forbidden: Patient is no longer assigned to you' },
            { status: 403 },
          );
        }
      }
    }

    const body = await request.json();
    const { title, tags, thumbnailUrl, description, notes } = body;

    const [updatedMedia] = await db
      .update(mediaLibrary)
      .set({
        title,
        tags,
        thumbnailUrl,
        description,
        notes,
        updatedAt: new Date(),
      })
      .where(eq(mediaLibrary.id, id))
      .returning();

    if (!updatedMedia) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 },
      );
    }

    // Log PHI modification
    const { logPHIUpdate } = await import('@/libs/AuditLogger');
    await logPHIUpdate(user.dbUserId, 'media', id, request, {
      changedFields: ['title', 'tags', 'thumbnailUrl', 'description', 'notes'],
    });

    return NextResponse.json({ media: updatedMedia });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return handleAuthError(error);
    }
    console.error('Error updating media:', error);
    return NextResponse.json(
      { error: 'Failed to update media' },
      { status: 500 },
    );
  }
}

// PATCH /api/media/[id] - Partial update
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Verify user has access to this media
    const user = await requireMediaAccess(request, id);

    // Therapists must be BOTH the creator AND currently assigned to the patient to edit
    if (user.role === 'therapist') {
      const [media] = await db
        .select({ createdByTherapistId: mediaLibrary.createdByTherapistId, patientId: mediaLibrary.patientId })
        .from(mediaLibrary)
        .where(eq(mediaLibrary.id, id))
        .limit(1);
      if (media) {
        if (media.createdByTherapistId !== user.dbUserId) {
          return NextResponse.json(
            { error: 'Forbidden: Only the media creator can edit this media' },
            { status: 403 },
          );
        }
        const therapistPatientIds = await getTherapistPatientIds(user.dbUserId);
        if (!therapistPatientIds.includes(media.patientId)) {
          return NextResponse.json(
            { error: 'Forbidden: Patient is no longer assigned to you' },
            { status: 403 },
          );
        }
      }
    }

    const body = await request.json();
    const { title, tags, thumbnailUrl, description, notes } = body;

    // Build update object with only provided fields
    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title;
    if (tags !== undefined) updateData.tags = tags;
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
    if (description !== undefined) updateData.description = description;
    if (notes !== undefined) updateData.notes = notes;

    const [updatedMedia] = await db
      .update(mediaLibrary)
      .set(updateData)
      .where(eq(mediaLibrary.id, id))
      .returning();

    if (!updatedMedia) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 },
      );
    }

    // Log PHI modification
    const { logPHIUpdate } = await import('@/libs/AuditLogger');
    await logPHIUpdate(user.dbUserId, 'media', id, request, {
      changedFields: Object.keys(updateData).filter(k => k !== 'updatedAt'),
    });

    // Generate presigned URLs for response
    const [mediaWithSignedUrl] = await generatePresignedUrlsForMedia([updatedMedia], 1);

    return NextResponse.json({ media: mediaWithSignedUrl });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return handleAuthError(error);
    }
    console.error('Error updating media:', error);
    return NextResponse.json(
      { error: 'Failed to update media' },
      { status: 500 },
    );
  }
}

// DELETE /api/media/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Verify user has access to this media
    const user = await requireMediaAccess(request, id);

    // Therapists must be BOTH the creator AND currently assigned to the patient to delete
    if (user.role === 'therapist') {
      const [media] = await db
        .select({ createdByTherapistId: mediaLibrary.createdByTherapistId, patientId: mediaLibrary.patientId })
        .from(mediaLibrary)
        .where(eq(mediaLibrary.id, id))
        .limit(1);
      if (media) {
        if (media.createdByTherapistId !== user.dbUserId) {
          return NextResponse.json(
            { error: 'Forbidden: Only the media creator can delete this media' },
            { status: 403 },
          );
        }
        const therapistPatientIds = await getTherapistPatientIds(user.dbUserId);
        if (!therapistPatientIds.includes(media.patientId)) {
          return NextResponse.json(
            { error: 'Forbidden: Patient is no longer assigned to you' },
            { status: 403 },
          );
        }
      }
    }

    // Clear foreign key references in music_generation_tasks before deleting
    await db
      .update(musicGenerationTasks)
      .set({ mediaId: null })
      .where(eq(musicGenerationTasks.mediaId, id));

    const deletedMedia = await db
      .delete(mediaLibrary)
      .where(eq(mediaLibrary.id, id))
      .returning();

    if (!deletedMedia || (Array.isArray(deletedMedia) && deletedMedia.length === 0)) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 },
      );
    }

    // Log PHI deletion
    const { logPHIDelete } = await import('@/libs/AuditLogger');
    const mediaArray = deletedMedia as any[];
    await logPHIDelete(user.dbUserId, 'media', id, request, {
      mediaType: mediaArray[0]?.mediaType,
    });

    // TODO: Delete from GCS storage
    // await deleteFile(deletedMedia.storagePath);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return handleAuthError(error);
    }
    console.error('Error deleting media:', error);
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 },
    );
  }
}
