import type { NextRequest } from 'next/server';
import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { quotes, sessions, speakers } from '@/models/Schema';
import { requireTherapist, handleAuthError } from '@/utils/AuthHelpers';

// GET /api/quotes - List quotes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const sessionId = searchParams.get('sessionId');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');

    // Select with speaker and session info
    let query = db
      .select({
        id: quotes.id,
        quoteText: quotes.quoteText,
        priority: quotes.priority,
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
    if (priority) {
      filters.push(eq(quotes.priority, priority as any));
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
      startTimeSeconds,
      endTimeSeconds,
      priority,
      tags,
      notes,
    } = body;

    // Validate required fields
    if (!patientId || !quoteText) {
      return NextResponse.json(
        { error: 'Missing required fields: patientId, quoteText' },
        { status: 400 },
      );
    }

    // Insert new quote
    const [newQuote] = await db
      .insert(quotes)
      .values({
        patientId,
        sessionId: sessionId || null,
        quoteText,
        speakerId: speakerId || null,
        startTimeSeconds: startTimeSeconds ? String(startTimeSeconds) : null,
        endTimeSeconds: endTimeSeconds ? String(endTimeSeconds) : null,
        priority: priority || 'medium',
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
