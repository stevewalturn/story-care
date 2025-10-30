import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import {
  users,
  storyPagesSchema,
  reflectionResponsesSchema,
  surveyResponsesSchema
} from '@/models/Schema';
import { eq, and, count } from 'drizzle-orm';

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const therapistFirebaseUid = searchParams.get('therapistId');

    // Convert Firebase UID to database UUID if provided
    let therapistDbId: string | null = null;
    if (therapistFirebaseUid) {
      const [therapist] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.firebaseUid, therapistFirebaseUid))
        .limit(1);

      therapistDbId = therapist?.id || null;
    }

    // Count active patients (patients with therapistId)
    const activePatientsResult = await db
      .select({ count: count() })
      .from(users)
      .where(
        therapistDbId
          ? and(eq(users.role, 'patient'), eq(users.therapistId, therapistDbId))
          : eq(users.role, 'patient')
      );

    const activePatients = activePatientsResult[0]?.count || 0;

    // Count published pages
    const publishedPagesResult = await db
      .select({ count: count() })
      .from(storyPagesSchema)
      .where(
        therapistDbId
          ? and(
              eq(storyPagesSchema.status, 'published'),
              eq(storyPagesSchema.createdByTherapistId, therapistDbId)
            )
          : eq(storyPagesSchema.status, 'published')
      );

    const publishedPages = publishedPagesResult[0]?.count || 0;

    // Count survey responses (for patients of this therapist)
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
          .from(surveyResponsesSchema);

        surveyResponses = surveyResponsesResult[0]?.count || 0;
      }
    } else {
      const surveyResponsesResult = await db
        .select({ count: count() })
        .from(surveyResponsesSchema);

      surveyResponses = surveyResponsesResult[0]?.count || 0;
    }

    // Count reflection responses (written reflections for patients of this therapist)
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
          .from(reflectionResponsesSchema);

        writtenReflections = reflectionResponsesResult[0]?.count || 0;
      }
    } else {
      const reflectionResponsesResult = await db
        .select({ count: count() })
        .from(reflectionResponsesSchema);

      writtenReflections = reflectionResponsesResult[0]?.count || 0;
    }

    return NextResponse.json({
      activePatients,
      publishedPages,
      surveyResponses,
      writtenReflections,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
