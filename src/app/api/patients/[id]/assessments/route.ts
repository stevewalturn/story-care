/**
 * API Route: Patient Assessments
 * GET: List assessment history for a patient
 * POST: Create new assessment session
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { logPHIAccess, logPHICreate } from '@/libs/AuditLogger';
import { requirePatientAccess } from '@/middleware/RBACMiddleware';
import { createAssessmentSession, listPatientAssessments } from '@/services/AssessmentService';
import { handleAuthError } from '@/utils/AuthHelpers';
import { createAssessmentSessionSchema, listAssessmentSessionsQuerySchema } from '@/validations/AssessmentValidation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: patientId } = await params;
    const user = await requirePatientAccess(request, patientId);

    const { searchParams } = new URL(request.url);
    const queryParams = listAssessmentSessionsQuerySchema.safeParse({
      instrumentId: searchParams.get('instrumentId') || undefined,
      status: searchParams.get('status') || undefined,
      timepoint: searchParams.get('timepoint') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
    });

    if (!queryParams.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryParams.error.issues },
        { status: 400 },
      );
    }

    const assessments = await listPatientAssessments(patientId, queryParams.data);

    await logPHIAccess(user.dbUserId, 'assessment_session', patientId, request);

    return NextResponse.json({ assessments, total: assessments.length });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return handleAuthError(error);
    }
    console.error('Error fetching patient assessments:', error);
    return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: patientId } = await params;
    const user = await requirePatientAccess(request, patientId);

    // Only therapists and admins can create assessments
    if (user.role === 'patient') {
      return NextResponse.json(
        { error: 'Forbidden: Only clinicians can administer assessments' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validation = createAssessmentSessionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.issues },
        { status: 400 },
      );
    }

    const session = await createAssessmentSession({
      patientId,
      therapistId: user.dbUserId,
      organizationId: user.organizationId!,
      instrumentId: validation.data.instrumentId,
      timepoint: validation.data.timepoint,
      sessionId: validation.data.sessionId ?? null,
    });

    await logPHICreate(user.dbUserId, 'assessment_session', session!.id, request);

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return handleAuthError(error);
    }
    console.error('Error creating assessment session:', error);
    return NextResponse.json({ error: 'Failed to create assessment session' }, { status: 500 });
  }
}
