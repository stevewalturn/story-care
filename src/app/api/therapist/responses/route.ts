import type { NextRequest } from 'next/server';
import { and, count, eq, max } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { reflectionResponses, storyPages, surveyResponses, users } from '@/models/Schema';
import { logBulkPHIAccess } from '@/services/AuditService';
import { handleAuthError, requireRole } from '@/utils/AuthHelpers';

/**
 * GET /api/therapist/responses - Get patient responses summary for therapist
 *
 * HIPAA Compliance:
 * - Requires authentication (therapists only)
 * - Returns only therapist's assigned patients
 * - Logs bulk PHI access
 * - Organization boundary enforcement
 *
 * Access Control:
 * - Therapists: Only their assigned patients
 * - Org Admins: All patients in their organization
 * - Super Admins: All patients (with audit)
 */
export async function GET(request: NextRequest) {
  try {
    // HIPAA: Require therapist/admin authentication
    const user = await requireRole(request, ['therapist', 'org_admin', 'super_admin']);

    // RBAC: Get patients based on role
    let patientsQuery = db
      .select({
        id: users.id,
        name: users.name,
      })
      .from(users)
      .where(eq(users.role, 'patient'));

    // Therapists: Only their assigned patients
    if (user.role === 'therapist') {
      patientsQuery = patientsQuery.where(eq(users.therapistId, user.dbUserId)) as any;
    }

    // Org Admins: Only patients in their organization
    if (user.role === 'org_admin') {
      if (!user.organizationId) {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 400 },
        );
      }
      patientsQuery = patientsQuery.where(eq(users.organizationId, user.organizationId)) as any;
    }

    // Super admins can access all patients (no additional filter)

    const patients = await patientsQuery;

    // For each patient, calculate response statistics
    const responsesData = await Promise.all(
      patients.map(async (patient) => {
        // Count total pages assigned to this patient
        const totalPagesResult = await db
          .select({ count: count() })
          .from(storyPages)
          .where(
            and(
              eq(storyPages.patientId, patient.id),
              eq(storyPages.status, 'published'),
            ),
          );
        const totalPages = Number(totalPagesResult[0]?.count || 0);

        // Get unique pages with reflection responses
        const reflectionPagesResult = await db
          .selectDistinct({ pageId: reflectionResponses.pageId })
          .from(reflectionResponses)
          .where(eq(reflectionResponses.patientId, patient.id));

        // Get unique pages with survey responses
        const surveyPagesResult = await db
          .selectDistinct({ pageId: surveyResponses.pageId })
          .from(surveyResponses)
          .where(eq(surveyResponses.patientId, patient.id));

        // Combine unique page IDs from both reflection and survey responses
        const completedPageIds = new Set([
          ...reflectionPagesResult.map(r => r.pageId),
          ...surveyPagesResult.map(r => r.pageId),
        ]);

        const completedPages = completedPageIds.size;
        const pendingPages = Math.max(0, totalPages - completedPages);

        // Get last response timestamp
        const lastReflectionResult = await db
          .select({ lastResponse: max(reflectionResponses.updatedAt) })
          .from(reflectionResponses)
          .where(eq(reflectionResponses.patientId, patient.id));

        const lastSurveyResult = await db
          .select({ lastResponse: max(surveyResponses.createdAt) })
          .from(surveyResponses)
          .where(eq(surveyResponses.patientId, patient.id));

        const lastReflection = lastReflectionResult[0]?.lastResponse;
        const lastSurvey = lastSurveyResult[0]?.lastResponse;

        let lastResponseAt: string | null = null;
        if (lastReflection && lastSurvey) {
          lastResponseAt = new Date(Math.max(
            new Date(lastReflection).getTime(),
            new Date(lastSurvey).getTime(),
          )).toISOString();
        } else if (lastReflection) {
          lastResponseAt = new Date(lastReflection).toISOString();
        } else if (lastSurvey) {
          lastResponseAt = new Date(lastSurvey).toISOString();
        }

        return {
          patientId: patient.id,
          patientName: patient.name,
          totalPages,
          completedPages,
          pendingPages,
          lastResponseAt,
        };
      }),
    );

    // HIPAA: Log bulk PHI access
    await logBulkPHIAccess(
      request,
      user,
      'reflection_response',
      responsesData.reduce((sum, r) => sum + r.completedPages, 0),
      patients.map(p => p.id),
    );

    return NextResponse.json({ responses: responsesData });
  } catch (error) {
    console.error('Error fetching therapist responses:', error);
    return handleAuthError(error);
  }
}
