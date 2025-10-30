import type { NextRequest } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { sessions, users } from '@/models/Schema';

// GET /api/sessions - List all sessions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const therapistFirebaseUid = searchParams.get('therapistId');

    if (!therapistFirebaseUid) {
      return NextResponse.json(
        { error: 'therapistId is required' },
        { status: 400 },
      );
    }

    // Convert Firebase UID to database UUID
    const [therapist] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.firebaseUid, therapistFirebaseUid))
      .limit(1);

    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 },
      );
    }

    const sessionsList = await db
      .select({
        id: sessions.id,
        title: sessions.title,
        sessionDate: sessions.sessionDate,
        sessionType: sessions.sessionType,
        audioUrl: sessions.audioUrl,
        transcriptionStatus: sessions.transcriptionStatus,
        createdAt: sessions.createdAt,
        patient: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(sessions)
      .leftJoin(users, eq(sessions.patientId, users.id))
      .where(eq(sessions.therapistId, therapist.id))
      .orderBy(desc(sessions.createdAt));

    return NextResponse.json({ sessions: sessionsList });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 },
    );
  }
}

// POST /api/sessions - Create a new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      therapistId: therapistFirebaseUid,
      title,
      sessionDate,
      sessionType,
      patientId,
      groupId,
      audioUrl,
    } = body;

    // Validate required fields
    if (!therapistFirebaseUid || !title || !sessionDate || !sessionType || !audioUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    if (sessionType === 'individual' && !patientId) {
      return NextResponse.json(
        { error: 'patientId is required for individual sessions' },
        { status: 400 },
      );
    }

    if (sessionType === 'group' && !groupId) {
      return NextResponse.json(
        { error: 'groupId is required for group sessions' },
        { status: 400 },
      );
    }

    // Convert Firebase UID to database UUID
    const [therapist] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.firebaseUid, therapistFirebaseUid))
      .limit(1);

    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 },
      );
    }

    // Create session with validated values (fields are validated above)
    const sessionResult = await db
      .insert(sessions)
      .values({
        therapistId: therapist.id,
        patientId: sessionType === 'individual' ? patientId : null,
        groupId: sessionType === 'group' ? groupId : null,
        title,
        sessionDate: new Date(sessionDate).toISOString().split('T')[0],
        sessionType,
        audioUrl,
        transcriptionStatus: 'pending',
      } as any)
      .returning();

    const newSession = Array.isArray(sessionResult) && sessionResult.length > 0 ? sessionResult[0] : null;

    if (!newSession) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 },
      );
    }

    return NextResponse.json({ session: newSession }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 },
    );
  }
}
