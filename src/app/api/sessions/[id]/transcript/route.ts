import type { NextRequest } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { generatePresignedUrl } from '@/libs/GCS';
import { handleRBACError, requireWritableSession } from '@/middleware/RBACMiddleware';
import { speakers, transcripts, users, utterances } from '@/models/Schema';

// GET /api/sessions/[id]/transcript - Get transcript and utterances
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    // Fetch transcript
    const [transcript] = await db
      .select()
      .from(transcripts)
      .where(eq(transcripts.sessionId, id))
      .limit(1);

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript not found' },
        { status: 404 },
      );
    }

    // Fetch utterances with speaker and user avatar data
    const utterancesList = await db
      .select({
        id: utterances.id,
        speakerId: utterances.speakerId,
        text: utterances.text,
        startTimeSeconds: utterances.startTimeSeconds,
        endTimeSeconds: utterances.endTimeSeconds,
        confidenceScore: utterances.confidenceScore,
        speaker: {
          speakerLabel: speakers.speakerLabel,
          speakerType: speakers.speakerType,
          speakerName: speakers.speakerName,
          userId: speakers.userId,
        },
        userName: users.name,
        userAvatarUrl: users.avatarUrl,
        userReferenceImageUrl: users.referenceImageUrl,
      })
      .from(utterances)
      .leftJoin(speakers, eq(utterances.speakerId, speakers.id))
      .leftJoin(users, eq(speakers.userId, users.id))
      .where(eq(utterances.transcriptId, transcript.id))
      .orderBy(asc(utterances.startTimeSeconds));

    // Debug: Log first few utterances to see speaker data
    console.log('[Transcript API] First 3 utterances speaker data:', utterancesList.slice(0, 3).map(u => ({
      speakerId: u.speakerId,
      speakerLabel: u.speaker?.speakerLabel,
      speakerName: u.speaker?.speakerName,
      speakerType: u.speaker?.speakerType,
      userName: u.userName,
    })));

    // Generate presigned URLs for avatars (check both referenceImageUrl and avatarUrl)
    const utterancesWithSignedUrls = await Promise.all(
      utterancesList.map(async (utterance) => {
        let signedAvatarUrl = null;

        // Priority: avatarUrl (display image) > referenceImageUrl (AI generation reference)
        const imageUrl = utterance.userAvatarUrl || utterance.userReferenceImageUrl;

        if (imageUrl) {
          try {
            signedAvatarUrl = await generatePresignedUrl(imageUrl, 1);
          } catch (error) {
            console.error('Failed to generate presigned URL for avatar:', error);
          }
        }

        // Compute speaker name with proper fallback (handle empty strings)
        // Priority: 1) Explicitly assigned speakerName, 2) User's name from DB, 3) Speaker label
        const speakerName
          = (utterance.speaker?.speakerName && utterance.speaker.speakerName.trim())
            || (utterance.userName && utterance.userName.trim())
            || utterance.speaker?.speakerLabel
            || 'Unknown Speaker';

        return {
          id: utterance.id,
          speakerId: utterance.speakerId,
          text: utterance.text,
          startTimeSeconds: utterance.startTimeSeconds,
          endTimeSeconds: utterance.endTimeSeconds,
          confidenceScore: utterance.confidenceScore,
          speaker: {
            ...utterance.speaker,
            speakerName,
          },
          avatarUrl: signedAvatarUrl || undefined,
        };
      }),
    );

    return NextResponse.json({
      transcript,
      utterances: utterancesWithSignedUrls,
    });
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transcript' },
      { status: 500 },
    );
  }
}

// POST /api/sessions/[id]/transcript - Create/update transcript
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Verify user has write access (not archived)
    await requireWritableSession(request, id);

    const body = await request.json();
    const { fullText, utterances: utterancesData } = body;

    // Check if transcript exists
    const [existingTranscript] = await db
      .select()
      .from(transcripts)
      .where(eq(transcripts.sessionId, id))
      .limit(1);

    let transcript;

    if (existingTranscript) {
      // Update existing transcript
      [transcript] = await db
        .update(transcripts)
        .set({
          fullText,
          updatedAt: new Date(),
        })
        .where(eq(transcripts.id, existingTranscript.id))
        .returning();

      // Delete existing utterances
      await db.delete(utterances).where(eq(utterances.transcriptId, existingTranscript.id));
    } else {
      // Create new transcript
      [transcript] = await db
        .insert(transcripts)
        .values({
          sessionId: id,
          fullText,
        })
        .returning();
    }

    if (!transcript) {
      return NextResponse.json(
        { error: 'Failed to create or update transcript' },
        { status: 500 },
      );
    }

    // Insert utterances if provided
    if (utterancesData && Array.isArray(utterancesData) && utterancesData.length > 0) {
      await db.insert(utterances).values(
        utterancesData.map((utterance: any, index: number) => ({
          transcriptId: transcript.id,
          speakerId: utterance.speakerId,
          text: utterance.text,
          startTimeSeconds: utterance.startTime?.toString() || '0',
          endTimeSeconds: utterance.endTime?.toString() || '0',
          confidenceScore: utterance.confidence?.toString() || null,
          sequenceNumber: utterance.sequenceNumber !== undefined ? utterance.sequenceNumber : index,
        })),
      );
    }

    return NextResponse.json({ transcript }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Forbidden') || error.message.includes('Unauthorized'))) {
      return handleRBACError(error);
    }
    console.error('Error saving transcript:', error);
    return NextResponse.json(
      { error: 'Failed to save transcript' },
      { status: 500 },
    );
  }
}
