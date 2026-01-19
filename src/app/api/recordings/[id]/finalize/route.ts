import type { AudioChunk } from '@/models/Schema';
import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { logPHIUpdate } from '@/libs/AuditLogger';
import { db } from '@/libs/DB';
import { uploadedRecordings } from '@/models/Schema';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/recordings/[id]/finalize - Mark recording as complete
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireTherapist(request);
    const { id } = await context.params;

    // Fetch recording
    const [recording] = await db
      .select()
      .from(uploadedRecordings)
      .where(eq(uploadedRecordings.id, id))
      .limit(1);

    if (!recording) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }

    // Verify ownership
    if (recording.therapistId !== user.dbUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { totalDurationSeconds } = body;

    // Get chunks
    const chunks = (recording.audioChunks as AudioChunk[]) || [];

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: 'No chunks uploaded. Cannot finalize empty recording.' },
        { status: 400 },
      );
    }

    // Determine final audio URL
    // For now, we'll use the first chunk as the final audio if only one chunk
    // In the future, we could merge chunks using FFmpeg via Cloud Run
    let finalAudioUrl: string | null = null;
    if (chunks.length === 1) {
      finalAudioUrl = chunks[0]?.gcsPath || null;
    } else {
      // For multiple chunks, we'll point to the directory
      // The playback system should handle concatenating chunks
      finalAudioUrl = `recordings/${id}/`;
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
      .where(eq(uploadedRecordings.id, id));

    await logPHIUpdate(user.dbUserId, 'recording', id, request, { action: 'finalize' });

    return NextResponse.json({
      success: true,
      recordingId: id,
      status: 'completed',
      totalDurationSeconds: totalDurationSeconds || calculatedDuration,
      totalFileSizeBytes: totalSize,
      chunksCount: chunks.length,
    });
  } catch (error) {
    console.error('Error finalizing recording:', error);
    return handleAuthError(error);
  }
}
