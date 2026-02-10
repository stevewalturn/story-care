/**
 * API Route: Assessment Session by ID
 * GET: Get full assessment (instrument + items + responses)
 * DELETE: Delete in-progress assessment
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { logPHIAccess } from '@/libs/AuditLogger';
import { deleteAssessmentSession, getAssessmentSession } from '@/services/AssessmentService';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { sessionId } = await params;

    const session = await getAssessmentSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Assessment session not found' }, { status: 404 });
    }

    // Verify the user has access (therapist who created it, org admin, or super admin)
    if (
      user.role !== 'super_admin'
      && user.role !== 'org_admin'
      && session.therapistId !== user.dbUserId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await logPHIAccess(user.dbUserId, 'assessment_session', sessionId, request);

    return NextResponse.json({ session });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return handleAuthError(error);
    }
    console.error('Error fetching assessment session:', error);
    return NextResponse.json({ error: 'Failed to fetch assessment session' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { sessionId } = await params;

    // Fetch session to check ownership
    const session = await getAssessmentSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Assessment session not found' }, { status: 404 });
    }

    if (
      user.role !== 'super_admin'
      && user.role !== 'org_admin'
      && session.therapistId !== user.dbUserId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const deleted = await deleteAssessmentSession(sessionId);
    if (!deleted) {
      return NextResponse.json({ error: 'Assessment session not found' }, { status: 404 });
    }

    const { logPHIDelete } = await import('@/libs/AuditLogger');
    await logPHIDelete(user.dbUserId, 'assessment_session', sessionId, request);

    return NextResponse.json({ message: 'Assessment session deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Can only delete')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return handleAuthError(error);
    }
    console.error('Error deleting assessment session:', error);
    return NextResponse.json({ error: 'Failed to delete assessment session' }, { status: 500 });
  }
}
