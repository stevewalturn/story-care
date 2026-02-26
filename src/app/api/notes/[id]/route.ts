import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getClientInfo, logAudit, logPHIDelete, logPHIUpdate } from '@/libs/AuditLogger';
import { db } from '@/libs/DB';
import { notes, users } from '@/models/Schema';
import { getTherapistPatientIds, handleAuthError, requireAuth } from '@/utils/AuthHelpers';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/notes/[id] - Get single note
export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    // Require authentication
    const user = await requireAuth(request);

    const { id: noteId } = await context.params;

    const [note] = await db
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
      })
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1);

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 },
      );
    }

    // Authorization check: creator, assigned therapist, or admin can view
    if (user.role === 'therapist' && note.therapistId !== user.dbUserId) {
      // Check if therapist is assigned to the note's patient
      const patient = await db.query.users.findFirst({
        where: eq(users.id, note.patientId),
      });
      if (!patient || patient.therapistId !== user.dbUserId) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have access to this note' },
          { status: 403 },
        );
      }
    }

    if (user.role === 'patient' && note.patientId !== user.dbUserId) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this note' },
        { status: 403 },
      );
    }

    // Fetch locker info if note is locked
    let lockedByName: string | null = null;
    let lockedByCredentials: string | null = null;

    if (note.lockedBy) {
      const [locker] = await db
        .select({ name: users.name, specialty: users.specialty })
        .from(users)
        .where(eq(users.id, note.lockedBy))
        .limit(1);
      lockedByName = locker?.name ?? null;
      lockedByCredentials = locker?.specialty ?? null;
    }

    // Log PHI access
    await logAudit({
      userId: user.dbUserId,
      action: 'read',
      resourceType: 'note',
      resourceId: noteId,
      ...getClientInfo(request),
    });

    return NextResponse.json({ note: { ...note, lockedByName, lockedByCredentials } });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return handleAuthError(error);
    }
    console.error('Error fetching note:', error);
    return NextResponse.json(
      { error: 'Failed to fetch note' },
      { status: 500 },
    );
  }
}

// PUT /api/notes/[id] - Update note
export async function PUT(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    // Require authentication
    const user = await requireAuth(request);

    const { id: noteId } = await context.params;

    // Check if note exists and user has permission
    const [existingNote] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1);

    if (!existingNote) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 },
      );
    }

    // Patients can only edit their own notes
    if (user.role === 'patient') {
      if (existingNote.patientId !== user.dbUserId) {
        return NextResponse.json(
          { error: 'Forbidden: You can only edit your own notes' },
          { status: 403 },
        );
      }
    }
    else if (user.role === 'therapist') {
      // Any therapist currently assigned to the patient can edit (not just the creator)
      const therapistPatientIds = await getTherapistPatientIds(user.dbUserId);
      if (!therapistPatientIds.includes(existingNote.patientId)) {
        return NextResponse.json(
          { error: 'Forbidden: Patient is not assigned to you' },
          { status: 403 },
        );
      }
    }
    // org_admin / super_admin: no restriction

    // Prevent editing locked notes
    if (existingNote.status === 'locked') {
      return NextResponse.json(
        { error: 'Forbidden: This note is locked and cannot be edited' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      title,
      content,
      tags,
    } = body;

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (title !== undefined) {
      updateData.title = title;
    }
    if (content !== undefined) {
      updateData.content = content;
    }
    if (tags !== undefined) {
      updateData.tags = tags;
    }

    const [updatedNote] = await db
      .update(notes)
      .set(updateData)
      .where(eq(notes.id, noteId))
      .returning();

    // Log PHI update
    await logPHIUpdate(user.dbUserId, 'note', noteId, request, {
      patientId: existingNote.patientId,
      changes: { title, content, tags },
    });

    return NextResponse.json({ note: updatedNote });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return handleAuthError(error);
    }
    console.error('Error updating note:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 },
    );
  }
}

// DELETE /api/notes/[id] - Delete note
export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    // Require authentication
    const user = await requireAuth(request);

    const { id: noteId } = await context.params;

    // Check if note exists and user has permission
    const [existingNote] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1);

    if (!existingNote) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 },
      );
    }

    // Patients cannot delete clinical notes
    if (user.role === 'patient') {
      return NextResponse.json(
        { error: 'Forbidden: Patients cannot delete notes' },
        { status: 403 },
      );
    }

    // Any therapist currently assigned to the patient can delete (not just the creator)
    if (user.role === 'therapist') {
      const therapistPatientIds = await getTherapistPatientIds(user.dbUserId);
      if (!therapistPatientIds.includes(existingNote.patientId)) {
        return NextResponse.json(
          { error: 'Forbidden: Patient is not assigned to you' },
          { status: 403 },
        );
      }
    }
    // org_admin / super_admin: no restriction

    // Prevent deleting locked notes
    if (existingNote.status === 'locked') {
      return NextResponse.json(
        { error: 'Forbidden: This note is locked and cannot be deleted' },
        { status: 403 },
      );
    }

    await db
      .delete(notes)
      .where(eq(notes.id, noteId))
      .returning();

    // Log PHI deletion
    await logPHIDelete(user.dbUserId, 'note', noteId, request, {
      patientId: existingNote.patientId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return handleAuthError(error);
    }
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 },
    );
  }
}
