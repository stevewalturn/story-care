import type { NextRequest } from 'next/server';
import { count, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { generatePresignedUrl } from '@/libs/GCS';
import {
  patientPageInteractionsSchema,
  reflectionResponsesSchema,
  sessionsSchema,
  storyPagesSchema,
  surveyResponsesSchema,
  users,
} from '@/models/Schema';

// GET /api/dashboard/patient-engagement - Get patient engagement data
export async function GET(_request: NextRequest) {
  try {
    // Get all patients with their engagement metrics
    const patientsQuery = db
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        referenceImageUrl: users.referenceImageUrl,
      })
      .from(users)
      .where(eq(users.role, 'patient'));

    const patients = await patientsQuery;

    // For each patient, get their engagement data
    const patientEngagement = await Promise.all(
      patients.map(async (patient) => {
        // Count pages
        const pagesResult = await db
          .select({ count: count() })
          .from(storyPagesSchema)
          .where(eq(storyPagesSchema.patientId, patient.id));

        // Count survey responses
        const surveysResult = await db
          .select({ count: count() })
          .from(surveyResponsesSchema)
          .where(eq(surveyResponsesSchema.patientId, patient.id));

        // Count reflections
        const reflectionsResult = await db
          .select({ count: count() })
          .from(reflectionResponsesSchema)
          .where(eq(reflectionResponsesSchema.patientId, patient.id));

        // Count sessions
        const sessionsResult = await db
          .select({ count: count() })
          .from(sessionsSchema)
          .where(eq(sessionsSchema.patientId, patient.id));

        // Get last interaction time
        const lastInteractionResult = await db
          .select({ lastViewedAt: patientPageInteractionsSchema.lastViewedAt })
          .from(patientPageInteractionsSchema)
          .where(eq(patientPageInteractionsSchema.patientId, patient.id))
          .orderBy(desc(patientPageInteractionsSchema.lastViewedAt))
          .limit(1);

        const pagesCount = pagesResult[0]?.count || 0;
        const surveysCount = surveysResult[0]?.count || 0;
        const reflectionsCount = reflectionsResult[0]?.count || 0;
        const sessionsCount = sessionsResult[0]?.count || 0;
        const lastInteraction = lastInteractionResult[0]?.lastViewedAt;

        // Determine engagement status based on recent activity
        let status = 'inactive';
        if (lastInteraction) {
          const daysSinceLastInteraction = Math.floor(
            (Date.now() - new Date(lastInteraction).getTime()) / (1000 * 60 * 60 * 24),
          );
          if (daysSinceLastInteraction <= 7) {
            status = 'active';
          } else if (daysSinceLastInteraction <= 30) {
            status = 'moderate';
          }
        }

        // Generate presigned URL for avatar
        const rawAvatarUrl = patient.avatarUrl || patient.referenceImageUrl;
        const presignedAvatarUrl = rawAvatarUrl
          ? await generatePresignedUrl(rawAvatarUrl, 1)
          : null;

        return {
          id: patient.id,
          name: patient.name,
          avatarUrl: presignedAvatarUrl || rawAvatarUrl,
          pages: pagesCount,
          surveys: surveysCount,
          reflections: reflectionsCount,
          sessions: sessionsCount,
          lastInteraction,
          status,
        };
      }),
    );

    // Sort by most recent interaction
    patientEngagement.sort((a, b) => {
      if (!a.lastInteraction) {
        return 1;
      }
      if (!b.lastInteraction) {
        return -1;
      }
      return new Date(b.lastInteraction).getTime() - new Date(a.lastInteraction).getTime();
    });

    return NextResponse.json({ patients: patientEngagement });
  } catch (error) {
    console.error('Error fetching patient engagement:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient engagement' },
      { status: 500 },
    );
  }
}
