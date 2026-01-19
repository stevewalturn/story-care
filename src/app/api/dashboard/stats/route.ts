import type { NextRequest } from 'next/server';
import { and, count, eq, gte, lte } from 'drizzle-orm';
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

    // Convert Firebase UID to database UUID if provided
    let therapistDbId: string | null = null;

    // For therapists: only show their own stats
    // For org_admin/super_admin: can view any therapist's stats in their org
    if (user.role === 'therapist') {
      therapistDbId = user.dbUserId;
    } else if ((user.role === 'org_admin' || user.role === 'super_admin') && therapistFirebaseUid) {
      const [therapist] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.firebaseUid, therapistFirebaseUid))
        .limit(1);

      therapistDbId = therapist?.id || null;
    } else if (user.role === 'patient') {
      // Patients cannot access dashboard stats
      return NextResponse.json(
        { error: 'Forbidden: Patients cannot access dashboard stats' },
        { status: 403 },
      );
    }

    // Count active patients (patients with therapistId)
    const activePatientsResult = await db
      .select({ count: count() })
      .from(users)
      .where(
        therapistDbId
          ? and(eq(users.role, 'patient'), eq(users.therapistId, therapistDbId))
          : eq(users.role, 'patient'),
      );

    const activePatients = activePatientsResult[0]?.count || 0;

    // Count published pages with date filtering
    const publishedPagesConditions = [eq(storyPagesSchema.status, 'published')];
    if (therapistDbId) {
      publishedPagesConditions.push(eq(storyPagesSchema.createdByTherapistId, therapistDbId));
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

    // Count survey responses (for patients of this therapist) with date filtering
    const surveyDateConditions: ReturnType<typeof eq>[] = [];
    if (startDate) {
      surveyDateConditions.push(gte(surveyResponsesSchema.createdAt, startDate));
    }
    if (endDate) {
      surveyDateConditions.push(lte(surveyResponsesSchema.createdAt, endDate));
    }

    let surveyResponses = 0;
    if (therapistDbId) {
      // Get patient IDs for this therapist
      const therapistPatients = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.role, 'patient'), eq(users.therapistId, therapistDbId)));

      const patientIds = therapistPatients.map(p => p.id);

      if (patientIds.length > 0) {
        // Count survey responses from these patients
        const surveyResponsesResult = await db
          .select({ count: count() })
          .from(surveyResponsesSchema)
          .where(surveyDateConditions.length > 0 ? and(...surveyDateConditions) : undefined);

        surveyResponses = surveyResponsesResult[0]?.count || 0;
      }
    } else {
      const surveyResponsesResult = await db
        .select({ count: count() })
        .from(surveyResponsesSchema)
        .where(surveyDateConditions.length > 0 ? and(...surveyDateConditions) : undefined);

      surveyResponses = surveyResponsesResult[0]?.count || 0;
    }

    // Count reflection responses (written reflections for patients of this therapist) with date filtering
    const reflectionDateConditions: ReturnType<typeof eq>[] = [];
    if (startDate) {
      reflectionDateConditions.push(gte(reflectionResponsesSchema.createdAt, startDate));
    }
    if (endDate) {
      reflectionDateConditions.push(lte(reflectionResponsesSchema.createdAt, endDate));
    }

    let writtenReflections = 0;
    if (therapistDbId) {
      // Get patient IDs for this therapist
      const therapistPatients = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.role, 'patient'), eq(users.therapistId, therapistDbId)));

      const patientIds = therapistPatients.map(p => p.id);

      if (patientIds.length > 0) {
        // Count reflection responses from these patients
        const reflectionResponsesResult = await db
          .select({ count: count() })
          .from(reflectionResponsesSchema)
          .where(reflectionDateConditions.length > 0 ? and(...reflectionDateConditions) : undefined);

        writtenReflections = reflectionResponsesResult[0]?.count || 0;
      }
    } else {
      const reflectionResponsesResult = await db
        .select({ count: count() })
        .from(reflectionResponsesSchema)
        .where(reflectionDateConditions.length > 0 ? and(...reflectionDateConditions) : undefined);

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
