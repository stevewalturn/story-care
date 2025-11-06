import type { NextRequest } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { reflectionQuestions, pageBlocks, storyPages, users } from '@/models/Schema';
import { requireAuth, handleAuthError, canAccessPatient } from '@/utils/AuthHelpers';
import { logAuditFromRequest } from '@/services/AuditService';

/**
 * GET /api/questions/reflection?blockIds=id1,id2,id3
 *
 * HIPAA Compliance:
 * - Requires authentication
 * - Verifies user has access to the story page
 * - Logs all PHI access
 * - Patients can only access their assigned published pages
 * - Therapists can only access their patients' pages
 *
 * Access Control:
 * - Patients: Only their assigned published pages
 * - Therapists: Only their patients' pages
 * - Org Admins: All pages in their organization
 * - Super Admins: All pages
 */
export async function GET(request: NextRequest) {
  try {
    // HIPAA: Require authentication
    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const blockIdsParam = searchParams.get('blockIds');

    if (!blockIdsParam) {
      return NextResponse.json(
        { error: 'blockIds parameter is required' },
        { status: 400 },
      );
    }

    const blockIds = blockIdsParam.split(',').filter(id => id.trim());

    if (blockIds.length === 0) {
      return NextResponse.json({ questions: [] });
    }

    // SECURITY: Verify user has access to these blocks
    // Get all blocks and their associated pages
    const blocks = await db
      .select({
        blockId: pageBlocks.id,
        pageId: pageBlocks.pageId,
      })
      .from(pageBlocks)
      .where(inArray(pageBlocks.id, blockIds));

    if (blocks.length === 0) {
      return NextResponse.json({ questions: [] });
    }

    // Get unique page IDs
    const pageIds = [...new Set(blocks.map(b => b.pageId))];

    // Get all pages with patient info
    const pages = await db
      .select({
        id: storyPages.id,
        patientId: storyPages.patientId,
        status: storyPages.status,
      })
      .from(storyPages)
      .where(inArray(storyPages.id, pageIds));

    // RBAC: Check access for each page
    for (const page of pages) {
      // Patients can only access published pages assigned to them
      if (user.role === 'patient') {
        if (page.status !== 'published' || page.patientId !== user.dbUserId) {
          return NextResponse.json(
            { error: 'Forbidden: You can only access your published story pages' },
            { status: 403 },
          );
        }
      }

      // Therapists can only access their patients' pages
      if (user.role === 'therapist') {
        if (!page.patientId) {
          return NextResponse.json(
            { error: 'Forbidden: Page not assigned to a patient' },
            { status: 403 },
          );
        }

        const [patient] = await db
          .select({
            therapistId: users.therapistId,
            organizationId: users.organizationId,
          })
          .from(users)
          .where(eq(users.id, page.patientId))
          .limit(1);

        if (!patient) {
          return NextResponse.json(
            { error: 'Patient not found' },
            { status: 404 },
          );
        }

        if (!canAccessPatient(user, page.patientId, patient.therapistId, patient.organizationId)) {
          return NextResponse.json(
            { error: 'Forbidden: This patient is not assigned to you' },
            { status: 403 },
          );
        }
      }

      // Org admins can only access pages in their organization
      if (user.role === 'org_admin') {
        if (!page.patientId) {
          return NextResponse.json(
            { error: 'Forbidden: Page not assigned to a patient' },
            { status: 403 },
          );
        }

        const [patient] = await db
          .select({ organizationId: users.organizationId })
          .from(users)
          .where(eq(users.id, page.patientId))
          .limit(1);

        if (!patient || patient.organizationId !== user.organizationId) {
          return NextResponse.json(
            { error: 'Forbidden: Patient not in your organization' },
            { status: 403 },
          );
        }
      }
    }

    // Fetch questions
    const questions = await db
      .select()
      .from(reflectionQuestions)
      .where(inArray(reflectionQuestions.blockId, blockIds))
      .orderBy(reflectionQuestions.sequenceNumber);

    // HIPAA: Log PHI access
    await logAuditFromRequest(
      request,
      user,
      'read',
      'reflection_question',
      null,
      {
        blockIds,
        questionCount: questions.length,
        pageIds,
      },
    );

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error fetching reflection questions:', error);
    return handleAuthError(error);
  }
}
