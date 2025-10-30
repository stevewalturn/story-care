import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { transcripts, utterances, speakers } from '@/models/Schema';
import { eq, asc } from 'drizzle-orm';

// GET /api/sessions/[id]/transcript - Get transcript and utterances
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Fetch transcript
    const [transcript] = await db
      .select()
      .from(transcripts)
      .where(eq(transcripts.sessionId, params.id))
      .limit(1);

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript not found' },
        { status: 404 }
      );
    }

    // Fetch utterances
    const utterancesList = await db
      .select({
        id: utterances.id,
        speakerId: utterances.speakerId,
        text: utterances.text,
        startTime: utterances.startTime,
        endTime: utterances.endTime,
        confidence: utterances.confidence,
        speaker: {
          speakerLabel: speakers.speakerLabel,
          speakerType: speakers.speakerType,
          speakerName: speakers.speakerName,
        },
      })
      .from(utterances)
      .leftJoin(speakers, eq(utterances.speakerId, speakers.id))
      .where(eq(utterances.transcriptId, transcript.id))
      .orderBy(asc(utterances.startTime));

    return NextResponse.json({
      transcript,
      utterances: utterancesList,
    });
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transcript' },
      { status: 500 }
    );
  }
}

// POST /api/sessions/[id]/transcript - Create/update transcript
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { fullText, utterances: utterancesData } = body;

    // Check if transcript exists
    const [existingTranscript] = await db
      .select()
      .from(transcripts)
      .where(eq(transcripts.sessionId, params.id))
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
          sessionId: params.id,
          fullText,
        })
        .returning();
    }

    // Insert utterances if provided
    if (utterancesData && Array.isArray(utterancesData) && utterancesData.length > 0) {
      await db.insert(utterances).values(
        utterancesData.map((utterance: any) => ({
          transcriptId: transcript.id,
          speakerId: utterance.speakerId,
          text: utterance.text,
          startTime: utterance.startTime,
          endTime: utterance.endTime,
          confidence: utterance.confidence,
        }))
      );
    }

    return NextResponse.json({ transcript }, { status: 201 });
  } catch (error) {
    console.error('Error saving transcript:', error);
    return NextResponse.json(
      { error: 'Failed to save transcript' },
      { status: 500 }
    );
  }
}
