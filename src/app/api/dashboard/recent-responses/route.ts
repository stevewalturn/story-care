import type { NextRequest } from 'next/server';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
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

// GET /api/dashboard/recent-responses - Get recent reflection and survey responses
export async function GET(request: NextRequest) {
  try {
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

    // Build date conditions for reflection responses
    const reflectionDateConditions: ReturnType<typeof eq>[] = [];
    if (startDate) {
      reflectionDateConditions.push(gte(reflectionResponsesSchema.createdAt, startDate));
    }
    if (endDate) {
      reflectionDateConditions.push(lte(reflectionResponsesSchema.createdAt, endDate));
    }

    // Build date conditions for survey responses
    const surveyDateConditions: ReturnType<typeof eq>[] = [];
    if (startDate) {
      surveyDateConditions.push(gte(surveyResponsesSchema.createdAt, startDate));
    }
    if (endDate) {
      surveyDateConditions.push(lte(surveyResponsesSchema.createdAt, endDate));
    }

    // Fetch recent reflection responses
    const reflectionQuery = db
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
      .leftJoin(storyPagesSchema, eq(reflectionResponsesSchema.pageId, storyPagesSchema.id));

    // Apply date filtering if conditions exist
    const recentReflections = reflectionDateConditions.length > 0
      ? await reflectionQuery
          .where(and(...reflectionDateConditions))
          .orderBy(desc(reflectionResponsesSchema.createdAt))
          .limit(limit)
      : await reflectionQuery
          .orderBy(desc(reflectionResponsesSchema.createdAt))
          .limit(limit);

    // Fetch recent survey responses
    const surveyQuery = db
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
      .leftJoin(storyPagesSchema, eq(surveyResponsesSchema.pageId, storyPagesSchema.id));

    // Apply date filtering if conditions exist
    const recentSurveys = surveyDateConditions.length > 0
      ? await surveyQuery
          .where(and(...surveyDateConditions))
          .orderBy(desc(surveyResponsesSchema.createdAt))
          .limit(limit)
      : await surveyQuery
          .orderBy(desc(surveyResponsesSchema.createdAt))
          .limit(limit);

    return NextResponse.json({
      reflections: recentReflections,
      surveys: recentSurveys,
    });
  } catch (error) {
    console.error('Error fetching recent responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent responses' },
      { status: 500 },
    );
  }
}
