import type { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { sceneAudioTracks } from '@/models/Schema';

type RouteContext = {
  params: Promise<{ id: string; trackId: string }>;
};

// DELETE /api/scenes/[id]/audio-tracks/[trackId] - Delete specific audio track
export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id: sceneId, trackId } = await context.params;

    const [deletedTrack] = await db
      .delete(sceneAudioTracks)
      .where(
        and(
          eq(sceneAudioTracks.sceneId, sceneId),
          eq(sceneAudioTracks.id, trackId),
        ),
      )
      .returning();

    if (!deletedTrack) {
      return NextResponse.json(
        { error: 'Audio track not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      deletedTrack,
      message: 'Audio track deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting audio track:', error);
    return NextResponse.json(
      { error: 'Failed to delete audio track' },
      { status: 500 },
    );
  }
}

// PATCH /api/scenes/[id]/audio-tracks/[trackId] - Update audio track
export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id: sceneId, trackId } = await context.params;
    const body = await request.json();

    const updates: any = {};
    if (body.volume !== undefined) updates.volume = body.volume;
    if (body.startTimeSeconds !== undefined) {
      updates.startTimeSeconds = body.startTimeSeconds.toString();
    }
    if (body.durationSeconds !== undefined && body.durationSeconds !== null) {
      updates.durationSeconds = body.durationSeconds.toString();
    }
    if (body.sequenceNumber !== undefined) {
      updates.sequenceNumber = body.sequenceNumber;
    }
    if (body.title !== undefined) updates.title = body.title;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 },
      );
    }

    const [updatedTrack] = await db
      .update(sceneAudioTracks)
      .set(updates)
      .where(
        and(
          eq(sceneAudioTracks.sceneId, sceneId),
          eq(sceneAudioTracks.id, trackId),
        ),
      )
      .returning();

    if (!updatedTrack) {
      return NextResponse.json(
        { error: 'Audio track not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      audioTrack: updatedTrack,
      message: 'Audio track updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating audio track:', error);
    return NextResponse.json(
      {
        error: 'Failed to update audio track',
        details: error.message,
      },
      { status: 500 },
    );
  }
}
