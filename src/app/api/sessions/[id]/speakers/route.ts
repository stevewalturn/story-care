import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { speakers } from '@/models/Schema';
import { eq } from 'drizzle-orm';

// GET /api/sessions/[id]/speakers - Get speakers for a session
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const speakersList = await db
      .select()
      .from(speakers)
      .where(eq(speakers.sessionId, params.id))
      .orderBy(speakers.speakerLabel);

    return NextResponse.json({ speakers: speakersList });
  } catch (error) {
    console.error('Error fetching speakers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch speakers' },
      { status: 500 }
    );
  }
}

// PUT /api/sessions/[id]/speakers - Update/save speaker assignments
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { speakers: speakersData } = body;

    if (!Array.isArray(speakersData)) {
      return NextResponse.json(
        { error: 'speakers must be an array' },
        { status: 400 }
      );
    }

    // Delete existing speakers for this session
    await db.delete(speakers).where(eq(speakers.sessionId, params.id));

    // Insert new speaker assignments
    if (speakersData.length > 0) {
      await db.insert(speakers).values(
        speakersData.map((speaker) => ({
          sessionId: params.id,
          speakerLabel: speaker.speakerLabel,
          speakerType: speaker.speakerType,
          speakerName: speaker.speakerName,
          segmentCount: speaker.segmentCount,
          sampleAudioUrl: speaker.sampleAudioUrl,
        }))
      );
    }

    // Fetch updated speakers
    const updatedSpeakers = await db
      .select()
      .from(speakers)
      .where(eq(speakers.sessionId, params.id))
      .orderBy(speakers.speakerLabel);

    return NextResponse.json({ speakers: updatedSpeakers });
  } catch (error) {
    console.error('Error saving speakers:', error);
    return NextResponse.json(
      { error: 'Failed to save speakers' },
      { status: 500 }
    );
  }
}
