import type { NextRequest } from 'next/server';
import { and, desc, eq, gte, inArray, isNull, lte } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import {
  reflectionQuestionsSchema,
  reflectionResponsesSchema,
  storyPagesSchema,
  surveyQuestionsSchema,
  surveyResponsesSchema,
  users,
} from '@/models/Schema';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';

// GET /api/dashboard/recent-responses - Get recent reflection and survey responses
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get('limit') || '10', 10);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Parse date filters
    const startDate = startDateParam ? new Date(startDateParam) : null;
    const endDate = endDateParam ? new Date(endDateParam) : null;
    // Set end date to end of day for inclusive filtering
    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
    }

    // Get org-scoped patient IDs
    const organizationId = user.organizationId;
    let orgPatientIds: string[] | null = null;
    if (organizationId) {
      const orgPatients = await db
        .select({ id: users.id })
        .from(users)
        .where(and(
          eq(users.role, 'patient'),
          eq(users.organizationId, organizationId),
          isNull(users.deletedAt),
        ));
      orgPatientIds = orgPatients.map(p => p.id);

      if (orgPatientIds.length === 0) {
        return NextResponse.json({ reflections: [], surveys: [] });
      }
    }

    // Build conditions for reflection responses
    const reflectionConditions: ReturnType<typeof eq>[] = [];
    if (startDate) {
      reflectionConditions.push(gte(reflectionResponsesSchema.createdAt, startDate));
    }
    if (endDate) {
      reflectionConditions.push(lte(reflectionResponsesSchema.createdAt, endDate));
    }
    if (orgPatientIds && orgPatientIds.length > 0) {
      reflectionConditions.push(inArray(reflectionResponsesSchema.patientId, orgPatientIds));
    }

    // Build conditions for survey responses
    const surveyConditions: ReturnType<typeof eq>[] = [];
    if (startDate) {
      surveyConditions.push(gte(surveyResponsesSchema.createdAt, startDate));
    }
    if (endDate) {
      surveyConditions.push(lte(surveyResponsesSchema.createdAt, endDate));
    }
    if (orgPatientIds && orgPatientIds.length > 0) {
      surveyConditions.push(inArray(surveyResponsesSchema.patientId, orgPatientIds));
    }

    // Fetch recent reflection responses
    const recentReflections = await db
      .select({
        id: reflectionResponsesSchema.id,
        patientId: reflectionResponsesSchema.patientId,
        patientName: users.name,
        questionId: reflectionResponsesSchema.questionId,
        questionText: reflectionQuestionsSchema.questionText,
        response: reflectionResponsesSchema.responseText,
        pageId: reflectionResponsesSchema.pageId,
        pageTitle: storyPagesSchema.title,
        createdAt: reflectionResponsesSchema.createdAt,
      })
      .from(reflectionResponsesSchema)
      .leftJoin(users, eq(reflectionResponsesSchema.patientId, users.id))
      .leftJoin(
        reflectionQuestionsSchema,
        eq(reflectionResponsesSchema.questionId, reflectionQuestionsSchema.id),
      )
      .leftJoin(storyPagesSchema, eq(reflectionResponsesSchema.pageId, storyPagesSchema.id))
      .where(reflectionConditions.length > 0 ? and(...reflectionConditions) : undefined)
      .orderBy(desc(reflectionResponsesSchema.createdAt))
      .limit(limit);

    // Fetch recent survey responses
    const recentSurveys = await db
      .select({
        id: surveyResponsesSchema.id,
        patientId: surveyResponsesSchema.patientId,
        patientName: users.name,
        questionId: surveyResponsesSchema.questionId,
        questionText: surveyQuestionsSchema.questionText,
        response: surveyResponsesSchema.responseValue,
        responseNumeric: surveyResponsesSchema.responseNumeric,
        pageId: surveyResponsesSchema.pageId,
        pageTitle: storyPagesSchema.title,
        createdAt: surveyResponsesSchema.createdAt,
      })
      .from(surveyResponsesSchema)
      .leftJoin(users, eq(surveyResponsesSchema.patientId, users.id))
      .leftJoin(surveyQuestionsSchema, eq(surveyResponsesSchema.questionId, surveyQuestionsSchema.id))
      .leftJoin(storyPagesSchema, eq(surveyResponsesSchema.pageId, storyPagesSchema.id))
      .where(surveyConditions.length > 0 ? and(...surveyConditions) : undefined)
      .orderBy(desc(surveyResponsesSchema.createdAt))
      .limit(limit);

    return NextResponse.json({
      reflections: recentReflections,
      surveys: recentSurveys,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return handleAuthError(error);
    }
    console.error('Error fetching recent responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent responses' },
      { status: 500 },
    );
  }
}
