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
    console.log(`[Speakers GET API] Fetching speakers for transcript ${transcript.id} (session ${sessionId})`);
    const speakersList = await db
      .select()
      .from(speakers)
      .where(eq(speakers.transcriptId, transcript.id));

    console.log(`[Speakers GET API] Found ${speakersList.length} speakers:`, speakersList.map(s => ({
      id: s.id,
      speakerLabel: s.speakerLabel,
      speakerName: s.speakerName,
      speakerType: s.speakerType,
    })));

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

    // 4. GET TRANSCRIPT FOR THIS SESSION
    const transcript = await db.query.transcripts.findFirst({
      where: eq(transcripts.sessionId, sessionId),
    });

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript not found for this session' },
        { status: 404 },
      );
    }

    // 5. FETCH VALID SPEAKERS FOR THIS TRANSCRIPT
    const validSpeakers = await db
      .select()
      .from(speakers)
      .where(eq(speakers.transcriptId, transcript.id));

    const validSpeakerIds = new Set(validSpeakers.map(s => s.id));

    // 6. PARSE REQUEST BODY
    const body = await request.json();
    const { speakers: speakersData } = body;

    // Debug: Log received data
    console.log('=== RECEIVED SPEAKER UPDATE REQUEST ===');
    console.log('Session ID:', sessionId);
    console.log('Transcript ID:', transcript.id);
    console.log('Number of speakers in request:', speakersData?.length);
    console.log('First speaker data:', speakersData?.[0]);

    if (!Array.isArray(speakersData)) {
      return NextResponse.json(
        { error: 'Invalid speakers data' },
        { status: 400 },
      );
    }

    console.log(`[Speakers API] Valid speaker IDs for session ${sessionId}:`, Array.from(validSpeakerIds));
    console.log(`[Speakers API] Received speaker IDs:`, speakersData.map((s: any) => s.id));

    // 6. UPDATE EACH SPEAKER (only if ID belongs to this session)
    let updatedCount = 0;
    let skippedCount = 0;

    for (const speakerData of speakersData) {
      // CRITICAL: Verify speaker belongs to this session's transcript
      if (!validSpeakerIds.has(speakerData.id)) {
        console.warn(`[Speakers API] SKIPPING speaker ${speakerData.id} - not found in session ${sessionId}'s transcript`);
        skippedCount++;
        continue;
      }

      // Use userId from frontend if provided (fixes group sessions and multiple patients)
      let userId = speakerData.userId || null;

      // Fall back to therapist resolution only if not provided by frontend
      if (!userId && speakerData.type === 'therapist') {
        userId = user.dbUserId;
      }

      console.log(`[Speakers API] Updating speaker ${speakerData.id}:`, {
        label: speakerData.label,
        type: speakerData.type,
        name: speakerData.name,
        userId,
      });

      // Update speaker record and return result to verify
      const result = await db
        .update(speakers)
        .set({
          speakerType: speakerData.type,
          speakerName: speakerData.name,
          userId,
        })
        .where(eq(speakers.id, speakerData.id))
        .returning();

      if (result.length > 0) {
        updatedCount++;
        console.log(`[Speakers API] Update result for ${speakerData.id}:`, {
          rowsAffected: result.length,
          returnedSpeakerName: result[0]?.speakerName,
          returnedSpeakerType: result[0]?.speakerType,
        });
      }
    }

    // If ALL speakers were skipped, return an error
    if (skippedCount > 0 && updatedCount === 0) {
      console.error(`[Speakers API] ALL speakers skipped - IDs don't match session ${sessionId}`);
      return NextResponse.json(
        {
          error: 'Speaker IDs do not match this session. Please refresh the page and try again.',
          details: {
            receivedIds: speakersData.map((s: any) => s.id),
            validIds: Array.from(validSpeakerIds),
          },
        },
        { status: 400 },
      );
    }

    console.log(`[Speakers API] Summary: ${updatedCount} updated, ${skippedCount} skipped`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating speakers:', error);
    return handleAuthError(error);
  }
}
