/**
 * Patient Story Page Responses API
 * Handle patient submission of reflection and survey responses
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { reflectionResponses, surveyResponses } from '@/models/Schema';
import { requireAuth } from '@/utils/AuthHelpers';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/pages/[id]/responses - Submit patient responses
 *
 * Request Body:
 * - reflectionResponses: Array of { questionId, responseText }
 * - surveyResponses: Array of { questionId, response }
 *
 * Access Control:
 * - Requires authentication (patient or authorized user)
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    // Require authentication
    const authUser = await requireAuth(request);
    const { id: pageId } = await context.params;

    const body = await request.json();
    const { reflectionResponses: reflectionData = [], surveyResponses: surveyData = [] } = body;

    // Submit reflection responses
    if (Array.isArray(reflectionData) && reflectionData.length > 0) {
      for (const response of reflectionData) {
        if (response.questionId && response.responseText) {
          await db.insert(reflectionResponses).values({
            questionId: response.questionId,
            patientId: authUser.dbUserId,
            responseText: response.responseText,
            respondedAt: new Date(),
          });
        }
      }
    }

    // Submit survey responses
    if (Array.isArray(surveyData) && surveyData.length > 0) {
      for (const response of surveyData) {
        if (response.questionId && response.response !== undefined) {
          await db.insert(surveyResponses).values({
            questionId: response.questionId,
            patientId: authUser.dbUserId,
            response: typeof response.response === 'number' ? response.response : String(response.response),
            respondedAt: new Date(),
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Responses submitted successfully',
      reflectionCount: reflectionData.length,
      surveyCount: surveyData.length,
    });
  } catch (error) {
    console.error('Error submitting responses:', error);
    return NextResponse.json(
      { error: 'Failed to submit responses' },
      { status: 500 },
    );
  }
}
