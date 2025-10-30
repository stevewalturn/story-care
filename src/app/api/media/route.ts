import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { mediaLibrary } from '@/models/Schema';
import { eq, and, or, like, desc } from 'drizzle-orm';

// GET /api/media - List media files
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const sessionId = searchParams.get('sessionId');
    const mediaType = searchParams.get('type');
    const search = searchParams.get('search');

    let query = db.select().from(mediaLibrary);

    // Build filters
    const filters = [];
    if (patientId) filters.push(eq(mediaLibrary.patientId, patientId));
    if (sessionId) filters.push(eq(mediaLibrary.sessionId, sessionId));
    if (mediaType) filters.push(eq(mediaLibrary.mediaType, mediaType));
    if (search) {
      filters.push(
        or(
          like(mediaLibrary.title, `%${search}%`),
          like(mediaLibrary.tags, `%${search}%`),
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
      sessionId,
      patientId,
      mediaType,
      title,
      url,
      storagePath,
      thumbnailUrl,
      duration,
      generatedPrompt,
      tags,
    } = body;

    if (!mediaType || !title || !url) {
      return NextResponse.json(
        { error: 'mediaType, title, and url are required' },
        { status: 400 },
      );
    }

    const [media] = await db
      .insert(mediaLibrary)
      .values({
        sessionId: sessionId || null,
        patientId: patientId || null,
        mediaType,
        title,
        url,
        storagePath: storagePath || null,
        thumbnailUrl: thumbnailUrl || null,
        duration: duration || null,
        generatedPrompt: generatedPrompt || null,
        tags: tags || null,
      })
      .returning();

    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    console.error('Error creating media:', error);
    return NextResponse.json(
      { error: 'Failed to create media' },
      { status: 500 },
    );
  }
}
