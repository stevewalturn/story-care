import type { NextRequest } from 'next/server';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { quotes, sessions, speakers, transcriptsSchema, utterancesSchema } from '@/models/Schema';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';

// GET /api/quotes - List quotes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const sessionId = searchParams.get('sessionId');
    const search = searchParams.get('search');

    // Select with speaker and session info
    let query = db
      .select({
        id: quotes.id,
        quoteText: quotes.quoteText,
        tags: quotes.tags,
        notes: quotes.notes,
        startTimeSeconds: quotes.startTimeSeconds,
        endTimeSeconds: quotes.endTimeSeconds,
        createdAt: quotes.createdAt,
        updatedAt: quotes.updatedAt,
        patientId: quotes.patientId,
        sessionId: quotes.sessionId,
        speakerId: quotes.speakerId,
        speakerName: speakers.speakerName,
        speakerType: speakers.speakerType,
        sessionTitle: sessions.title,
        createdByTherapistId: quotes.createdByTherapistId,
      })
      .from(quotes)
      .leftJoin(speakers, eq(quotes.speakerId, speakers.id))
      .leftJoin(sessions, eq(quotes.sessionId, sessions.id));

    // Build filters
    const filters = [];
    if (patientId) {
      filters.push(eq(quotes.patientId, patientId));
    }
    if (sessionId) {
      filters.push(eq(quotes.sessionId, sessionId));
    }
    if (search) {
      filters.push(
        or(
          ilike(quotes.quoteText, `%${search}%`),
          ilike(quotes.notes, `%${search}%`),
        ),
      );
    }

    if (filters.length > 0) {
      query = query.where(and(...filters)) as any;
    }

    const quotesList = await query.orderBy(desc(quotes.createdAt));

    return NextResponse.json({ quotes: quotesList });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 },
    );
  }
}

// POST /api/quotes - Create quote
export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATE
    const user = await requireTherapist(request);

    const body = await request.json();
    const {
      patientId,
      sessionId,
      quoteText,
      speakerId,
      speaker, // Accept speaker name string as alternative to speakerId
      startTimeSeconds,
      endTimeSeconds,
      tags,
      notes,
      source: _source, // Track quote source: 'transcript_selection', 'ai_conversation', etc.
      validateAgainstTranscript = false, // Enable strict validation
    } = body;

    // Validate required fields
    if (!patientId || !quoteText) {
      return NextResponse.json(
        { error: 'Missing required fields: patientId, quoteText' },
        { status: 400 },
      );
    }

    // 2. RESOLVE SPEAKER ID
    // If speakerId not provided but speaker name is, look up the speaker
    let resolvedSpeakerId = speakerId || null;

    if (!speakerId && speaker && sessionId) {
      // Look up speaker by name in this session's speakers
      // First get the transcript for this session
      const sessionTranscript = await db.query.transcriptsSchema.findFirst({
        where: eq(transcriptsSchema.sessionId, sessionId),
        columns: { id: true },
      });

      if (sessionTranscript) {
        const matchingSpeaker = await db.query.speakers.findFirst({
          where: and(
            eq(speakers.transcriptId, sessionTranscript.id),
            or(
              eq(speakers.speakerName, speaker),
              ilike(speakers.speakerName, speaker),
            ),
          ),
          columns: { id: true },
        });

        if (matchingSpeaker) {
          resolvedSpeakerId = matchingSpeaker.id;
        }
      }
    }

    // 3. VALIDATE QUOTE AGAINST TRANSCRIPT (for clinical accuracy)
    // When enabled, quote text must exist verbatim in the session's transcript
    if (validateAgainstTranscript && sessionId) {
      // Get the transcript for this session
      const transcript = await db.query.transcriptsSchema.findFirst({
        where: eq(transcriptsSchema.sessionId, sessionId),
        columns: { id: true },
      });

      if (transcript) {
        // Check if quote text exists in any utterance (case-insensitive partial match)
        const matchingUtterance = await db.query.utterancesSchema.findFirst({
          where: and(
            eq(utterancesSchema.transcriptId, transcript.id),
            sql`LOWER(${utterancesSchema.text}) LIKE LOWER(${`%${quoteText.trim()}%`})`,
          ),
          columns: {
            id: true,
            speakerId: true,
            startTimeSeconds: true,
            endTimeSeconds: true,
          },
        });

        if (!matchingUtterance) {
          return NextResponse.json(
            {
              error: 'Quote validation failed: Text must match transcript verbatim. The quoted text was not found in the session transcript.',
              code: 'QUOTE_NOT_IN_TRANSCRIPT',
            },
            { status: 400 },
          );
        }

        // Auto-populate speaker and timestamps from matching utterance if not provided
        if (!resolvedSpeakerId && matchingUtterance.speakerId) {
          resolvedSpeakerId = matchingUtterance.speakerId;
        }
      }
    }

    // 4. INSERT QUOTE
    const [newQuote] = await db
      .insert(quotes)
      .values({
        patientId,
        sessionId: sessionId || null,
        quoteText,
        speakerId: resolvedSpeakerId,
        startTimeSeconds: startTimeSeconds ? String(startTimeSeconds) : null,
        endTimeSeconds: endTimeSeconds ? String(endTimeSeconds) : null,
        tags: tags || null,
        notes: notes || null,
        createdByTherapistId: user.dbUserId,
      })
      .returning();

    return NextResponse.json({ quote: newQuote }, { status: 201 });
  } catch (error) {
    console.error('Error creating quote:', error);
    return handleAuthError(error);
  }
}
