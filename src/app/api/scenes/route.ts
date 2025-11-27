import type { NextRequest } from 'next/server';
import { and, desc, eq, ilike } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { verifyIdToken } from '@/libs/FirebaseAdmin';
import { scenes, sessions, usersSchema } from '@/models/Schema';

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
        patientName: usersSchema.name,
        createdByTherapistId: scenes.createdByTherapistId,
        assembledVideoUrl: scenes.assembledVideoUrl,
        thumbnailUrl: scenes.thumbnailUrl,
        durationSeconds: scenes.durationSeconds,
        status: scenes.status,
        createdAt: scenes.createdAt,
        updatedAt: scenes.updatedAt,
      })
      .from(scenes)
      .leftJoin(usersSchema, eq(scenes.patientId, usersSchema.id));

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
    // Authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7);
    let user;
    try {
      user = await verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      patientId,
      sessionId,
      title,
      description,
      sceneData: _sceneData,
      focusInstruction: _focusInstruction,
      keyQuote: _keyQuote,
      therapeuticRationale: _therapeuticRationale,
      forPatient: _forPatient,
    } = body;

    // Validate required fields - either patientId or sessionId must be provided
    if (!patientId && !sessionId) {
      return NextResponse.json(
        { error: 'Missing required field: patientId or sessionId' },
        { status: 400 },
      );
    }

    // Convert Firebase UID to database UUID
    const [therapist] = await db
      .select({ id: usersSchema.id })
      .from(usersSchema)
      .where(eq(usersSchema.firebaseUid, user.uid))
      .limit(1);

    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 },
      );
    }

    // Determine patient ID
    let finalPatientId = patientId;

    // If sessionId is provided, fetch the session to get patientId
    if (sessionId && !finalPatientId) {
      const [session] = await db
        .select({ patientId: sessions.patientId })
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1);

      if (!session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 },
        );
      }

      finalPatientId = session.patientId;
    }

    // Validate we have a patient ID
    if (!finalPatientId) {
      return NextResponse.json(
        { error: 'Unable to determine patient ID' },
        { status: 400 },
      );
    }

    // Insert new scene
    const [newScene] = await db
      .insert(scenes)
      .values({
        patientId: finalPatientId,
        createdByTherapistId: therapist.id,
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
