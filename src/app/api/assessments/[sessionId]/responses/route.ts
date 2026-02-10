/**
 * API Route: Assessment Session Responses
 * POST: Save/auto-save item responses (batch upsert)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { logPHIUpdate } from '@/libs/AuditLogger';
import { getAssessmentSession, saveResponses } from '@/services/AssessmentService';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';
import { saveAssessmentResponsesSchema } from '@/validations/AssessmentValidation';

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

    const body = await request.json();
    const validation = saveAssessmentResponsesSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.issues },
        { status: 400 },
      );
    }

    const result = await saveResponses(sessionId, validation.data.responses);

    await logPHIUpdate(user.dbUserId, 'assessment_response', sessionId, request, {
      changedFields: ['responses'],
      responseCount: validation.data.responses.length,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not in progress')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return handleAuthError(error);
    }
    console.error('Error saving assessment responses:', error);
    return NextResponse.json({ error: 'Failed to save responses' }, { status: 500 });
  }
}
