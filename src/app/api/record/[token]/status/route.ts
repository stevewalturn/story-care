import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { recordingLinks, uploadedRecordings } from '@/models/Schema';

type RouteContext = {
  params: Promise<{ token: string }>;
};

// GET /api/record/[token]/status - Check recording status for polling (public, no auth)
// Used by mobile client to detect when therapist has stopped the recording
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;

    // Find the recording link
    const [link] = await db
      .select({
        id: recordingLinks.id,
        status: recordingLinks.status,
      })
      .from(recordingLinks)
      .where(eq(recordingLinks.token, token))
      .limit(1);

    if (!link) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    // Find associated recording if exists
    const [recording] = await db
      .select({ status: uploadedRecordings.status })
      .from(uploadedRecordings)
      .where(eq(uploadedRecordings.recordingLinkId, link.id))
      .limit(1);

    // Therapist stopped the recording if status changed from recording/uploading
    // to merging or completed
    const stoppedByTherapist
      = recording?.status === 'merging' || recording?.status === 'completed';

    return NextResponse.json({
      linkStatus: link.status,
      recordingStatus: recording?.status ?? null,
      stoppedByTherapist,
    });
  } catch (error) {
    console.error('Error checking recording status:', error);
    return NextResponse.json(
      { error: 'Failed to check recording status' },
      { status: 500 },
    );
  }
}
