import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { sessions, speakers, transcripts, utterances } from '@/models/Schema';

type RouteContext = {
  params: Promise<{ id: string; speakerId: string }>;
};

// GET /api/sessions/[id]/speakers/[speakerId]/audio - Get audio sample for speaker
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id: sessionId, speakerId } = await context.params;

    // Get session to retrieve main audio URL
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (!session || !session.audioUrl) {
      return NextResponse.json(
        { error: 'Session audio not found' },
        { status: 404 },
      );
    }

    // Get speaker info
    const [speaker] = await db
      .select()
      .from(speakers)
      .where(eq(speakers.id, speakerId))
      .limit(1);

    if (!speaker) {
      return NextResponse.json({ error: 'Speaker not found' }, { status: 404 });
    }

    // Get transcript
    const [transcript] = await db
      .select()
      .from(transcripts)
      .where(eq(transcripts.sessionId, sessionId))
      .limit(1);

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript not found' },
        { status: 404 },
      );
    }

    // Get first 3 utterances for this speaker as sample
    const sampleUtterances = await db
      .select()
      .from(utterances)
      .where(eq(utterances.speakerId, speakerId))
      .orderBy(utterances.sequenceNumber)
      .limit(3);

    if (sampleUtterances.length === 0) {
      return NextResponse.json(
        { error: 'No utterances found for this speaker' },
        { status: 404 },
      );
    }

    // Calculate the time range for the sample
    const startTime = Number.parseFloat(sampleUtterances[0]?.startTimeSeconds || '0');
    const endTime = Number.parseFloat(
      sampleUtterances[sampleUtterances.length - 1]?.endTimeSeconds || '0',
    );

    // For now, return the full audio URL with timestamp parameters
    // In a production environment, you would:
    // 1. Use FFmpeg or similar to extract the audio segment
    // 2. Upload the segment to GCS
    // 3. Return a signed URL to the segment
    //
    // For simplicity, we'll return the full audio URL with fragment identifiers
    // that HTML5 audio can use (though browser support varies)
    const audioUrl = `${session.audioUrl}#t=${startTime},${endTime}`;

    return NextResponse.json({
      audioUrl,
      startTime,
      endTime,
      duration: endTime - startTime,
      utterances: sampleUtterances.map(u => ({
        text: u.text,
        startTime: Number.parseFloat(u.startTimeSeconds || '0'),
        endTime: Number.parseFloat(u.endTimeSeconds || '0'),
      })),
    });
  } catch (error) {
    console.error('Error generating speaker audio sample:', error);
    return NextResponse.json(
      { error: 'Failed to generate audio sample' },
      { status: 500 },
    );
  }
}
