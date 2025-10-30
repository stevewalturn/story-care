import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { transcribeAudio } from '@/libs/Deepgram';
import { sessions, speakers, transcripts, utterances } from '@/models/Schema';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/sessions/[id]/transcribe - Transcribe audio
export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

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

    // Transcribe audio
    const result = await transcribeAudio(session.audioUrl);

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

    // Create utterance records
    await Promise.all(
      result.utterances.map(async (utterance, index) => {
        const speakerRecord = speakerRecords.find(
          s => s.speakerNum === utterance.speaker,
        );
        if (speakerRecord && speakerRecord.speaker) {
          await db.insert(utterances).values({
            transcriptId: transcript.id,
            speakerId: speakerRecord.speaker.id,
            text: utterance.transcript,
            startTimeSeconds: utterance.start.toString(),
            endTimeSeconds: utterance.end.toString(),
            confidenceScore: utterance.confidence ? utterance.confidence.toString() : null,
            sequenceNumber: index,
          });
        }
      }),
    );

    // Update session status to transcribed
    await db
      .update(sessions)
      .set({ transcriptionStatus: 'completed' })
      .where(eq(sessions.id, id));

    return NextResponse.json({
      transcript,
      speakers: speakerRecords.map(s => s.speaker),
      utteranceCount: result.utterances.length,
    });
  } catch (error) {
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
