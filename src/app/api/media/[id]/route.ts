import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { mediaLibrary } from '@/models/Schema';
import { eq } from 'drizzle-orm';

// GET /api/media/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [media] = await db
      .select()
      .from(mediaLibrary)
      .where(eq(mediaLibrary.id, params.id))
      .limit(1);

    if (!media) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ media });
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}

// PUT /api/media/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
      .where(eq(mediaLibrary.id, params.id))
      .returning();

    if (!updatedMedia) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ media: updatedMedia });
  } catch (error) {
    console.error('Error updating media:', error);
    return NextResponse.json(
      { error: 'Failed to update media' },
      { status: 500 }
    );
  }
}

// DELETE /api/media/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [deletedMedia] = await db
      .delete(mediaLibrary)
      .where(eq(mediaLibrary.id, params.id))
      .returning();

    if (!deletedMedia) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    // TODO: Delete from GCS storage
    // await deleteFile(deletedMedia.storagePath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting media:', error);
    return NextResponse.json(
      { error: 'Failed to delete media' },
      { status: 500 }
    );
  }
}
