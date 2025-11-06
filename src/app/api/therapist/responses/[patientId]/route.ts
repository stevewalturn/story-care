import type { NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import {
  users,
  storyPages,
  reflectionResponses,
  surveyResponses,
  reflectionQuestions,
  surveyQuestions,
} from '@/models/Schema';
import { requireRole, handleAuthError, canAccessPatient } from '@/utils/AuthHelpers';
import { logBulkPHIAccess } from '@/services/AuditService';

type RouteContext = {
  params: Promise<{ patientId: string }>;
};

/**
 * GET /api/therapist/responses/[patientId] - Get all responses for a specific patient
 *
 * HIPAA Compliance:
 * - Requires authentication (therapist/admin only)
 * - Verifies access to patient using canAccessPatient helper
 * - Logs bulk PHI access
 * - Organization boundary enforcement
 *
 * Access Control:
 * - Therapists: Only their assigned patients
 * - Org Admins: Patients in their organization
 * - Super Admins: All patients (with audit)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { patientId } = await context.params;

    // HIPAA: Require therapist/admin authentication
    const user = await requireRole(request, ['therapist', 'org_admin', 'super_admin']);

    // Get patient info and verify access
    const [patient] = await db
      .select({
        id: users.id,
        name: users.name,
        therapistId: users.therapistId,
        organizationId: users.organizationId,
      })
      .from(users)
      .where(eq(users.id, patientId))
      .limit(1);

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // RBAC: Verify user has access to this patient
    if (!canAccessPatient(user, patientId, patient.therapistId, patient.organizationId)) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this patient' },
        { status: 403 },
      );
    }

    // Get all published pages assigned to this patient
    const pages = await db
      .select({
        id: storyPages.id,
        title: storyPages.title,
      })
      .from(storyPages)
      .where(
        and(
          eq(storyPages.patientId, patientId),
          eq(storyPages.status, 'published'),
        ),
      );

    // For each page, get all responses
    const pageResponses = await Promise.all(
      pages.map(async (page) => {
        // Get reflection responses with question details
        const reflectionResponsesData = await db
          .select({
            questionId: reflectionResponses.questionId,
            questionText: reflectionQuestions.questionText,
            responseText: reflectionResponses.responseText,
            createdAt: reflectionResponses.createdAt,
          })
          .from(reflectionResponses)
          .innerJoin(
            reflectionQuestions,
            eq(reflectionResponses.questionId, reflectionQuestions.id),
          )
          .where(
            and(
              eq(reflectionResponses.patientId, patientId),
              eq(reflectionResponses.pageId, page.id),
            ),
          );

        // Get survey responses with question details
        const surveyResponsesData = await db
          .select({
            questionId: surveyResponses.questionId,
            questionText: surveyQuestions.questionText,
            responseValue: surveyResponses.responseValue,
            responseNumeric: surveyResponses.responseNumeric,
            createdAt: surveyResponses.createdAt,
          })
          .from(surveyResponses)
          .innerJoin(
            surveyQuestions,
            eq(surveyResponses.questionId, surveyQuestions.id),
          )
          .where(
            and(
              eq(surveyResponses.patientId, patientId),
              eq(surveyResponses.pageId, page.id),
            ),
          );

        // Determine completion timestamp (most recent response)
        const allTimestamps = [
          ...reflectionResponsesData.map(r => r.createdAt),
          ...surveyResponsesData.map(r => r.createdAt),
        ].filter(Boolean);

        const completedAt = allTimestamps.length > 0
          ? new Date(Math.max(...allTimestamps.map(t => new Date(t!).getTime()))).toISOString()
          : null;

        return {
          pageId: page.id,
          pageTitle: page.title,
          completedAt,
          reflectionResponses: reflectionResponsesData,
          surveyResponses: surveyResponsesData,
        };
      }),
    );

    // Filter out pages with no responses
    const responsesWithData = pageResponses.filter(
      pr => pr.reflectionResponses.length > 0 || pr.surveyResponses.length > 0,
    );

    // HIPAA: Log bulk PHI access
    const totalResponses = responsesWithData.reduce(
      (sum, pr) => sum + pr.reflectionResponses.length + pr.surveyResponses.length,
      0,
    );

    await logBulkPHIAccess(
      request,
      user,
      'reflection_response',
      totalResponses,
      [patientId],
    );

    return NextResponse.json({
      patient: {
        id: patient.id,
        name: patient.name,
      },
      responses: responsesWithData,
    });
  } catch (error) {
    console.error('Error fetching patient responses:', error);
    return handleAuthError(error);
  }
}
