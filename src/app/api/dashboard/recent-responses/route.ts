import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import {
  users,
  reflectionResponsesSchema,
  surveyResponsesSchema,
  reflectionQuestionsSchema,
  surveyQuestionsSchema,
  storyPagesSchema,
} from '@/models/Schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/dashboard/recent-responses - Get recent reflection and survey responses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

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
        eq(reflectionResponsesSchema.questionId, reflectionQuestionsSchema.id)
      )
      .leftJoin(storyPagesSchema, eq(reflectionResponsesSchema.pageId, storyPagesSchema.id))
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
      { status: 500 }
    );
  }
}
