import type { NextRequest } from 'next/server';
import { eq, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { sessions, speakers, transcripts, utterances } from '@/models/Schema';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';

// POST /api/sessions/[id]/speakers/merge - Merge multiple speakers into one
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. AUTHENTICATE
    const user = await requireTherapist(request);

    // 2. AWAIT PARAMS
    const { id: sessionId } = await params;

    // 3. VERIFY SESSION ACCESS
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 },
      );
    }

    // Verify therapist owns this session
    if (user.role === 'therapist' && session.therapistId !== user.dbUserId) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this session' },
        { status: 403 },
      );
    }

    // 4. PARSE REQUEST BODY
    const body = await request.json();
    const { speakerIds } = body;

    if (!Array.isArray(speakerIds) || speakerIds.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 speaker IDs required for merge' },
        { status: 400 },
      );
    }

    // 5. GET TRANSCRIPT ID
    const transcript = await db.query.transcripts.findFirst({
      where: eq(transcripts.sessionId, sessionId),
    });

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript not found for this session' },
        { status: 404 },
      );
    }

    // 6. FETCH SPEAKERS TO MERGE
    const speakersToMerge = await db
      .select()
      .from(speakers)
      .where(inArray(speakers.id, speakerIds));

    if (speakersToMerge.length !== speakerIds.length) {
      return NextResponse.json(
        { error: 'One or more speakers not found' },
        { status: 404 },
      );
    }

    // 7. CREATE MERGED SPEAKER
    const firstSpeaker = speakersToMerge[0];
    if (!firstSpeaker) {
      return NextResponse.json(
        { error: 'No speakers found to merge' },
        { status: 404 },
      );
    }

    const mergedLabel = `${firstSpeaker.speakerLabel} (merged)`;
    const totalUtterances = speakersToMerge.reduce((sum, s) => sum + (s.totalUtterances || 0), 0);
    const totalDuration = speakersToMerge.reduce((sum, s) => sum + (s.totalDurationSeconds || 0), 0);

    const [mergedSpeaker] = await db
      .insert(speakers)
      .values({
        transcriptId: transcript.id,
        speakerLabel: mergedLabel,
        speakerType: firstSpeaker.speakerType,
        speakerName: firstSpeaker.speakerName,
        userId: firstSpeaker.userId,
        totalUtterances,
        totalDurationSeconds: totalDuration,
      })
      .returning();

    if (!mergedSpeaker) {
      return NextResponse.json(
        { error: 'Failed to create merged speaker' },
        { status: 500 },
      );
    }

    // 8. UPDATE ALL UTTERANCES TO POINT TO MERGED SPEAKER
    await db
      .update(utterances)
      .set({
        speakerId: mergedSpeaker.id,
      })
      .where(inArray(utterances.speakerId, speakerIds));

    // 9. DELETE OLD SPEAKERS
    await db
      .delete(speakers)
      .where(inArray(speakers.id, speakerIds));

    // 10. GET SAMPLE UTTERANCE
    const [sampleUtterance] = await db
      .select({
        text: utterances.text,
      })
      .from(utterances)
      .where(eq(utterances.speakerId, mergedSpeaker.id))
      .limit(1);

    return NextResponse.json({
      mergedSpeaker: {
        id: mergedSpeaker.id,
        label: mergedSpeaker.speakerLabel,
        type: mergedSpeaker.speakerType,
        name: mergedSpeaker.speakerName,
        userId: mergedSpeaker.userId,
        utteranceCount: totalUtterances,
        totalDuration,
        sampleText: sampleUtterance?.text || 'No sample available',
      },
    });
  } catch (error) {
    console.error('Error merging speakers:', error);
    return handleAuthError(error);
  }
}
