import type { NextRequest } from 'next/server';
import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getClientInfo, logAudit } from '@/libs/AuditLogger';
import { db } from '@/libs/DB';
import { notes, sessions, users } from '@/models/Schema';
import { handleAuthError, requireAuth, verifyTherapistPatientAccess } from '@/utils/AuthHelpers';

// GET /api/notes - List notes
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request);

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

    // Filter by user role
    if (user.role === 'therapist') {
      // Therapist can only see notes for their patients
      filters.push(eq(notes.therapistId, user.dbUserId));
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

    // Log PHI access
    await logAudit({
      userId: user.dbUserId,
      action: 'read',
      resourceType: 'note',
      resourceId: 'list',
      ...getClientInfo(request),
      metadata: { count: notesList.length, patientId, sessionId },
    });

    return NextResponse.json({ notes: notesList });
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
