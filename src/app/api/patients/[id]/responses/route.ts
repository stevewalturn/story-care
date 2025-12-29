/**
 * Patient Responses API
 * Fetch reflection and survey responses for a patient
 */

import type { NextRequest } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { logPHIAccess } from '@/libs/AuditLogger';
import { db } from '@/libs/DB';
import { requirePatientAccess } from '@/middleware/RBACMiddleware';
import {
  reflectionQuestions,
  reflectionResponses,
  storyPages,
  surveyQuestions,
  surveyResponses,
} from '@/models/Schema';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/patients/[id]/responses - Get all responses for a patient
 *
 * Query Parameters:
 * - type: 'reflections' | 'surveys' | 'all' (default: 'all')
 *
 * Access Control:
 * - Requires authentication
 * - User must have access to the patient (therapist, org_admin, super_admin)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: patientId } = await context.params;

    // Verify user has access to this patient
    const user = await requirePatientAccess(request, patientId);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    const result: {
      reflectionResponses?: any[];
      surveyResponses?: any[];
    } = {};

    // Fetch reflection responses with question details
    if (type === 'all' || type === 'reflections') {
      const reflections = await db
        .select({
          id: reflectionResponses.id,
          responseText: reflectionResponses.responseText,
          createdAt: reflectionResponses.createdAt,
          questionId: reflectionResponses.questionId,
          pageId: reflectionResponses.pageId,
          questionText: reflectionQuestions.questionText,
          questionType: reflectionQuestions.questionType,
          sequenceNumber: reflectionQuestions.sequenceNumber,
          pageTitle: storyPages.title,
        })
        .from(reflectionResponses)
        .leftJoin(reflectionQuestions, eq(reflectionResponses.questionId, reflectionQuestions.id))
        .leftJoin(storyPages, eq(reflectionResponses.pageId, storyPages.id))
        .where(eq(reflectionResponses.patientId, patientId))
        .orderBy(desc(reflectionResponses.createdAt));

      result.reflectionResponses = reflections.map(r => ({
        id: r.id,
        question: r.questionText || 'Question',
        answer: r.responseText,
        source: r.pageTitle || 'Story Page',
        timestamp: r.createdAt,
        questionNumber: r.sequenceNumber,
      }));
    }

    // Fetch survey responses with question details
    if (type === 'all' || type === 'surveys') {
      const surveys = await db
        .select({
          id: surveyResponses.id,
          responseValue: surveyResponses.responseValue,
          responseNumeric: surveyResponses.responseNumeric,
          createdAt: surveyResponses.createdAt,
          questionId: surveyResponses.questionId,
          pageId: surveyResponses.pageId,
          questionText: surveyQuestions.questionText,
          questionType: surveyQuestions.questionType,
          sequenceNumber: surveyQuestions.sequenceNumber,
          pageTitle: storyPages.title,
        })
        .from(surveyResponses)
        .leftJoin(surveyQuestions, eq(surveyResponses.questionId, surveyQuestions.id))
        .leftJoin(storyPages, eq(surveyResponses.pageId, storyPages.id))
        .where(eq(surveyResponses.patientId, patientId))
        .orderBy(desc(surveyResponses.createdAt));

      result.surveyResponses = surveys.map(s => ({
        id: s.id,
        question: s.questionText || 'Question',
        answer: s.responseValue || String(s.responseNumeric) || '',
        source: s.pageTitle || 'Story Page',
        timestamp: s.createdAt,
        questionNumber: s.sequenceNumber,
        questionType: s.questionType,
      }));
    }

    // Log PHI access (using reflection_response as the primary type for combined responses)
    await logPHIAccess(user.dbUserId, 'reflection_response', patientId, request);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Error fetching patient responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient responses' },
      { status: 500 },
    );
  }
}
