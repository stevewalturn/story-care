import type { NextRequest } from 'next/server';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { generatePresignedUrl } from '@/libs/GCS';
import { sessions, users } from '@/models/Schema';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';
import { extractGcsPath } from '@/utils/GCSUtils';

// GET /api/sessions/recent - Get recent sessions for the authenticated therapist
export async function GET(request: NextRequest) {
  try {
    // 1. AUTHENTICATE: Verify user is a therapist or admin
    const user = await requireTherapist(request);

    // 2. PARSE QUERY PARAMETERS
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '5', 10), 20);

    // 3. BUILD WHERE CONDITIONS
    const whereConditions = [];

    // Role-based access control
    if (user.role === 'org_admin' || user.role === 'super_admin') {
      whereConditions.push(isNull(sessions.deletedAt)); // Org/Super Admin sees all sessions
    } else {
      whereConditions.push(eq(sessions.therapistId, user.dbUserId)); // Therapist sees only their sessions
      whereConditions.push(isNull(sessions.deletedAt)); // Filter out soft-deleted sessions
    }

    // 4. FETCH RECENT SESSIONS
    const recentSessions = await db
      .select({
        id: sessions.id,
        title: sessions.title,
        sessionDate: sessions.sessionDate,
        sessionType: sessions.sessionType,
        patientId: sessions.patientId,
        audioUrl: sessions.audioUrl,
        transcriptionStatus: sessions.transcriptionStatus,
        createdAt: sessions.createdAt,
        updatedAt: sessions.updatedAt,
      })
      .from(sessions)
      .where(and(...whereConditions))
      .orderBy(desc(sessions.updatedAt))
      .limit(limit);

    // 5. ENRICH WITH PATIENT INFO AND PRESIGNED URLS
    const enrichedSessions = await Promise.all(
      recentSessions.map(async (session) => {
        // Get patient info if exists
        let patient = null;
        if (session.patientId) {
          const patientData = await db
            .select({
              id: users.id,
              name: users.name,
              email: users.email,
              referenceImageUrl: users.referenceImageUrl,
            })
            .from(users)
            .where(eq(users.id, session.patientId))
            .limit(1);

          if (patientData[0]) {
            patient = {
              ...patientData[0],
              // Generate presigned URL for patient image if exists
              referenceImageUrl: patientData[0].referenceImageUrl
                ? await generatePresignedUrl(extractGcsPath(patientData[0].referenceImageUrl))
                : null,
            };
          }
        }

        // Generate presigned URL for audio if exists
        const audioUrl = session.audioUrl
          ? await generatePresignedUrl(extractGcsPath(session.audioUrl))
          : null;

        return {
          ...session,
          audioUrl,
          patient,
        };
      }),
    );

    return NextResponse.json({ sessions: enrichedSessions });
  } catch (error) {
    console.error('Error fetching recent sessions:', error);
    return handleAuthError(error);
  }
}
