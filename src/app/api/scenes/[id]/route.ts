import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { extractGcsPath, generatePresignedUrl, generatePresignedUrlsForMedia } from '@/libs/GCS';
import { mediaLibrary, sceneAudioTracks, sceneClips, scenes, users, videoProcessingJobs } from '@/models/Schema';

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

    // Get scene with patient details
    const [sceneWithPatient] = await db
      .select({
        scene: scenes,
        patient: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(scenes)
      .leftJoin(users, eq(scenes.patientId, users.id))
      .where(eq(scenes.id, sceneId))
      .limit(1);

    if (!sceneWithPatient) {
      return NextResponse.json(
        { error: 'Scene not found' },
        { status: 404 },
      );
    }

    const scene = sceneWithPatient.scene;

    // Generate presigned URLs for scene's video and thumbnail
    const assembledVideoUrl = scene.assembledVideoUrl
      ? await generatePresignedUrl(scene.assembledVideoUrl, 1)
      : null;
    const thumbnailUrl = scene.thumbnailUrl
      ? await generatePresignedUrl(scene.thumbnailUrl, 1)
      : null;

    // Update scene with presigned URLs
    const sceneWithSignedUrls = {
      ...scene,
      assembledVideoUrl: assembledVideoUrl || scene.assembledVideoUrl,
      thumbnailUrl: thumbnailUrl || scene.thumbnailUrl,
    };

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

    // Include patient in the scene object if available
    const sceneResponse = {
      ...sceneWithSignedUrls,
      patient: sceneWithPatient.patient?.id ? sceneWithPatient.patient : null,
    };

    return NextResponse.json({ scene: sceneResponse, clips });
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
      // Extract raw GCS path from presigned URL (if applicable)
      const gcsPath = extractGcsPath(assembledVideoUrl);
      updateData.assembledVideoUrl = gcsPath || assembledVideoUrl;
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

    // Check if scene exists first
    const [existingScene] = await db
      .select()
      .from(scenes)
      .where(eq(scenes.id, sceneId))
      .limit(1);

    if (!existingScene) {
      return NextResponse.json(
        { error: 'Scene not found' },
        { status: 404 },
      );
    }

    // Import pageBlocksSchema to delete related records
    const { pageBlocksSchema } = await import('@/models/Schema');

    // Delete related page_blocks that reference this scene
    await db
      .delete(pageBlocksSchema)
      .where(eq(pageBlocksSchema.sceneId, sceneId));

    // Delete related scene_clips
    await db
      .delete(sceneClips)
      .where(eq(sceneClips.sceneId, sceneId));

    // Delete related scene_audio_tracks
    await db
      .delete(sceneAudioTracks)
      .where(eq(sceneAudioTracks.sceneId, sceneId));

    // Delete related video_processing_jobs
    await db
      .delete(videoProcessingJobs)
      .where(eq(videoProcessingJobs.sceneId, sceneId));

    // Finally, delete the scene
    const [deletedScene] = await db
      .delete(scenes)
      .where(eq(scenes.id, sceneId))
      .returning();

    if (!deletedScene) {
      return NextResponse.json(
        { error: 'Failed to delete scene' },
        { status: 500 },
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
