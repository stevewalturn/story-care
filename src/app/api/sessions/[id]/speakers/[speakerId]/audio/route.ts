import type { NextRequest } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { generatePresignedUrl } from '@/libs/GCS';
import { sessions, speakers, utterances } from '@/models/Schema';

type RouteContext = {
  params: Promise<{ id: string; speakerId: string }>;
};

// GET /api/sessions/[id]/speakers/[speakerId]/audio?index=N - Get audio for specific utterance
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id: sessionId, speakerId } = await context.params;

    // Get utterance index from query params (defaults to 0)
    const { searchParams } = new URL(_request.url);
    const utteranceIndex = Number.parseInt(searchParams.get('index') || '0', 10);

    if (utteranceIndex < 0) {
      return NextResponse.json(
        { error: 'Invalid utterance index' },
        { status: 400 },
      );
    }

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

    // Get the SPECIFIC utterance at the index
    const [targetUtterance] = await db
      .select()
      .from(utterances)
      .where(eq(utterances.speakerId, speakerId))
      .orderBy(asc(utterances.sequenceNumber))
      .limit(1)
      .offset(utteranceIndex);

    if (!targetUtterance) {
      return NextResponse.json(
        { error: 'Utterance not found at this index' },
        { status: 404 },
      );
    }

    // Use the specific utterance's time range
    const startTime = Number.parseFloat(targetUtterance.startTimeSeconds || '0');
    const endTime = Number.parseFloat(targetUtterance.endTimeSeconds || '0');

    // Generate fresh presigned URL for the audio file
    // This ensures browser can access it with proper CORS headers
    const presignedAudioUrl = await generatePresignedUrl(session.audioUrl, 1);

    if (!presignedAudioUrl) {
      return NextResponse.json(
        { error: 'Failed to generate audio URL' },
        { status: 500 },
      );
    }

    // Add fragment identifier for time range (HTML5 audio supports this)
    const audioUrl = `${presignedAudioUrl}#t=${startTime},${endTime}`;

    return NextResponse.json({
      audioUrl,
      startTime,
      endTime,
      duration: endTime - startTime,
      utterance: {
        text: targetUtterance.text,
        sequenceNumber: targetUtterance.sequenceNumber,
      },
    });
  } catch (error) {
    console.error('Error generating speaker audio sample:', error);
    return NextResponse.json(
      { error: 'Failed to generate audio sample' },
      { status: 500 },
    );
  }
}
