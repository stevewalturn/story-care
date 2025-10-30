import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { sceneClips } from '@/models/Schema';

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

    const clips = await db
      .select()
      .from(sceneClips)
      .where(eq(sceneClips.sceneId, sceneId))
      .orderBy(sceneClips.sequenceNumber);

    return NextResponse.json({ clips });
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

    // Insert new clip
    const [newClip] = await db
      .insert(sceneClips)
      .values({
        sceneId,
        mediaId,
        sequenceNumber,
        startTimeSeconds: startTimeSeconds || '0',
        endTimeSeconds: endTimeSeconds || null,
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

// PUT /api/scenes/[id]/clips - Update multiple clips (reorder)
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

    // Update each clip's sequence number
    const updatePromises = clips.map((clip: any) =>
      db
        .update(sceneClips)
        .set({
          sequenceNumber: clip.sequenceNumber,
          startTimeSeconds: clip.startTimeSeconds,
          endTimeSeconds: clip.endTimeSeconds,
        })
        .where(eq(sceneClips.id, clip.id))
        .returning(),
    );

    await Promise.all(updatePromises);

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
