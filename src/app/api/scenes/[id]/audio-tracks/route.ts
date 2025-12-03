import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { sceneAudioTracks } from '@/models/Schema';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/scenes/[id]/audio-tracks - Get all audio tracks for a scene
export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id: sceneId } = await context.params;

    const tracks = await db
      .select()
      .from(sceneAudioTracks)
      .where(eq(sceneAudioTracks.sceneId, sceneId))
      .orderBy(sceneAudioTracks.sequenceNumber);

    return NextResponse.json({
      sceneId,
      audioTracks: tracks,
      count: tracks.length,
    });
  } catch (error) {
    console.error('Error fetching audio tracks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audio tracks' },
      { status: 500 },
    );
  }
}

// POST /api/scenes/[id]/audio-tracks - Add audio track to scene
export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id: sceneId } = await context.params;
    const body = await request.json();

    const {
      audioId,
      audioUrl,
      title,
      startTimeSeconds = 0,
      durationSeconds,
      volume = 100,
      sequenceNumber,
    } = body;

    if (!audioUrl) {
      return NextResponse.json(
        { error: 'audioUrl is required' },
        { status: 400 },
      );
    }

    // Get next sequence number if not provided
    let seq = sequenceNumber;
    if (seq === undefined || seq === null) {
      const existingTracks = await db
        .select()
        .from(sceneAudioTracks)
        .where(eq(sceneAudioTracks.sceneId, sceneId));

      seq = existingTracks.length;
    }

    const [audioTrack] = await db
      .insert(sceneAudioTracks)
      .values({
        sceneId,
        audioId: audioId || null,
        audioUrl,
        title: title || null,
        startTimeSeconds: startTimeSeconds.toString(),
        durationSeconds: durationSeconds ? durationSeconds.toString() : null,
        volume,
        sequenceNumber: seq,
      })
      .returning();

    return NextResponse.json({
      success: true,
      audioTrack,
      message: 'Audio track added successfully',
    });
  } catch (error: any) {
    console.error('Error adding audio track:', error);
    return NextResponse.json(
      {
        error: 'Failed to add audio track',
        details: error.message,
      },
      { status: 500 },
    );
  }
}

// DELETE /api/scenes/[id]/audio-tracks - Delete all audio tracks for scene
export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id: sceneId } = await context.params;

    const result = await db
      .delete(sceneAudioTracks)
      .where(eq(sceneAudioTracks.sceneId, sceneId))
      .returning();

    return NextResponse.json({
      success: true,
      deletedCount: result.length,
      message: `Deleted ${result.length} audio track(s)`,
    });
  } catch (error) {
    console.error('Error deleting audio tracks:', error);
    return NextResponse.json(
      { error: 'Failed to delete audio tracks' },
      { status: 500 },
    );
  }
}
