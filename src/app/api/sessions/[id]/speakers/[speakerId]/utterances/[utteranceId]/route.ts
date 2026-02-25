import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { handleRBACError, requireWritableSession } from '@/middleware/RBACMiddleware';
import { speakers, utterances } from '@/models/Schema';

type RouteContext = {
  params: Promise<{ id: string; speakerId: string; utteranceId: string }>;
};

// PATCH /api/sessions/[id]/speakers/[speakerId]/utterances/[utteranceId]
// Reassign utterance to a different speaker
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id: sessionId, speakerId: currentSpeakerId, utteranceId } = await context.params;
    await requireWritableSession(request, sessionId);

    const body = await request.json();
    const { newSpeakerId } = body;

    if (!newSpeakerId) {
      return NextResponse.json(
        { error: 'newSpeakerId is required' },
        { status: 400 },
      );
    }

    // Validate current speaker exists
    const [currentSpeaker] = await db
      .select()
      .from(speakers)
      .where(eq(speakers.id, currentSpeakerId));

    if (!currentSpeaker) {
      return NextResponse.json(
        { error: 'Current speaker not found' },
        { status: 404 },
      );
    }

    // Validate new speaker exists
    const [newSpeaker] = await db
      .select()
      .from(speakers)
      .where(eq(speakers.id, newSpeakerId));

    if (!newSpeaker) {
      return NextResponse.json(
        { error: 'Target speaker not found' },
        { status: 404 },
      );
    }

    // Verify both speakers belong to same transcript
    if (currentSpeaker.transcriptId !== newSpeaker.transcriptId) {
      return NextResponse.json(
        { error: 'Cannot reassign utterance to speaker from different transcript' },
        { status: 400 },
      );
    }

    // Verify utterance exists and belongs to current speaker
    const [existingUtterance] = await db
      .select()
      .from(utterances)
      .where(eq(utterances.id, utteranceId));

    if (!existingUtterance) {
      return NextResponse.json(
        { error: 'Utterance not found' },
        { status: 404 },
      );
    }

    if (existingUtterance.speakerId !== currentSpeakerId) {
      return NextResponse.json(
        { error: 'Utterance does not belong to the specified speaker' },
        { status: 400 },
      );
    }

    // Update utterance speaker
    const [updated] = await db
      .update(utterances)
      .set({ speakerId: newSpeakerId })
      .where(eq(utterances.id, utteranceId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update utterance' },
        { status: 500 },
      );
    }

    // Return updated utterance with new speaker info
    return NextResponse.json({
      utterance: {
        id: updated.id,
        speakerId: newSpeakerId,
        speakerName: newSpeaker.speakerName,
        speakerType: newSpeaker.speakerType,
      },
    });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Forbidden') || error.message.includes('Unauthorized'))) {
      return handleRBACError(error);
    }
    console.error('Error reassigning utterance speaker:', error);
    return NextResponse.json(
      { error: 'Failed to reassign utterance speaker' },
      { status: 500 },
    );
  }
}
