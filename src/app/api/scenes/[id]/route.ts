import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { generatePresignedUrlsForMedia } from '@/libs/GCS';
import { mediaLibrary, sceneClips, scenes } from '@/models/Schema';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/scenes/[id] - Get single scene with clips
export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id: sceneId } = await context.params;

    // Get scene
    const [scene] = await db
      .select()
      .from(scenes)
      .where(eq(scenes.id, sceneId))
      .limit(1);

    if (!scene) {
      return NextResponse.json(
        { error: 'Scene not found' },
        { status: 404 },
      );
    }

    // Get clips for this scene with media details
    const clipsWithMedia = await db
      .select({
        clip: sceneClips,
        media: mediaLibrary,
      })
      .from(sceneClips)
      .leftJoin(mediaLibrary, eq(sceneClips.mediaId, mediaLibrary.id))
      .where(eq(sceneClips.sceneId, sceneId))
      .orderBy(sceneClips.sequenceNumber);

    // Generate presigned URLs for media items
    const mediaItems = clipsWithMedia
      .map(c => c.media)
      .filter((m): m is NonNullable<typeof m> => m !== null);

    const mediaWithSignedUrls = await generatePresignedUrlsForMedia(mediaItems, 1);

    // Map media back to clips
    const mediaMap = new Map(mediaWithSignedUrls.map(m => [m.id, m]));

    const clips = clipsWithMedia.map(({ clip, media }) => ({
      ...clip,
      media: media ? mediaMap.get(media.id) : null,
    }));

    return NextResponse.json({ scene, clips });
  } catch (error) {
    console.error('Error fetching scene:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scene' },
      { status: 500 },
    );
  }
}

// PUT /api/scenes/[id] - Update scene
export async function PUT(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id: sceneId } = await context.params;
    const body = await request.json();
    const {
      title,
      description,
      assembledVideoUrl,
      durationSeconds,
      status,
    } = body;

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (title !== undefined) {
      updateData.title = title;
    }
    if (description !== undefined) {
      updateData.description = description;
    }
    if (assembledVideoUrl !== undefined) {
      updateData.assembledVideoUrl = assembledVideoUrl;
    }
    if (durationSeconds !== undefined) {
      updateData.durationSeconds = durationSeconds;
    }
    if (status !== undefined) {
      updateData.status = status;
    }

    const [updatedScene] = await db
      .update(scenes)
      .set(updateData)
      .where(eq(scenes.id, sceneId))
      .returning();

    if (!updatedScene) {
      return NextResponse.json(
        { error: 'Scene not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ scene: updatedScene });
  } catch (error) {
    console.error('Error updating scene:', error);
    return NextResponse.json(
      { error: 'Failed to update scene' },
      { status: 500 },
    );
  }
}

// DELETE /api/scenes/[id] - Delete scene
export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id: sceneId } = await context.params;

    const [deletedScene] = await db
      .delete(scenes)
      .where(eq(scenes.id, sceneId))
      .returning();

    if (!deletedScene) {
      return NextResponse.json(
        { error: 'Scene not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scene:', error);
    return NextResponse.json(
      { error: 'Failed to delete scene' },
      { status: 500 },
    );
  }
}
