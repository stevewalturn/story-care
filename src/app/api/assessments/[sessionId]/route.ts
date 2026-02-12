/**
 * API Route: Assessment Session by ID
 * GET: Get full assessment (instrument + items + responses)
 * PATCH: Update session (clinician notes, timepoint, abandon)
 * DELETE: Delete in-progress assessment
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { logPHIAccess, logPHIUpdate } from '@/libs/AuditLogger';
import { deleteAssessmentSession, getAssessmentSession, updateAssessmentSession } from '@/services/AssessmentService';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';
import { updateAssessmentSessionSchema } from '@/validations/AssessmentValidation';

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

export async function PATCH(
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

    if (
      user.role !== 'super_admin'
      && user.role !== 'org_admin'
      && session.therapistId !== user.dbUserId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateAssessmentSessionSchema.parse(body);

    const updated = await updateAssessmentSession(sessionId, validated);
    if (!updated) {
      return NextResponse.json({ error: 'Assessment session not found' }, { status: 404 });
    }

    await logPHIUpdate(user.dbUserId, 'assessment_session', sessionId, request, {
      fields: Object.keys(validated),
    });

    return NextResponse.json({ session: updated });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Cannot update')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof Error && error.message.includes('can only update')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return handleAuthError(error);
    }
    console.error('Error updating assessment session:', error);
    return NextResponse.json({ error: 'Failed to update assessment session' }, { status: 500 });
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
