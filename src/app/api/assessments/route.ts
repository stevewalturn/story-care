/**
 * API Route: Assessment Sessions (therapist-wide list)
 * GET: List assessment sessions with role-based scoping
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { listAssessments } from '@/services/AssessmentService';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';
import { listAllAssessmentSessionsQuerySchema } from '@/validations/AssessmentValidation';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role === 'patient') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validated = listAllAssessmentSessionsQuerySchema.parse(searchParams);

    const scopeParams: Record<string, unknown> = { ...validated };

    if (user.role === 'therapist') {
      scopeParams.therapistId = user.dbUserId;
    } else if (user.role === 'org_admin') {
      scopeParams.organizationId = user.organizationId;
    }
    // super_admin: no scoping needed

    const assessments = await listAssessments(scopeParams as Parameters<typeof listAssessments>[0]);

    return NextResponse.json({ assessments });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return handleAuthError(error);
    }
    console.error('Error listing assessments:', error);
    return NextResponse.json({ error: 'Failed to list assessments' }, { status: 500 });
  }
}
