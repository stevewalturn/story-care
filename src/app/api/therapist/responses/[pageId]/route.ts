import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import {
  reflectionQuestions,
  reflectionResponses,
  storyPages,
  surveyQuestions,
  surveyResponses,
  users,
} from '@/models/Schema';
import { logBulkPHIAccess } from '@/services/AuditService';
import { handleAuthError, requireRole } from '@/utils/AuthHelpers';

type RouteContext = {
  params: Promise<{ pageId: string }>;
};

/**
 * GET /api/therapist/responses/[pageId] - Get all responses for a specific story page
 *
 * HIPAA Compliance:
 * - Requires authentication (therapist/admin only)
 * - Verifies access to page (created by therapist)
 * - Logs bulk PHI access
 * - Organization boundary enforcement
 *
 * Access Control:
 * - Therapists: Only pages they created
 * - Org Admins: Pages created by therapists in their organization
 * - Super Admins: All pages (with audit)
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { pageId } = await context.params;

    // HIPAA: Require therapist/admin authentication
    const user = await requireRole(request, ['therapist', 'org_admin', 'super_admin']);

    // Get page info and verify access
    const [page] = await db
      .select({
        id: storyPages.id,
        title: storyPages.title,
        patientId: storyPages.patientId,
        createdByTherapistId: storyPages.createdByTherapistId,
        publishedAt: storyPages.publishedAt,
      })
      .from(storyPages)
      .where(eq(storyPages.id, pageId))
      .limit(1);

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // RBAC: Verify user has access to this page
    if (user.role === 'therapist' && page.createdByTherapistId !== user.dbUserId) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this page' },
        { status: 403 },
      );
    }

    // Get patient name
    const [patient] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, page.patientId))
      .limit(1);

    // Get reflection responses with question details
    const reflectionResponsesData = await db
      .select({
        id: reflectionResponses.id,
        questionText: reflectionQuestions.questionText,
        responseText: reflectionResponses.responseText,
        createdAt: reflectionResponses.createdAt,
        updatedAt: reflectionResponses.updatedAt,
      })
      .from(reflectionResponses)
      .innerJoin(
        reflectionQuestions,
        eq(reflectionResponses.questionId, reflectionQuestions.id),
      )
      .where(eq(reflectionResponses.pageId, pageId))
      .orderBy(reflectionResponses.createdAt);

    // Get survey responses with question details
    const surveyResponsesData = await db
      .select({
        id: surveyResponses.id,
        questionText: surveyQuestions.questionText,
        questionType: surveyQuestions.questionType,
        responseValue: surveyResponses.responseValue,
        responseNumeric: surveyResponses.responseNumeric,
        createdAt: surveyResponses.createdAt,
      })
      .from(surveyResponses)
      .innerJoin(
        surveyQuestions,
        eq(surveyResponses.questionId, surveyQuestions.id),
      )
      .where(eq(surveyResponses.pageId, pageId))
      .orderBy(surveyResponses.createdAt);

    // HIPAA: Log bulk PHI access
    const totalResponses = reflectionResponsesData.length + surveyResponsesData.length;

    await logBulkPHIAccess(
      request,
      user,
      'story_page',
      totalResponses,
      [pageId],
    );

    return NextResponse.json({
      page: {
        id: page.id,
        title: page.title,
        patientName: patient?.name || 'Unknown Patient',
        publishedAt: page.publishedAt,
      },
      reflectionResponses: reflectionResponsesData,
      surveyResponses: surveyResponsesData,
    });
  } catch (error) {
    console.error('Error fetching page responses:', error);
    return handleAuthError(error);
  }
}
