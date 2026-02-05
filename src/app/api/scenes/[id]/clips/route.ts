import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { generatePresignedUrl } from '@/libs/GCS';
import { mediaLibrary, sceneClips } from '@/models/Schema';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/scenes/[id]/clips - Get clips for a scene
export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id: sceneId } = await context.params;

    // Get clips with their associated media data
    const clips = await db
      .select({
        id: sceneClips.id,
        sceneId: sceneClips.sceneId,
        mediaId: sceneClips.mediaId,
        sequenceNumber: sceneClips.sequenceNumber,
        startTimeSeconds: sceneClips.startTimeSeconds,
        endTimeSeconds: sceneClips.endTimeSeconds,
        createdAt: sceneClips.createdAt,
        // Media data
        mediaType: mediaLibrary.mediaType,
        mediaUrl: mediaLibrary.mediaUrl,
        thumbnailUrl: mediaLibrary.thumbnailUrl,
        generationPrompt: mediaLibrary.generationPrompt,
      })
      .from(sceneClips)
      .leftJoin(mediaLibrary, eq(sceneClips.mediaId, mediaLibrary.id))
      .where(eq(sceneClips.sceneId, sceneId))
      .orderBy(sceneClips.sequenceNumber);

    // Generate presigned URLs for media
    const clipsWithUrls = await Promise.all(
      clips.map(async (clip) => {
        let signedMediaUrl = clip.mediaUrl;
        let signedThumbnailUrl = clip.thumbnailUrl;

        if (clip.mediaUrl) {
          signedMediaUrl = await generatePresignedUrl(clip.mediaUrl, 1) || clip.mediaUrl;
        }
        if (clip.thumbnailUrl) {
          signedThumbnailUrl = await generatePresignedUrl(clip.thumbnailUrl, 1) || clip.thumbnailUrl;
        }

        return {
          ...clip,
          mediaUrl: signedMediaUrl,
          thumbnailUrl: signedThumbnailUrl,
        };
      }),
    );

    return NextResponse.json({ clips: clipsWithUrls });
  } catch (error) {
    console.error('Error fetching clips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clips' },
      { status: 500 },
    );
  }
}

// POST /api/scenes/[id]/clips - Add clip to scene
export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id: sceneId } = await context.params;
    const body = await request.json();
    const {
      mediaId,
      sequenceNumber,
      startTimeSeconds,
      endTimeSeconds,
    } = body;

    // Validate required fields
    if (mediaId === undefined || sequenceNumber === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: mediaId, sequenceNumber' },
        { status: 400 },
      );
    }

    // Default duration for clips without explicit endTimeSeconds (e.g., images)
    const DEFAULT_CLIP_DURATION_SECONDS = '10';

    // Insert new clip
    const [newClip] = await db
      .insert(sceneClips)
      .values({
        sceneId,
        mediaId,
        sequenceNumber,
        startTimeSeconds: startTimeSeconds || '0',
        endTimeSeconds: endTimeSeconds || DEFAULT_CLIP_DURATION_SECONDS,
      })
      .returning();

    return NextResponse.json({ clip: newClip }, { status: 201 });
  } catch (error) {
    console.error('Error creating clip:', error);
    return NextResponse.json(
      { error: 'Failed to create clip' },
      { status: 500 },
    );
  }
}

// PUT /api/scenes/[id]/clips - Replace all clips for a scene
export async function PUT(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id: sceneId } = await context.params;
    const body = await request.json();
    const { clips } = body;

    if (!Array.isArray(clips)) {
      return NextResponse.json(
        { error: 'clips must be an array' },
        { status: 400 },
      );
    }

    // Delete all existing clips for this scene
    await db.delete(sceneClips).where(eq(sceneClips.sceneId, sceneId));

    // Default duration for clips without explicit endTimeSeconds (e.g., images)
    const DEFAULT_CLIP_DURATION_SECONDS = '10';

    // Insert new clips
    if (clips.length > 0) {
      const newClips = clips.map((clip: any) => ({
        sceneId,
        mediaId: clip.mediaId,
        sequenceNumber: clip.sequenceNumber,
        startTimeSeconds: clip.startTimeSeconds || '0',
        endTimeSeconds: clip.endTimeSeconds || DEFAULT_CLIP_DURATION_SECONDS,
      }));

      await db.insert(sceneClips).values(newClips);
    }

    // Return updated clips
    const updatedClips = await db
      .select()
      .from(sceneClips)
      .where(eq(sceneClips.sceneId, sceneId))
      .orderBy(sceneClips.sequenceNumber);

    return NextResponse.json({ clips: updatedClips });
  } catch (error) {
    console.error('Error updating clips:', error);
    return NextResponse.json(
      { error: 'Failed to update clips' },
      { status: 500 },
    );
  }
}
