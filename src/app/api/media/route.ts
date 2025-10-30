import type { NextRequest } from 'next/server';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { mediaLibrary, sessions, users } from '@/models/Schema';

// GET /api/media - List media files
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const sourceSessionId = searchParams.get('sessionId');
    const mediaType = searchParams.get('type');
    const search = searchParams.get('search');

    // Select with patient and session info
    let query = db
      .select({
        id: mediaLibrary.id,
        title: mediaLibrary.title,
        description: mediaLibrary.description,
        mediaType: mediaLibrary.mediaType,
        mediaUrl: mediaLibrary.mediaUrl,
        thumbnailUrl: mediaLibrary.thumbnailUrl,
        durationSeconds: mediaLibrary.durationSeconds,
        tags: mediaLibrary.tags,
        generationPrompt: mediaLibrary.generationPrompt,
        sourceType: mediaLibrary.sourceType,
        createdAt: mediaLibrary.createdAt,
        patientId: mediaLibrary.patientId,
        patientName: users.name,
        sessionTitle: sessions.title,
      })
      .from(mediaLibrary)
      .leftJoin(users, eq(mediaLibrary.patientId, users.id))
      .leftJoin(sessions, eq(mediaLibrary.sourceSessionId, sessions.id));

    // Build filters
    const filters = [];
    if (patientId) {
      filters.push(eq(mediaLibrary.patientId, patientId));
    }
    if (sourceSessionId) {
      filters.push(eq(mediaLibrary.sourceSessionId, sourceSessionId));
    }
    if (mediaType && mediaType !== 'all') {
      filters.push(eq(mediaLibrary.mediaType, mediaType as any));
    }
    if (search) {
      filters.push(
        or(
          ilike(mediaLibrary.title, `%${search}%`),
          ilike(users.name, `%${search}%`),
          sql`${mediaLibrary.tags}::text ilike ${`%${search}%`}`,
        ),
      );
    }

    if (filters.length > 0) {
      query = query.where(and(...filters)) as any;
    }

    const media = await query.orderBy(desc(mediaLibrary.createdAt));

    return NextResponse.json({ media });
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 },
    );
  }
}

// POST /api/media - Create media entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patientId,
      createdByTherapistId,
      title,
      description,
      mediaType,
      mediaUrl,
      thumbnailUrl,
      durationSeconds,
      sourceType,
      sourceSessionId,
      generationPrompt,
      aiModel,
      tags,
    } = body;

    if (!patientId || !createdByTherapistId || !mediaType || !title || !mediaUrl || !sourceType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const mediaResult = await db
      .insert(mediaLibrary)
      .values({
        patientId,
        createdByTherapistId,
        title,
        description: description || null,
        mediaType,
        mediaUrl,
        thumbnailUrl: thumbnailUrl || null,
        durationSeconds: durationSeconds || null,
        sourceType,
        sourceSessionId: sourceSessionId || null,
        generationPrompt: generationPrompt || null,
        aiModel: aiModel || null,
        tags: tags || null,
        status: 'completed',
      })
      .returning();

    const media = Array.isArray(mediaResult) && mediaResult.length > 0 ? mediaResult[0] : null;

    if (!media) {
      return NextResponse.json(
        { error: 'Failed to create media record' },
        { status: 500 },
      );
    }

    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    console.error('Error creating media:', error);
    return NextResponse.json(
      { error: 'Failed to create media' },
      { status: 500 },
    );
  }
}
