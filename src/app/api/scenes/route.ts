import type { NextRequest } from 'next/server';
import { and, desc, eq, ilike } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { scenes } from '@/models/Schema';

// GET /api/scenes - List scenes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const search = searchParams.get('search');

    let query = db
      .select({
        id: scenes.id,
        title: scenes.title,
        description: scenes.description,
        patientId: scenes.patientId,
        createdByTherapistId: scenes.createdByTherapistId,
        assembledVideoUrl: scenes.assembledVideoUrl,
        durationSeconds: scenes.durationSeconds,
        status: scenes.status,
        createdAt: scenes.createdAt,
        updatedAt: scenes.updatedAt,
      })
      .from(scenes);

    // Build filters
    const filters = [];
    if (patientId) {
      filters.push(eq(scenes.patientId, patientId));
    }
    if (search) {
      filters.push(ilike(scenes.title, `%${search}%`));
    }

    if (filters.length > 0) {
      query = query.where(and(...filters)) as any;
    }

    const scenesList = await query.orderBy(desc(scenes.updatedAt));

    return NextResponse.json({ scenes: scenesList });
  } catch (error) {
    console.error('Error fetching scenes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scenes' },
      { status: 500 },
    );
  }
}

// POST /api/scenes - Create scene
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      patientId,
      createdByTherapistId,
      title,
      description,
    } = body;

    // Validate required fields
    if (!patientId || !createdByTherapistId) {
      return NextResponse.json(
        { error: 'Missing required fields: patientId, createdByTherapistId' },
        { status: 400 },
      );
    }

    // Insert new scene
    const [newScene] = await db
      .insert(scenes)
      .values({
        patientId,
        createdByTherapistId,
        title: title || 'Untitled Scene',
        description: description || null,
        status: 'draft',
        durationSeconds: '0',
      })
      .returning();

    return NextResponse.json({ scene: newScene }, { status: 201 });
  } catch (error) {
    console.error('Error creating scene:', error);
    return NextResponse.json(
      { error: 'Failed to create scene' },
      { status: 500 },
    );
  }
}
