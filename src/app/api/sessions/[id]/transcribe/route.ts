import type { NextRequest } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { logPHICreate } from '@/libs/AuditLogger';
import { db } from '@/libs/DB';
import { transcribeAudio } from '@/libs/Deepgram';
import { generatePresignedUrl } from '@/libs/GCS';
import { requireSessionAccess } from '@/middleware/RBACMiddleware';
import { sessions, speakers, transcripts, utterances } from '@/models/Schema';
import { handleAuthError } from '@/utils/AuthHelpers';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/sessions/[id]/transcribe - Transcribe audio
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Verify user has access to this session
    const user = await requireSessionAccess(request, id);

    // Get session
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id));

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (!session.audioUrl) {
      return NextResponse.json(
        { error: 'No audio file found for this session' },
        { status: 400 },
      );
    }

    // Update status to processing
    await db
      .update(sessions)
      .set({ transcriptionStatus: 'processing' })
      .where(eq(sessions.id, id));

    // For re-transcription, delete existing transcript, speakers, and utterances
    const [existingTranscript] = await db
      .select()
      .from(transcripts)
      .where(eq(transcripts.sessionId, id))
      .limit(1);

    if (existingTranscript) {
      // Delete existing utterances first (foreign key dependency)
      await db
        .delete(utterances)
        .where(eq(utterances.transcriptId, existingTranscript.id));

      // Delete existing speakers
      await db
        .delete(speakers)
        .where(eq(speakers.transcriptId, existingTranscript.id));

      // Delete existing transcript
      await db
        .delete(transcripts)
        .where(eq(transcripts.id, existingTranscript.id));
    }

    // Generate presigned URL for Deepgram (valid for 1 hour)
    const audioPresignedUrl = await generatePresignedUrl(session.audioUrl, 1);
    if (!audioPresignedUrl) {
      return NextResponse.json({ error: 'Failed to generate audio URL' }, { status: 500 });
    }
    // Transcribe audio
    const result = await transcribeAudio(audioPresignedUrl);

    // Create transcript
    const transcriptResult = await db
      .insert(transcripts)
      .values({
        sessionId: id,
        fullText: result.text,
      })
      .returning();

    const transcript = transcriptResult[0];
    if (!transcript) {
      throw new Error('Failed to create transcript');
    }

    // Group utterances by speaker
    const speakerMap = new Map<number, string>();
    for (const utterance of result.utterances) {
      if (!speakerMap.has(utterance.speaker)) {
        speakerMap.set(utterance.speaker, `Speaker ${utterance.speaker + 1}`);
      }
    }

    // Create speaker records
    const speakerRecords = await Promise.all(
      Array.from(speakerMap.entries()).map(async ([speakerNum, label]) => {
        const speakerUtterances = result.utterances.filter(
          u => u.speaker === speakerNum,
        );
        const totalDuration = speakerUtterances.reduce(
          (sum, u) => sum + (u.end - u.start),
          0,
        );

        const speakerResult = await db
          .insert(speakers)
          .values({
            transcriptId: transcript.id,
            speakerLabel: label,
            speakerType: null,
            speakerName: null,
            totalUtterances: speakerUtterances.length,
            totalDurationSeconds: Math.round(totalDuration),
          })
          .returning();

        const speaker = speakerResult[0];
        if (!speaker) {
          throw new Error('Failed to create speaker');
        }

        return { speakerNum, speaker };
      }),
    );

    // Create utterance records using bulk insert to avoid connection pool exhaustion
    const utteranceValues = result.utterances
      .map((utterance, index) => {
        const speakerRecord = speakerRecords.find(
          s => s.speakerNum === utterance.speaker,
        );
        if (!speakerRecord?.speaker) {
          return null;
        }

        return {
          transcriptId: transcript.id,
          speakerId: speakerRecord.speaker.id,
          text: utterance.transcript,
          startTimeSeconds: utterance.start.toString(),
          endTimeSeconds: utterance.end.toString(),
          confidenceScore: utterance.confidence ? utterance.confidence.toString() : null,
          sequenceNumber: index,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);

    // Single bulk insert instead of 600+ concurrent operations
    if (utteranceValues.length > 0) {
      await db.insert(utterances).values(utteranceValues);
    }

    // Update session status to transcribed and save audio duration
    await db
      .update(sessions)
      .set({
        transcriptionStatus: 'completed',
        audioDurationSeconds: Math.round(result.duration),
      })
      .where(eq(sessions.id, id));

    // Log PHI creation (transcript generation)
    await logPHICreate(user.dbUserId, 'transcript', transcript.id, request, {
      sessionId: id,
      speakerCount: speakerRecords.length,
      utteranceCount: result.utterances.length,
      duration: result.duration,
    });

    // Fetch sample utterance for each speaker
    const speakersWithSamples = await Promise.all(
      speakerRecords.map(async (record) => {
        const [sampleUtterance] = await db
          .select({ text: utterances.text })
          .from(utterances)
          .where(eq(utterances.speakerId, record.speaker.id))
          .orderBy(asc(utterances.sequenceNumber))
          .limit(1);

        return {
          ...record.speaker,
          sampleText: sampleUtterance?.text || null,
        };
      }),
    );

    return NextResponse.json({
      transcript,
      speakers: speakersWithSamples,
      utteranceCount: result.utterances.length,
    });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return handleAuthError(error);
    }

    console.error('Error transcribing session:', error);

    // Update session status to error
    const { id } = await context.params;
    await db
      .update(sessions)
      .set({ transcriptionStatus: 'failed' })
      .where(eq(sessions.id, id));

    return NextResponse.json(
      { error: 'Failed to transcribe session' },
      { status: 500 },
    );
  }
}
