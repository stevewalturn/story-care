import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { generatePresignedUrl } from '@/libs/GCS';
import { sessionsSchema, speakers, transcripts, users } from '@/models/Schema';

// GET /api/sessions/[id]/speakers - Get speakers for a session
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Get session details including type and related users
    const [session] = await db
      .select({
        id: sessionsSchema.id,
        sessionType: sessionsSchema.sessionType,
        therapistId: sessionsSchema.therapistId,
        patientId: sessionsSchema.patientId,
        groupId: sessionsSchema.groupId,
      })
      .from(sessionsSchema)
      .where(eq(sessionsSchema.id, id))
      .limit(1);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 },
      );
    }

    // Get therapist name
    const [therapist] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, session.therapistId))
      .limit(1);

    // Get patient name if individual session
    let patient = null;
    if (session.patientId) {
      [patient] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, session.patientId))
        .limit(1);
    }

    // Get the transcript for this session
    const [transcript] = await db
      .select()
      .from(transcripts)
      .where(eq(transcripts.sessionId, id))
      .limit(1);

    if (!transcript) {
      return NextResponse.json({
        speakers: [],
        sessionContext: {
          sessionType: session.sessionType,
          therapistName: therapist?.name || 'Therapist',
          patientName: patient?.name || 'Patient',
        },
      });
    }

    // Fetch speakers with user avatar data
    const speakersList = await db
      .select({
        id: speakers.id,
        transcriptId: speakers.transcriptId,
        speakerLabel: speakers.speakerLabel,
        speakerType: speakers.speakerType,
        speakerName: speakers.speakerName,
        userId: speakers.userId,
        totalUtterances: speakers.totalUtterances,
        totalDurationSeconds: speakers.totalDurationSeconds,
        createdAt: speakers.createdAt,
        userAvatarUrl: users.avatarUrl,
      })
      .from(speakers)
      .leftJoin(users, eq(speakers.userId, users.id))
      .where(eq(speakers.transcriptId, transcript.id))
      .orderBy(speakers.speakerLabel);

    // Generate presigned URLs for avatars
    const speakersWithSignedUrls = await Promise.all(
      speakersList.map(async (speaker) => {
        const signedAvatarUrl = speaker.userAvatarUrl
          ? await generatePresignedUrl(speaker.userAvatarUrl, 1).catch(() => null)
          : null;

        return {
          ...speaker,
          avatarUrl: signedAvatarUrl || speaker.userAvatarUrl,
        };
      }),
    );

    return NextResponse.json({
      speakers: speakersWithSignedUrls,
      sessionContext: {
        sessionType: session.sessionType,
        therapistName: therapist?.name || 'Therapist',
        patientName: patient?.name || 'Patient',
      },
    });
  } catch (error) {
    console.error('Error fetching speakers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch speakers' },
      { status: 500 },
    );
  }
}

// PUT /api/sessions/[id]/speakers - Update/save speaker assignments
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { speakers: speakersData } = body;

    if (!Array.isArray(speakersData)) {
      return NextResponse.json(
        { error: 'speakers must be an array' },
        { status: 400 },
      );
    }

    // First get the transcript for this session
    const [transcript] = await db
      .select()
      .from(transcripts)
      .where(eq(transcripts.sessionId, id))
      .limit(1);

    if (!transcript) {
      return NextResponse.json(
        { error: 'No transcript found for this session' },
        { status: 404 },
      );
    }

    // Update existing speakers instead of deleting and recreating
    // This preserves the speaker IDs that utterances reference
    if (speakersData.length > 0) {
      await Promise.all(
        speakersData.map(async (speaker) => {
          // Each speaker should have an id from the client
          if (speaker.id) {
            await db
              .update(speakers)
              .set({
                speakerLabel: speaker.speakerLabel,
                speakerType: speaker.speakerType,
                speakerName: speaker.speakerName,
                totalUtterances: speaker.totalUtterances || 0,
                totalDurationSeconds: speaker.totalDurationSeconds || 0,
              })
              .where(eq(speakers.id, speaker.id));
          }
        }),
      );
    }

    // Fetch updated speakers with avatar data
    const updatedSpeakers = await db
      .select({
        id: speakers.id,
        transcriptId: speakers.transcriptId,
        speakerLabel: speakers.speakerLabel,
        speakerType: speakers.speakerType,
        speakerName: speakers.speakerName,
        userId: speakers.userId,
        totalUtterances: speakers.totalUtterances,
        totalDurationSeconds: speakers.totalDurationSeconds,
        createdAt: speakers.createdAt,
        userAvatarUrl: users.avatarUrl,
      })
      .from(speakers)
      .leftJoin(users, eq(speakers.userId, users.id))
      .where(eq(speakers.transcriptId, transcript.id))
      .orderBy(speakers.speakerLabel);

    // Generate presigned URLs for avatars
    const speakersWithSignedUrls = await Promise.all(
      updatedSpeakers.map(async (speaker) => {
        const signedAvatarUrl = speaker.userAvatarUrl
          ? await generatePresignedUrl(speaker.userAvatarUrl, 1).catch(() => null)
          : null;

        return {
          ...speaker,
          avatarUrl: signedAvatarUrl || speaker.userAvatarUrl,
        };
      }),
    );

    return NextResponse.json({ speakers: speakersWithSignedUrls });
  } catch (error) {
    console.error('Error saving speakers:', error);
    return NextResponse.json(
      { error: 'Failed to save speakers' },
      { status: 500 },
    );
  }
}
