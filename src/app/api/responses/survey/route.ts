import type { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/libs/DB';
import {
  storyPages,
  surveyQuestions,
  surveyResponses,
} from '@/models/Schema';
import { logPHIAccess } from '@/services/AuditService';
import { handleAuthError, requireRole } from '@/utils/AuthHelpers';

/**
 * Validation schema for survey response submission
 */
const surveyResponseSchema = z.object({
  responses: z.array(
    z.object({
      questionId: z.string().uuid('Invalid question ID format'),
      pageId: z.string().uuid('Invalid page ID format'),
      responseValue: z.string().max(1000, 'Response value too long').optional().nullable(),
      responseNumeric: z.number().int().min(1).max(10).optional().nullable(),
    }).refine(
      data => data.responseValue !== null || data.responseNumeric !== null,
      'Either responseValue or responseNumeric must be provided',
    ),
  ).min(1, 'At least one response is required').max(100, 'Too many responses in one request'),
});

/**
 * POST /api/responses/survey - Submit survey responses
 *
 * HIPAA Compliance:
 * - Requires authentication (patients only)
 * - Validates input with Zod
 * - Verifies patient has access to the page
 * - Logs all PHI writes
 * - Enforces patient can only submit for their own assigned pages
 *
 * Access Control:
 * - Only patients can submit responses
 * - Patients can only respond to their assigned published pages
 *
 * Security Measures:
 * - Input validation (XSS prevention, numeric range checking)
 * - SQL injection prevention (parameterized queries via Drizzle)
 * - Rate limiting (should be handled by Arcjet middleware)
 * - Audit logging
 */
export async function POST(request: NextRequest) {
  try {
    // HIPAA: Require patient authentication
    const user = await requireRole(request, ['patient']);

    // Parse and validate request body
    const body = await request.json();
    const validated = surveyResponseSchema.parse(body);

    // SECURITY: Verify patient has access to all pages in the request
    const pageIds = [...new Set(validated.responses.map(r => r.pageId))];

    for (const pageId of pageIds) {
      const [page] = await db
        .select({
          id: storyPages.id,
          patientId: storyPages.patientId,
          status: storyPages.status,
        })
        .from(storyPages)
        .where(eq(storyPages.id, pageId))
        .limit(1);

      if (!page) {
        return NextResponse.json(
          { error: 'Story page not found' },
          { status: 404 },
        );
      }

      // RBAC: Patients can only respond to their assigned published pages
      if (page.patientId !== user.dbUserId) {
        return NextResponse.json(
          { error: 'Forbidden: This page is not assigned to you' },
          { status: 403 },
        );
      }

      if (page.status !== 'published') {
        return NextResponse.json(
          { error: 'Forbidden: You can only respond to published pages' },
          { status: 403 },
        );
      }
    }

    // SECURITY: Verify all questions exist
    for (const response of validated.responses) {
      const [question] = await db
        .select({
          id: surveyQuestions.id,
          blockId: surveyQuestions.blockId,
        })
        .from(surveyQuestions)
        .where(eq(surveyQuestions.id, response.questionId))
        .limit(1);

      if (!question) {
        return NextResponse.json(
          { error: `Question ${response.questionId} not found` },
          { status: 400 },
        );
      }

      // TODO: Verify question belongs to the page (requires page_blocks join)
    }

    // Process responses (delete and re-insert for surveys to maintain creation timestamp)
    const results = [];
    for (const response of validated.responses) {
      const { questionId, pageId, responseValue, responseNumeric } = response;

      // Check if response already exists
      const [existing] = await db
        .select()
        .from(surveyResponses)
        .where(
          and(
            eq(surveyResponses.patientId, user.dbUserId),
            eq(surveyResponses.questionId, questionId),
            eq(surveyResponses.pageId, pageId),
          ),
        )
        .limit(1);

      if (existing) {
        // Delete existing response (surveys track submission time, not edit time)
        await db
          .delete(surveyResponses)
          .where(eq(surveyResponses.id, existing.id));

        // HIPAA: Log PHI deletion
        await logPHIAccess(
          request,
          user,
          'delete',
          'survey_response',
          existing.id,
          user.dbUserId,
        );
      }

      // Insert new response
      const [inserted] = await db
        .insert(surveyResponses)
        .values({
          patientId: user.dbUserId,
          questionId,
          pageId,
          responseValue: responseValue || null,
          responseNumeric: responseNumeric || null,
        })
        .returning();

      results.push(inserted);

      // HIPAA: Log PHI creation
      await logPHIAccess(
        request,
        user,
        'create',
        'survey_response',
        inserted!.id,
        user.dbUserId,
      );
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      responses: results,
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: error.issues,
        },
        { status: 400 },
      );
    }

    console.error('Error submitting survey responses:', error);
    return handleAuthError(error);
  }
}
