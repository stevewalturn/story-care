import type { NextRequest } from 'next/server';
import type { AudioChunk } from '@/models/Schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { recordingLinks, uploadedRecordings } from '@/models/Schema';

type RouteContext = {
  params: Promise<{ token: string }>;
};

// POST /api/record/[token]/start - Start a recording session (public, token validated)
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
      return NextResponse.json(
        { error: 'Recording link not found' },
        { status: 404 },
      );
    }

    // Check status
    if (link.status === 'revoked') {
      return NextResponse.json(
        { error: 'This recording link has been revoked' },
        { status: 410 },
      );
    }

    if (link.status === 'completed') {
      return NextResponse.json(
        { error: 'This recording link has already been used' },
        { status: 410 },
      );
    }

    // Check expiration
    const now = new Date();
    if (link.expiresAt < now) {
      return NextResponse.json(
        { error: 'This recording link has expired' },
        { status: 410 },
      );
    }

    // Parse request body
    const body = await request.json();
    const { deviceInfo } = body;

    // Check if there's already a recording for this link
    const [existingRecording] = await db
      .select()
      .from(uploadedRecordings)
      .where(eq(uploadedRecordings.recordingLinkId, link.id))
      .limit(1);

    if (existingRecording) {
      // Return existing recording ID if not completed/failed
      if (existingRecording.status === 'recording' || existingRecording.status === 'uploading') {
        // Calculate progress from existing chunks
        const chunks = (existingRecording.audioChunks as AudioChunk[]) || [];
        const savedDurationSeconds = chunks.reduce((sum, chunk) => sum + chunk.durationSeconds, 0);
        const nextChunkIndex = chunks.length;

        return NextResponse.json({
          recordingId: existingRecording.id,
          resumed: true,
          savedDurationSeconds,
          nextChunkIndex,
          chunksCount: chunks.length,
        });
      }

      // If completed or failed, don't allow new recording
      if (existingRecording.status === 'completed' || existingRecording.status === 'used') {
        return NextResponse.json(
          { error: 'This recording link has already been used' },
          { status: 410 },
        );
      }
    }

    // Create recording entry
    const [recording] = await db
      .insert(uploadedRecordings)
      .values({
        source: 'share_link',
        recordingLinkId: link.id,
        therapistId: link.therapistId,
        organizationId: link.organizationId,
        title: link.sessionTitle || `Recording from ${new Date().toLocaleString()}`,
        recordedAt: new Date(),
        status: 'recording',
        deviceInfo: deviceInfo || null,
        audioChunks: [],
      })
      .returning();

    if (!recording) {
      return NextResponse.json({ error: 'Failed to create recording' }, { status: 500 });
    }

    // Update link status to recording
    await db
      .update(recordingLinks)
      .set({
        status: 'recording',
        updatedAt: new Date(),
      })
      .where(eq(recordingLinks.id, link.id));

    return NextResponse.json({
      recordingId: recording.id,
      resumed: false,
    }, { status: 201 });
  } catch (error) {
    console.error('Error starting recording:', error);
    return NextResponse.json(
      { error: 'Failed to start recording' },
      { status: 500 },
    );
  }
}
