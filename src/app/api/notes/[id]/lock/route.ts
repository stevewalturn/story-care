import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { logPHIUpdate } from '@/libs/AuditLogger';
import { db } from '@/libs/DB';
import { notes } from '@/models/Schema';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// PATCH /api/notes/[id]/lock - Lock or unlock a note
export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const user = await requireAuth(request);
    const { id: noteId } = await context.params;

    const body = await request.json();
    const { action } = body;

    if (action !== 'lock' && action !== 'unlock') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "lock" or "unlock"' },
        { status: 400 },
      );
    }

    // Fetch the note
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

    if (action === 'lock') {
      // Only note author (therapist) or admins can lock
      if (user.role === 'therapist' && existingNote.therapistId !== user.dbUserId) {
        return NextResponse.json(
          { error: 'Forbidden: Only the note author or admins can lock this note' },
          { status: 403 },
        );
      }

      if (user.role === 'patient') {
        return NextResponse.json(
          { error: 'Forbidden: Patients cannot lock notes' },
          { status: 403 },
        );
      }

      if (existingNote.status === 'locked') {
        return NextResponse.json(
          { error: 'Note is already locked' },
          { status: 409 },
        );
      }

      const [updatedNote] = await db
        .update(notes)
        .set({
          status: 'locked',
          lockedAt: new Date(),
          lockedBy: user.dbUserId,
          updatedAt: new Date(),
        })
        .where(eq(notes.id, noteId))
        .returning();

      await logPHIUpdate(user.dbUserId, 'note', noteId, request, {
        lockAction: 'lock',
        previousStatus: 'draft',
        newStatus: 'locked',
        patientId: existingNote.patientId,
      });

      return NextResponse.json({ note: updatedNote });
    }

    // Unlock: note creator or org_admin / super_admin
    const isNoteCreator = existingNote.therapistId === user.dbUserId;
    const isAdmin = user.role === 'org_admin' || user.role === 'super_admin';
    if (!isNoteCreator && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only the note creator or admins can unlock notes' },
        { status: 403 },
      );
    }

    if (existingNote.status === 'draft') {
      return NextResponse.json(
        { error: 'Note is already unlocked' },
        { status: 409 },
      );
    }

    const [updatedNote] = await db
      .update(notes)
      .set({
        status: 'draft',
        lockedAt: null,
        lockedBy: null,
        updatedAt: new Date(),
      })
      .where(eq(notes.id, noteId))
      .returning();

    await logPHIUpdate(user.dbUserId, 'note', noteId, request, {
      lockAction: 'unlock',
      previousStatus: 'locked',
      newStatus: 'draft',
      patientId: existingNote.patientId,
    });

    return NextResponse.json({ note: updatedNote });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return handleAuthError(error);
    }
    console.error('Error locking/unlocking note:', error);
    return NextResponse.json(
      { error: 'Failed to update note lock status' },
      { status: 500 },
    );
  }
}
