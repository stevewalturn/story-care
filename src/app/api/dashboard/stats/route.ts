import type { NextRequest } from 'next/server';
import { and, count, eq, gte, inArray, isNull, lte } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getClientInfo, logAudit } from '@/libs/AuditLogger';
import { db } from '@/libs/DB';
import {
  reflectionResponsesSchema,
  storyPagesSchema,
  surveyResponsesSchema,
  users,
} from '@/models/Schema';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const therapistFirebaseUid = searchParams.get('therapistId');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Parse date filters
    const startDate = startDateParam ? new Date(startDateParam) : null;
    const endDate = endDateParam ? new Date(endDateParam) : null;
    // Set end date to end of day for inclusive filtering
    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
    }

    // Patients cannot access dashboard stats
    if (user.role === 'patient') {
      return NextResponse.json(
        { error: 'Forbidden: Patients cannot access dashboard stats' },
        { status: 403 },
      );
    }

    // Determine organization scope
    // For therapists: show org-wide stats (not just their own patients)
    // For org_admin/super_admin: show org-wide or all stats
    const organizationId = user.organizationId;

    // If an admin passes a specific therapistId, resolve it for filtering
    let therapistDbId: string | null = null;
    if ((user.role === 'org_admin' || user.role === 'super_admin') && therapistFirebaseUid) {
      const [therapist] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.firebaseUid, therapistFirebaseUid))
        .limit(1);

      therapistDbId = therapist?.id || null;
    }

    // Count active patients scoped by organization (or specific therapist for admins)
    const patientConditions = [
      eq(users.role, 'patient'),
      eq(users.status, 'active'),
      isNull(users.deletedAt),
    ];
    if (therapistDbId) {
      patientConditions.push(eq(users.therapistId, therapistDbId));
    } else if (organizationId) {
      patientConditions.push(eq(users.organizationId, organizationId));
    }

    const activePatientsResult = await db
      .select({ count: count() })
      .from(users)
      .where(and(...patientConditions));

    const activePatients = activePatientsResult[0]?.count || 0;

    // Count published pages with date filtering, scoped by organization
    const publishedPagesConditions = [eq(storyPagesSchema.status, 'published')];
    if (therapistDbId) {
      publishedPagesConditions.push(eq(storyPagesSchema.createdByTherapistId, therapistDbId));
    } else if (organizationId) {
      // Get all therapist IDs in this organization
      const orgTherapists = await db
        .select({ id: users.id })
        .from(users)
        .where(and(
          eq(users.role, 'therapist'),
          eq(users.organizationId, organizationId),
          isNull(users.deletedAt),
        ));
      const orgTherapistIds = orgTherapists.map(t => t.id);
      if (orgTherapistIds.length > 0) {
        publishedPagesConditions.push(inArray(storyPagesSchema.createdByTherapistId, orgTherapistIds));
      }
    }
    if (startDate) {
      publishedPagesConditions.push(gte(storyPagesSchema.publishedAt, startDate));
    }
    if (endDate) {
      publishedPagesConditions.push(lte(storyPagesSchema.publishedAt, endDate));
    }

    const publishedPagesResult = await db
      .select({ count: count() })
      .from(storyPagesSchema)
      .where(and(...publishedPagesConditions));

    const publishedPages = publishedPagesResult[0]?.count || 0;

    // Count survey responses scoped by organization with date filtering
    const surveyConditions: ReturnType<typeof eq>[] = [];
    if (startDate) {
      surveyConditions.push(gte(surveyResponsesSchema.createdAt, startDate));
    }
    if (endDate) {
      surveyConditions.push(lte(surveyResponsesSchema.createdAt, endDate));
    }

    // Get patient IDs for scoping (by therapist or organization)
    let scopedPatientIds: string[] | null = null;
    if (therapistDbId) {
      const therapistPatients = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.role, 'patient'), eq(users.therapistId, therapistDbId)));
      scopedPatientIds = therapistPatients.map(p => p.id);
    } else if (organizationId) {
      const orgPatients = await db
        .select({ id: users.id })
        .from(users)
        .where(and(
          eq(users.role, 'patient'),
          eq(users.organizationId, organizationId),
          isNull(users.deletedAt),
        ));
      scopedPatientIds = orgPatients.map(p => p.id);
    }

    let surveyResponses = 0;
    if (scopedPatientIds === null || scopedPatientIds.length > 0) {
      if (scopedPatientIds && scopedPatientIds.length > 0) {
        surveyConditions.push(inArray(surveyResponsesSchema.patientId, scopedPatientIds));
      }
      const surveyResponsesResult = await db
        .select({ count: count() })
        .from(surveyResponsesSchema)
        .where(surveyConditions.length > 0 ? and(...surveyConditions) : undefined);

      surveyResponses = surveyResponsesResult[0]?.count || 0;
    }

    // Count reflection responses scoped by organization with date filtering
    const reflectionConditions: ReturnType<typeof eq>[] = [];
    if (startDate) {
      reflectionConditions.push(gte(reflectionResponsesSchema.createdAt, startDate));
    }
    if (endDate) {
      reflectionConditions.push(lte(reflectionResponsesSchema.createdAt, endDate));
    }

    // Reuse scopedPatientIds from above
    let writtenReflections = 0;
    if (scopedPatientIds === null || scopedPatientIds.length > 0) {
      if (scopedPatientIds && scopedPatientIds.length > 0) {
        reflectionConditions.push(inArray(reflectionResponsesSchema.patientId, scopedPatientIds));
      }
      const reflectionResponsesResult = await db
        .select({ count: count() })
        .from(reflectionResponsesSchema)
        .where(reflectionConditions.length > 0 ? and(...reflectionConditions) : undefined);

      writtenReflections = reflectionResponsesResult[0]?.count || 0;
    }

    // Log dashboard access
    await logAudit({
      userId: user.dbUserId,
      action: 'read',
      resourceType: 'user',
      resourceId: 'stats',
      ...getClientInfo(request),
      metadata: { therapistId: therapistDbId },
    });

    return NextResponse.json({
      activePatients,
      publishedPages,
      surveyResponses,
      writtenReflections,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return handleAuthError(error);
    }
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 },
    );
  }
}
