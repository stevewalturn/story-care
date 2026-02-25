import type { NextRequest } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { handleRBACError, requireWritableSession } from '@/middleware/RBACMiddleware';
import { groupMembers, sessions, speakers, transcripts, users, utterances } from '@/models/Schema';
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

    // 4. FETCH THERAPIST INFO
    const therapist = await db.query.users.findFirst({
      where: eq(users.id, session.therapistId),
    });

    // 5. FETCH PATIENT INFO (for individual sessions)
    let patient = null;
    if (session.patientId) {
      patient = await db.query.users.findFirst({
        where: eq(users.id, session.patientId),
      });
    }

    // 6. FETCH GROUP MEMBERS (for group sessions)
    let groupMembersList: { userId: string; name: string; avatarUrl?: string | null }[] = [];
    if (session.groupId) {
      const members = await db
        .select({
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl,
        })
        .from(groupMembers)
        .innerJoin(users, eq(groupMembers.patientId, users.id))
        .where(eq(groupMembers.groupId, session.groupId));

      groupMembersList = members.map(m => ({
        userId: m.id,
        name: m.name || 'Unknown',
        avatarUrl: m.avatarUrl,
      }));
    }

    // 7. BUILD SESSION-SPECIFIC PATIENT LIST (only patients in this session)
    // Instead of fetching ALL therapist patients, use only patients from this session
    let therapistPatients: { id: string; name: string; avatarUrl: string | null }[] = [];

    if (session.patientId && patient) {
      // Individual session - only include the session's patient
      therapistPatients = [{
        id: patient.id,
        name: patient.name || 'Unknown',
        avatarUrl: patient.avatarUrl,
      }];
    } else if (session.groupId && groupMembersList.length > 0) {
      // Group session - include all patients from the group
      therapistPatients = groupMembersList.map(m => ({
        id: m.userId,
        name: m.name,
        avatarUrl: m.avatarUrl || null,
      }));
    }

    // 8. GET TRANSCRIPT ID
    const transcript = await db.query.transcripts.findFirst({
      where: eq(transcripts.sessionId, sessionId),
    });

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript not found for this session' },
        { status: 404 },
      );
    }

    // 4. FETCH ALL SPEAKERS (sorted by label for consistent ordering)
    console.log(`[Speakers GET API] Fetching speakers for transcript ${transcript.id} (session ${sessionId})`);
    const speakersList = await db
      .select()
      .from(speakers)
      .where(eq(speakers.transcriptId, transcript.id))
      .orderBy(asc(speakers.speakerLabel));

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
      sessionContext: {
        sessionType: session.sessionType,
        therapistName: therapist?.name || 'Therapist',
        patientName: patient?.name || 'Patient',
        therapistId: session.therapistId,
        patientId: session.patientId,
        therapistAvatarUrl: therapist?.avatarUrl || null,
        patientAvatarUrl: patient?.avatarUrl || null,
      },
      groupMembers: groupMembersList,
      therapistPatients: therapistPatients.map(p => ({
        id: p.id,
        name: p.name || 'Unknown Patient',
        avatarUrl: p.avatarUrl || null,
      })),
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
    // 1. AWAIT PARAMS
    const { id: sessionId } = await params;

    // 2. AUTHENTICATE & VERIFY WRITE ACCESS (not archived)
    const user = await requireWritableSession(request, sessionId);

    // 3. GET TRANSCRIPT FOR THIS SESSION
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
      if (!userId && speakerData.speakerType === 'therapist') {
        userId = user.dbUserId;
      }

      console.log(`[Speakers API] Updating speaker ${speakerData.id}:`, {
        speakerLabel: speakerData.speakerLabel,
        speakerType: speakerData.speakerType,
        speakerName: speakerData.speakerName,
        userId,
      });

      // Update speaker record and return result to verify
      const result = await db
        .update(speakers)
        .set({
          speakerType: speakerData.speakerType,
          speakerName: speakerData.speakerName,
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

    // Mark session as having completed speaker setup
    await db
      .update(sessions)
      .set({
        speakersSetupCompleted: true,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId));

    console.log(`[Speakers API] Marked session ${sessionId} as speakers setup completed`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating speakers:', error);
    if (error instanceof Error && (error.message.includes('Forbidden') || error.message.includes('not found'))) {
      return handleRBACError(error);
    }
    return handleAuthError(error);
  }
}
