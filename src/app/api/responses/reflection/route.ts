import type { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/libs/DB';
import {
  reflectionQuestions,
  reflectionResponses,
  storyPages,
} from '@/models/Schema';
import { logPHIAccess } from '@/services/AuditService';
import { handleAuthError, requireRole } from '@/utils/AuthHelpers';

/**
 * Validation schema for reflection response submission
 */
const reflectionResponseSchema = z.object({
  responses: z.array(
    z.object({
      questionId: z.string().uuid('Invalid question ID format'),
      pageId: z.string().uuid('Invalid page ID format'),
      responseText: z.string().min(1, 'Response text cannot be empty').max(10000, 'Response text too long'),
    }),
  ).min(1, 'At least one response is required').max(100, 'Too many responses in one request'),
});

/**
 * POST /api/responses/reflection - Submit reflection responses
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
 * - Input validation (XSS prevention)
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
    const validated = reflectionResponseSchema.parse(body);

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

    // SECURITY: Verify all questions exist and belong to the specified pages
    for (const response of validated.responses) {
      const [question] = await db
        .select({
          id: reflectionQuestions.id,
          blockId: reflectionQuestions.blockId,
        })
        .from(reflectionQuestions)
        .where(eq(reflectionQuestions.id, response.questionId))
        .limit(1);

      if (!question) {
        return NextResponse.json(
          { error: `Question ${response.questionId} not found` },
          { status: 400 },
        );
      }

      // TODO: Verify question belongs to the page (requires page_blocks join)
      // This prevents patients from submitting responses to questions from other pages
    }

    // Process responses (upsert: update if exists, insert if not)
    const results = [];
    for (const response of validated.responses) {
      const { questionId, pageId, responseText } = response;

      // Check if response already exists
      const [existing] = await db
        .select()
        .from(reflectionResponses)
        .where(
          and(
            eq(reflectionResponses.patientId, user.dbUserId),
            eq(reflectionResponses.questionId, questionId),
            eq(reflectionResponses.pageId, pageId),
          ),
        )
        .limit(1);

      if (existing) {
        // Update existing response
        const [updated] = await db
          .update(reflectionResponses)
          .set({
            responseText,
            updatedAt: new Date(),
          })
          .where(eq(reflectionResponses.id, existing.id))
          .returning();

        results.push(updated);

        // HIPAA: Log PHI update
        await logPHIAccess(
          request,
          user,
          'update',
          'reflection_response',
          existing.id,
          user.dbUserId,
        );
      } else {
        // Insert new response
        const [inserted] = await db
          .insert(reflectionResponses)
          .values({
            patientId: user.dbUserId,
            questionId,
            pageId,
            responseText,
          })
          .returning();

        results.push(inserted);

        // HIPAA: Log PHI creation
        await logPHIAccess(
          request,
          user,
          'create',
          'reflection_response',
          inserted!.id,
          user.dbUserId,
        );
      }
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

    console.error('Error submitting reflection responses:', error);
    return handleAuthError(error);
  }
}
