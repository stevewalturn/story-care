import type { NextRequest } from 'next/server';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { logPHIAccess } from '@/libs/AuditLogger';
import { db } from '@/libs/DB';
import { groupMembers, groups, sessionModules, sessions, treatmentModules, users } from '@/models/Schema';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';

// GET /api/sessions - List all sessions for authenticated therapist
// HIPAA COMPLIANCE: Requires authentication and logs access
export async function GET(request: NextRequest) {
  try {
    // 1. AUTHENTICATE: Verify user is a therapist or admin
    const user = await requireTherapist(request);

    // 2. PARSE QUERY PARAMETERS
    const { searchParams } = new URL(request.url);
    const patientIdFilter = searchParams.get('patientId');

    // 3. BUILD WHERE CONDITIONS
    const whereConditions = [];

    // Role-based access control
    if (user.role === 'org_admin' || user.role === 'super_admin') {
      whereConditions.push(isNull(sessions.deletedAt)); // Org/Super Admin sees all sessions
    } else {
      whereConditions.push(eq(sessions.therapistId, user.dbUserId)); // Therapist sees only their sessions
    }

    // Optional patient filter
    if (patientIdFilter) {
      whereConditions.push(eq(sessions.patientId, patientIdFilter));
    }

    // 4. FETCH: Get sessions with module data
    const sessionsList = await db
      .select({
        id: sessions.id,
        title: sessions.title,
        sessionDate: sessions.sessionDate,
        sessionType: sessions.sessionType,
        audioUrl: sessions.audioUrl,
        transcriptionStatus: sessions.transcriptionStatus,
        patientId: sessions.patientId,
        createdAt: sessions.createdAt,
        patient: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl,
        },
        // Module data from session_modules join
        moduleId: sessionModules.moduleId,
        module: {
          id: treatmentModules.id,
          name: treatmentModules.name,
          domain: treatmentModules.domain,
          description: treatmentModules.description,
          reflectionTemplateId: treatmentModules.reflectionTemplateId,
          surveyTemplateId: treatmentModules.surveyTemplateId,
        },
      })
      .from(sessions)
      .leftJoin(users, eq(sessions.patientId, users.id))
      .leftJoin(sessionModules, eq(sessions.id, sessionModules.sessionId))
      .leftJoin(treatmentModules, eq(sessionModules.moduleId, treatmentModules.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(sessions.createdAt));

    // 5. AUDIT LOG: Record PHI access
    await logPHIAccess(user.dbUserId, 'session', 'list', request);

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
      patientIds,
      audioUrl,
    } = body;

    // Validate required fields
    if (!title || !sessionDate || !audioUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: title, sessionDate, audioUrl' },
        { status: 400 },
      );
    }

    // Validate patient selection
    if (!patientIds || !Array.isArray(patientIds) || patientIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one patient must be selected' },
        { status: 400 },
      );
    }

    // Auto-compute session type based on number of patients
    const sessionType = patientIds.length === 1 ? 'individual' : 'group';

    // 3. AUTHORIZATION CHECK: Verify therapist can create for these patients
    if (user.role === 'therapist') {
      // Verify all patients are assigned to this therapist
      const patientsToVerify = await db.query.users.findMany({
        where: eq(users.id, patientIds[0]), // Check first patient for simplicity
      });

      for (const patientId of patientIds) {
        const patient = await db.query.users.findFirst({
          where: eq(users.id, patientId),
        });

        if (!patient) {
          return NextResponse.json(
            { error: `Patient not found: ${patientId}` },
            { status: 404 },
          );
        }

        if (patient.therapistId !== user.dbUserId) {
          return NextResponse.json(
            { error: 'Forbidden: You can only create sessions for your assigned patients' },
            { status: 403 },
          );
        }
      }
    }

    // 4. CREATE SESSION (with auto-group creation for multiple patients)
    let groupId = null;

    if (sessionType === 'group') {
      // Auto-create a temporary group for this session
      const groupName = `Session - ${title} (${new Date(sessionDate).toLocaleDateString()})`;

      const groupResult = await db
        .insert(groups)
        .values({
          name: groupName,
          description: `Auto-generated group for session: ${title}`,
          therapistId: user.dbUserId,
          organizationId: user.organizationId,
        })
        .returning();

      const newGroup = groupResult[0];
      groupId = newGroup?.id;

      if (!groupId) {
        return NextResponse.json(
          { error: 'Failed to create group for session' },
          { status: 500 },
        );
      }

      // Add all patients as group members
      await db.insert(groupMembers).values(
        patientIds.map((patientId: string) => ({
          groupId,
          patientId,
        })),
      );
    }

    // Create the session
    const sessionResult = await db
      .insert(sessions)
      .values({
        therapistId: user.dbUserId,
        patientId: sessionType === 'individual' ? patientIds[0] : null,
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
    await logPHIAccess(user.dbUserId, 'session', newSession.id, request);

    return NextResponse.json({ session: newSession }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return handleAuthError(error);
  }
}
