import type { NextRequest } from 'next/server';
import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { notes, sessions } from '@/models/Schema';

// GET /api/notes - List notes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const sessionId = searchParams.get('sessionId');
    const search = searchParams.get('search');

    // Select with session info
    let query = db
      .select({
        id: notes.id,
        title: notes.title,
        content: notes.content,
        tags: notes.tags,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
        patientId: notes.patientId,
        therapistId: notes.therapistId,
        sessionId: notes.sessionId,
        sessionTitle: sessions.title,
      })
      .from(notes)
      .leftJoin(sessions, eq(notes.sessionId, sessions.id));

    // Build filters
    const filters = [];
    if (patientId) {
      filters.push(eq(notes.patientId, patientId));
    }
    if (sessionId) {
      filters.push(eq(notes.sessionId, sessionId));
    }
    if (search) {
      filters.push(
        or(
          ilike(notes.title, `%${search}%`),
          ilike(notes.content, `%${search}%`),
        ),
      );
    }

    if (filters.length > 0) {
      query = query.where(and(...filters)) as any;
    }

    const notesList = await query.orderBy(desc(notes.updatedAt));

    return NextResponse.json({ notes: notesList });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 },
    );
  }
}

// POST /api/notes - Create note
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patientId,
      therapistId,
      title,
      content,
      sessionId,
      tags,
    } = body;

    // Validate required fields
    if (!patientId || !therapistId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: patientId, therapistId, content' },
        { status: 400 },
      );
    }

    // Insert new note
    const [newNote] = await db
      .insert(notes)
      .values({
        patientId,
        therapistId,
        title: title || null,
        content,
        sessionId: sessionId || null,
        tags: tags || null,
      })
      .returning();

    return NextResponse.json({ note: newNote }, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 },
    );
  }
}
