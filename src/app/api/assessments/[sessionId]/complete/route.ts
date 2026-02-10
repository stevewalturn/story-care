/**
 * API Route: Complete Assessment Session
 * POST: Calculate scores and mark assessment as completed
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { logPHIUpdate } from '@/libs/AuditLogger';
import { completeAssessment, getAssessmentSession } from '@/services/AssessmentService';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';
import { completeAssessmentSchema } from '@/validations/AssessmentValidation';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { sessionId } = await params;

    // Verify the user has access to this session
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

    const body = await request.json().catch(() => ({}));
    const validation = completeAssessmentSchema.safeParse(body);

    const result = await completeAssessment(
      sessionId,
      validation.success ? validation.data.clinicianNotes : null,
    );

    await logPHIUpdate(user.dbUserId, 'assessment_session', sessionId, request, {
      changedFields: ['status', 'totalScore', 'subscaleScores', 'completedAt'],
      action: 'completed',
    });

    return NextResponse.json({ session: result });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not in progress')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return handleAuthError(error);
    }
    console.error('Error completing assessment:', error);
    return NextResponse.json({ error: 'Failed to complete assessment' }, { status: 500 });
  }
}
