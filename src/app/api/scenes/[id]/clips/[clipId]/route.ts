import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { sceneClips } from '@/models/Schema';

type RouteContext = {
  params: Promise<{ id: string; clipId: string }>;
};

// DELETE /api/scenes/[id]/clips/[clipId] - Delete clip
export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { clipId } = await context.params;

    const [deletedClip] = await db
      .delete(sceneClips)
      .where(eq(sceneClips.id, clipId))
      .returning();

    if (!deletedClip) {
      return NextResponse.json(
        { error: 'Clip not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting clip:', error);
    return NextResponse.json(
      { error: 'Failed to delete clip' },
      { status: 500 },
    );
  }
}

// PUT /api/scenes/[id]/clips/[clipId] - Update single clip
export async function PUT(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { clipId } = await context.params;
    const body = await request.json();
    const {
      sequenceNumber,
      startTimeSeconds,
      endTimeSeconds,
    } = body;

    // Build update object
    const updateData: any = {};

    if (sequenceNumber !== undefined) {
      updateData.sequenceNumber = sequenceNumber;
    }
    if (startTimeSeconds !== undefined) {
      updateData.startTimeSeconds = startTimeSeconds;
    }
    if (endTimeSeconds !== undefined) {
      updateData.endTimeSeconds = endTimeSeconds;
    }

    const [updatedClip] = await db
      .update(sceneClips)
      .set(updateData)
      .where(eq(sceneClips.id, clipId))
      .returning();

    if (!updatedClip) {
      return NextResponse.json(
        { error: 'Clip not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ clip: updatedClip });
  } catch (error) {
    console.error('Error updating clip:', error);
    return NextResponse.json(
      { error: 'Failed to update clip' },
      { status: 500 },
    );
  }
}
