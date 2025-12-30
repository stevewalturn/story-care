import type { NextRequest } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { sessions, speakers, transcripts, utterances } from '@/models/Schema';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';

// GET /api/sessions/[id]/speakers - Get all speakers for a session with sample utterances
export async function GET(
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

    // 4. GET TRANSCRIPT ID
    const transcript = await db.query.transcripts.findFirst({
      where: eq(transcripts.sessionId, sessionId),
    });

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript not found for this session' },
        { status: 404 },
      );
    }

    // 4. FETCH ALL SPEAKERS
    const speakersList = await db
      .select()
      .from(speakers)
      .where(eq(speakers.transcriptId, transcript.id));

    // 5. FETCH SAMPLE UTTERANCE FOR EACH SPEAKER
    const speakersWithSamples = await Promise.all(
      speakersList.map(async (speaker) => {
        const [sampleUtterance] = await db
          .select({
            text: utterances.text,
            startTimeSeconds: utterances.startTimeSeconds,
            endTimeSeconds: utterances.endTimeSeconds,
          })
          .from(utterances)
          .where(eq(utterances.speakerId, speaker.id))
          .orderBy(asc(utterances.sequenceNumber))
          .limit(1);

        return {
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
        };
      }),
    );

    return NextResponse.json({
      speakers: speakersWithSamples,
    });
  } catch (error) {
    console.error('Error fetching speakers:', error);
    return handleAuthError(error);
  }
}

// PUT /api/sessions/[id]/speakers - Update speaker assignments
export async function PUT(
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
    const { speakers: speakersData } = body;

    // Debug: Log received data
    console.log('=== RECEIVED SPEAKER UPDATE REQUEST ===');
    console.log('Number of speakers:', speakersData?.length);
    console.log('First speaker data:', speakersData?.[0]);

    if (!Array.isArray(speakersData)) {
      return NextResponse.json(
        { error: 'Invalid speakers data' },
        { status: 400 },
      );
    }

    // 5. UPDATE EACH SPEAKER
    for (const speakerData of speakersData) {
      // Use userId from frontend if provided (fixes group sessions and multiple patients)
      let userId = speakerData.userId || null;

      // Fall back to therapist resolution only if not provided by frontend
      if (!userId && speakerData.type === 'therapist') {
        userId = user.dbUserId;
      }

      // Update speaker record
      await db
        .update(speakers)
        .set({
          speakerType: speakerData.type,
          speakerName: speakerData.name,
          userId,
        })
        .where(eq(speakers.id, speakerData.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating speakers:', error);
    return handleAuthError(error);
  }
}
