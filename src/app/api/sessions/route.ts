import type { NextRequest } from 'next/server';
import { desc, eq, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { sessions, users } from '@/models/Schema';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';
import { logPHIAccess } from '@/libs/AuditLogger';

// GET /api/sessions - List all sessions for authenticated therapist
// HIPAA COMPLIANCE: Requires authentication and logs access
export async function GET(request: NextRequest) {
  try {
    // 1. AUTHENTICATE: Verify user is a therapist or admin
    const user = await requireTherapist(request);

    // 2. FETCH: Get sessions for this therapist only (RBAC)
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
      .where(
        user.role === 'admin'
          ? isNull(sessions.deletedAt) // Admin sees all sessions
          : eq(sessions.therapistId, user.uid), // Therapist sees only their sessions
      )
      .orderBy(desc(sessions.createdAt));

    // 3. AUDIT LOG: Record PHI access
    await logPHIAccess(user.uid, 'session', 'list', request);

    return NextResponse.json({ sessions: sessionsList });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return handleAuthError(error);
  }
}

// POST /api/sessions - Create a new session
// HIPAA COMPLIANCE: Requires authentication and logs session creation
export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATE: Verify user is a therapist or admin
    const user = await requireTherapist(request);

    // 2. VALIDATE INPUT
    const body = await request.json();
    const {
      title,
      sessionDate,
      sessionType,
      patientId,
      groupId,
      audioUrl,
    } = body;

    // Validate required fields
    if (!title || !sessionDate || !sessionType || !audioUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: title, sessionDate, sessionType, audioUrl' },
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

    // 3. AUTHORIZATION CHECK: Verify therapist can create for this patient
    if (sessionType === 'individual' && patientId && user.role === 'therapist') {
      const patient = await db.query.users.findFirst({
        where: eq(users.id, patientId),
      });

      if (!patient) {
        return NextResponse.json(
          { error: 'Patient not found' },
          { status: 404 },
        );
      }

      if (patient.therapistId !== user.uid && user.role !== 'therapist' && user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden: You can only create sessions for your assigned patients' },
          { status: 403 },
        );
      }
    }

    // 4. CREATE SESSION
    const sessionResult = await db
      .insert(sessions)
      .values({
        therapistId: user.uid,
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

    // 5. AUDIT LOG: Record session creation
    await logPHIAccess(user.uid, 'session', newSession.id, request);

    return NextResponse.json({ session: newSession }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return handleAuthError(error);
  }
}
