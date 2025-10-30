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
    const therapistId = searchParams.get('therapistId');

    // Count active patients (patients with therapistId)
    const activePatientsResult = await db
      .select({ count: count() })
      .from(users)
      .where(
        therapistId
          ? and(eq(users.role, 'patient'), eq(users.therapistId, therapistId))
          : eq(users.role, 'patient')
      );

    const activePatients = activePatientsResult[0]?.count || 0;

    // Count published pages
    const publishedPagesResult = await db
      .select({ count: count() })
      .from(storyPagesSchema)
      .where(
        therapistId
          ? and(
              eq(storyPagesSchema.status, 'published'),
              eq(storyPagesSchema.createdByTherapistId, therapistId)
            )
          : eq(storyPagesSchema.status, 'published')
      );

    const publishedPages = publishedPagesResult[0]?.count || 0;

    // Count survey responses
    const surveyResponsesResult = await db
      .select({ count: count() })
      .from(surveyResponsesSchema);

    const surveyResponses = surveyResponsesResult[0]?.count || 0;

    // Count reflection responses (written reflections)
    const reflectionResponsesResult = await db
      .select({ count: count() })
      .from(reflectionResponsesSchema);

    const writtenReflections = reflectionResponsesResult[0]?.count || 0;

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
