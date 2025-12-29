import type { NextRequest } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { speakers, utterances } from '@/models/Schema';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';

// GET /api/sessions/[id]/speakers/[speakerId] - Get speaker with sample utterance
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; speakerId: string }> },
) {
  try {
    // 1. AUTHENTICATE
    await requireTherapist(request);

    // 2. AWAIT PARAMS
    const { speakerId } = await params;

    // 3. FETCH SPEAKER
    const speaker = await db.query.speakers.findFirst({
      where: eq(speakers.id, speakerId),
    });

    if (!speaker) {
      return NextResponse.json(
        { error: 'Speaker not found' },
        { status: 404 },
      );
    }

    // 4. FETCH FIRST UTTERANCE (sample text)
    const [sampleUtterance] = await db
      .select({
        text: utterances.text,
        startTimeSeconds: utterances.startTimeSeconds,
        endTimeSeconds: utterances.endTimeSeconds,
      })
      .from(utterances)
      .where(eq(utterances.speakerId, speakerId))
      .orderBy(asc(utterances.sequenceNumber))
      .limit(1);

    return NextResponse.json({
      speaker: {
        id: speaker.id,
        speakerLabel: speaker.speakerLabel,
        speakerType: speaker.speakerType,
        speakerName: speaker.speakerName,
        userId: speaker.userId,
        totalUtterances: speaker.totalUtterances,
        totalDurationSeconds: speaker.totalDurationSeconds,
        sampleText: sampleUtterance?.text || null,
        sampleStartTime: sampleUtterance?.startTimeSeconds || null,
        sampleEndTime: sampleUtterance?.endTimeSeconds || null,
      },
    });
  } catch (error) {
    console.error('Error fetching speaker:', error);
    return handleAuthError(error);
  }
}
