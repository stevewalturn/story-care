import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { logPHIUpdate } from '@/libs/AuditLogger';
import { db } from '@/libs/DB';
import { handleRBACError, requireSessionAccess } from '@/middleware/RBACMiddleware';
import { sessions } from '@/models/Schema';
import { handleAuthError } from '@/utils/AuthHelpers';

// POST /api/sessions/[id]/archive - Archive a session
// HIPAA COMPLIANCE: Requires authentication, RBAC, and logs updates
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const user = await requireSessionAccess(request, id);

    const [existingSession] = await db
      .select({ id: sessions.id, title: sessions.title, archivedAt: sessions.archivedAt })
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1);

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 },
      );
    }

    if (existingSession.archivedAt) {
      return NextResponse.json(
        { error: 'Session is already archived' },
        { status: 400 },
      );
    }

    await db
      .update(sessions)
      .set({ archivedAt: new Date(), updatedAt: new Date() })
      .where(eq(sessions.id, id));

    await logPHIUpdate(user.dbUserId, 'session', id, request, {
      action: 'archive',
      note: 'Session archived',
    });

    return NextResponse.json({
      success: true,
      message: 'Session archived',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return handleRBACError(error);
    }
    console.error('Error archiving session:', error);
    return handleAuthError(error);
  }
}

// DELETE /api/sessions/[id]/archive - Unarchive a session
// HIPAA COMPLIANCE: Requires authentication, RBAC, and logs updates
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const user = await requireSessionAccess(request, id);

    const [existingSession] = await db
      .select({ id: sessions.id, title: sessions.title, archivedAt: sessions.archivedAt })
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1);

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 },
      );
    }

    if (!existingSession.archivedAt) {
      return NextResponse.json(
        { error: 'Session is not archived' },
        { status: 400 },
      );
    }

    await db
      .update(sessions)
      .set({ archivedAt: null, updatedAt: new Date() })
      .where(eq(sessions.id, id));

    await logPHIUpdate(user.dbUserId, 'session', id, request, {
      action: 'unarchive',
      note: 'Session restored from archive',
    });

    return NextResponse.json({
      success: true,
      message: 'Session restored from archive',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return handleRBACError(error);
    }
    console.error('Error unarchiving session:', error);
    return handleAuthError(error);
  }
}
