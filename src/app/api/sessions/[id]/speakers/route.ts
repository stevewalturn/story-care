import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { generatePresignedUrl } from '@/libs/GCS';
import { groupMembersSchema, sessionsSchema, speakers, transcripts, users } from '@/models/Schema';

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

    // Get therapist name and avatar
    const [therapist] = await db
      .select({
        name: users.name,
        avatarUrl: users.avatarUrl,
        referenceImageUrl: users.referenceImageUrl,
      })
      .from(users)
      .where(eq(users.id, session.therapistId))
      .limit(1);

    // Generate presigned URL for therapist avatar
    let therapistAvatarUrl = null;
    if (therapist) {
      const therapistImageUrl = therapist.referenceImageUrl || therapist.avatarUrl;
      if (therapistImageUrl) {
        try {
          therapistAvatarUrl = await generatePresignedUrl(therapistImageUrl, 1);
        } catch (error) {
          console.error('Failed to generate presigned URL for therapist avatar:', error);
        }
      }
    }

    // Get patient name and avatar if individual session
    let patient = null;
    let patientAvatarUrl = null;
    if (session.patientId) {
      [patient] = await db
        .select({
          name: users.name,
          avatarUrl: users.avatarUrl,
          referenceImageUrl: users.referenceImageUrl,
        })
        .from(users)
        .where(eq(users.id, session.patientId))
        .limit(1);

      // Generate presigned URL for patient avatar
      if (patient) {
        const patientImageUrl = patient.referenceImageUrl || patient.avatarUrl;
        if (patientImageUrl) {
          try {
            patientAvatarUrl = await generatePresignedUrl(patientImageUrl, 1);
          } catch (error) {
            console.error('Failed to generate presigned URL for patient avatar:', error);
          }
        }
      }
    }

    // Get group members if group session
    let groupMembers: any[] = [];
    if (session.groupId) {
      const membersData = await db
        .select({
          userId: groupMembersSchema.patientId,
          userName: users.name,
          userAvatarUrl: users.avatarUrl,
          userReferenceImageUrl: users.referenceImageUrl,
        })
        .from(groupMembersSchema)
        .leftJoin(users, eq(groupMembersSchema.patientId, users.id))
        .where(eq(groupMembersSchema.groupId, session.groupId));

      // Generate presigned URLs for group member avatars
      groupMembers = await Promise.all(
        membersData.map(async (member) => {
          const imageUrl = member.userReferenceImageUrl || member.userAvatarUrl;
          let signedAvatarUrl = null;

          if (imageUrl) {
            try {
              signedAvatarUrl = await generatePresignedUrl(imageUrl, 1);
            } catch (error) {
              console.error('Failed to generate presigned URL for group member avatar:', error);
            }
          }

          return {
            userId: member.userId,
            name: member.userName,
            avatarUrl: signedAvatarUrl || undefined,
          };
        }),
      );
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
          therapistId: session.therapistId,
          patientId: session.patientId,
          therapistAvatarUrl,
          patientAvatarUrl,
        },
        groupMembers,
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
        therapistId: session.therapistId,
        patientId: session.patientId,
        therapistAvatarUrl,
        patientAvatarUrl,
      },
      groupMembers,
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

    // Get session details for auto-linking
    const [session] = await db
      .select({
        therapistId: sessionsSchema.therapistId,
        patientId: sessionsSchema.patientId,
        sessionType: sessionsSchema.sessionType,
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
            // Auto-link userId for individual sessions based on speakerType
            let userId = speaker.userId || null;

            if (session.sessionType === 'individual' && !userId) {
              if (speaker.speakerType === 'therapist') {
                userId = session.therapistId;
              } else if (speaker.speakerType === 'patient' && session.patientId) {
                userId = session.patientId;
              }
            }

            await db
              .update(speakers)
              .set({
                speakerLabel: speaker.speakerLabel,
                speakerType: speaker.speakerType,
                speakerName: speaker.speakerName,
                userId, // Save the userId (auto-linked or from client)
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
