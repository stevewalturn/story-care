import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { logPHIAccess } from '@/libs/AuditLogger';
import { db } from '@/libs/DB';
import { requireMediaAccess } from '@/middleware/RBACMiddleware';
import { mediaLibrary } from '@/models/Schema';
import { handleAuthError } from '@/utils/AuthHelpers';

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

    return NextResponse.json({ media });
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

    const body = await request.json();
    const { title, tags, thumbnailUrl } = body;

    const [updatedMedia] = await db
      .update(mediaLibrary)
      .set({
        title,
        tags,
        thumbnailUrl,
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
      changedFields: ['title', 'tags', 'thumbnailUrl'],
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

// DELETE /api/media/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Verify user has access to this media
    const user = await requireMediaAccess(request, id);

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
