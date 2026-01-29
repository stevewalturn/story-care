import type { NextRequest } from 'next/server';
import type { AudioChunk } from '@/models/Schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { recordingLinks, uploadedRecordings } from '@/models/Schema';

type RouteContext = {
  params: Promise<{ token: string }>;
};

// POST /api/record/[token]/complete - Mark recording as complete (public, token validated)
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;

    // Fetch and validate link
    const [link] = await db
      .select()
      .from(recordingLinks)
      .where(eq(recordingLinks.token, token))
      .limit(1);

    if (!link) {
      return NextResponse.json({ error: 'Recording link not found' }, { status: 404 });
    }

    // Check link is in recording state
    if (link.status !== 'recording' && link.status !== 'pending') {
      return NextResponse.json(
        { error: 'Recording link is not in recording state' },
        { status: 400 },
      );
    }

    // Parse request body
    const body = await request.json();
    const { recordingId, totalDurationSeconds } = body;

    if (!recordingId) {
      return NextResponse.json({ error: 'recordingId is required' }, { status: 400 });
    }

    // Fetch recording
    const [recording] = await db
      .select()
      .from(uploadedRecordings)
      .where(eq(uploadedRecordings.id, recordingId))
      .limit(1);

    if (!recording) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }

    // Verify recording belongs to this link
    if (recording.recordingLinkId !== link.id) {
      return NextResponse.json({ error: 'Recording does not belong to this link' }, { status: 403 });
    }

    // Get chunks
    const chunks = (recording.audioChunks as AudioChunk[]) || [];

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'No chunks uploaded. Cannot complete empty recording.' },
        { status: 400 },
      );
    }

    // Determine final audio URL
    let finalAudioUrl: string | null = null;
    if (chunks.length === 1) {
      finalAudioUrl = chunks[0]?.gcsPath || null;
    } else {
      finalAudioUrl = `recordings/${recordingId}/`;
    }

    // Calculate final totals
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.sizeBytes, 0);
    const calculatedDuration = chunks.reduce((sum, chunk) => sum + chunk.durationSeconds, 0);

    // Update recording status to completed
    await db
      .update(uploadedRecordings)
      .set({
        status: 'completed',
        finalAudioUrl,
        totalDurationSeconds: totalDurationSeconds || calculatedDuration,
        totalFileSizeBytes: totalSize,
        updatedAt: new Date(),
      })
      .where(eq(uploadedRecordings.id, recordingId));

    // Update link status to completed
    await db
      .update(recordingLinks)
      .set({
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(recordingLinks.id, link.id));

    return NextResponse.json({
      success: true,
      recordingId,
      status: 'completed',
      totalDurationSeconds: totalDurationSeconds || calculatedDuration,
      totalFileSizeBytes: totalSize,
      chunksCount: chunks.length,
      message: 'Recording completed successfully. The therapist will be notified.',
    });
  } catch (error) {
    console.error('Error completing recording:', error);
    return NextResponse.json(
      { error: 'Failed to complete recording' },
      { status: 500 },
    );
  }
}
