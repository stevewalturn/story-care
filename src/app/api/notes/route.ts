import type { NextRequest } from 'next/server';
import { and, desc, eq, ilike, inArray, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getClientInfo, logAudit } from '@/libs/AuditLogger';
import { db } from '@/libs/DB';
import { notes, sessions, users } from '@/models/Schema';
import { getTherapistPatientIds, handleAuthError, requireAuth, verifyTherapistPatientAccess } from '@/utils/AuthHelpers';

// GET /api/notes - List notes
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const sessionId = searchParams.get('sessionId');
    const search = searchParams.get('search');

    console.log('[API/notes] Query params - patientId:', patientId, 'sessionId:', sessionId);

    // Select with session info (no alias join — post-process locker info in JS)
    let query = db
      .select({
        id: notes.id,
        title: notes.title,
        content: notes.content,
        tags: notes.tags,
        status: notes.status,
        lockedAt: notes.lockedAt,
        lockedBy: notes.lockedBy,
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

    // Filter by user role (HIPAA compliance)
    if (user.role === 'therapist') {
      // Therapists see: notes for their assigned patients + notes they created (even if patient reassigned)
      const therapistPatientIds = await getTherapistPatientIds(user.dbUserId);
      console.log('[API/notes] Therapist patient IDs:', therapistPatientIds);

      const accessConditions = [
        eq(notes.therapistId, user.dbUserId), // Notes I created
      ];
      if (therapistPatientIds.length > 0) {
        accessConditions.push(inArray(notes.patientId, therapistPatientIds)); // Notes for my assigned patients
      }
      filters.push(or(...accessConditions)!);
    } else if (user.role === 'patient') {
      // Patient can only see their own notes
      filters.push(eq(notes.patientId, user.dbUserId));
    }
    // Admin can see all notes

    if (patientId) {
      // HIPAA: Verify user has access to this patient before filtering
      const accessCheck = await verifyTherapistPatientAccess(user, patientId);
      if (!accessCheck.hasAccess) {
        return NextResponse.json(
          { error: accessCheck.error },
          { status: 403 },
        );
      }
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

    console.log('[API/notes] Notes found:', notesList.length);
    if (notesList.length > 0) {
      console.log('[API/notes] First note patient ID:', (notesList[0] as any).patientId);
    }

    // Collect unique lockedBy UUIDs from locked notes
    const lockerIds = [...new Set(
      notesList
        .filter((n: any) => n.lockedBy)
        .map((n: any) => n.lockedBy as string),
    )];

    // Batch-fetch locker name + credentials
    const lockerMap: Record<string, { name: string; specialty: string | null }> = {};
    if (lockerIds.length > 0) {
      const lockers = await db
        .select({ id: users.id, name: users.name, specialty: users.specialty })
        .from(users)
        .where(inArray(users.id, lockerIds));
      for (const l of lockers) {
        lockerMap[l.id] = { name: l.name, specialty: l.specialty };
      }
    }

    // Merge locker info into notes
    const notesWithLocker = notesList.map((n: any) => ({
      ...n,
      lockedByName: n.lockedBy ? (lockerMap[n.lockedBy]?.name ?? null) : null,
      lockedByCredentials: n.lockedBy ? (lockerMap[n.lockedBy]?.specialty ?? null) : null,
    }));

    // Log PHI access
    await logAudit({
      userId: user.dbUserId,
      action: 'read',
      resourceType: 'note',
      resourceId: 'list',
      ...getClientInfo(request),
      metadata: { count: notesList.length, patientId, sessionId },
    });

    return NextResponse.json({ notes: notesWithLocker });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return handleAuthError(error);
    }
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
    // Require therapist or org_admin/super_admin
    const user = await requireAuth(request);

    if (user.role !== 'therapist' && user.role !== 'org_admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only therapists can create notes' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      patientId,
      title,
      content,
      sessionId,
      tags,
    } = body;

    // Validate required fields
    if (!patientId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: patientId, content' },
        { status: 400 },
      );
    }

    // Verify therapist has access to this patient
    if (user.role === 'therapist') {
      const [patient] = await db
        .select()
        .from(users)
        .where(eq(users.id, patientId))
        .limit(1);

      if (!patient || patient.therapistId !== user.dbUserId) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have access to this patient' },
          { status: 403 },
        );
      }
    }

    // Insert new note
    const result = await db
      .insert(notes)
      .values({
        patientId,
        therapistId: user.dbUserId,
        title: title || null,
        content,
        sessionId: sessionId || null,
        tags: tags || null,
      })
      .returning();

    const newNote = (result as any[])[0];

    // Log PHI creation
    const { logPHICreate } = await import('@/libs/AuditLogger');
    await logPHICreate(user.dbUserId, 'note', newNote.id, request, {
      patientId,
      sessionId,
    });

    return NextResponse.json({ note: newNote }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return handleAuthError(error);
    }
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 },
    );
  }
}
