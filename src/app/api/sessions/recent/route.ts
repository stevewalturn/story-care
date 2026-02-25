import type { NextRequest } from 'next/server';
import { and, desc, eq, inArray, isNull, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { generatePresignedUrl } from '@/libs/GCS';
import { groupMembers, sessions, users } from '@/models/Schema';
import { getTherapistPatientIds, handleAuthError, requireTherapist } from '@/utils/AuthHelpers';
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
    let therapistPatientIds: string[] = [];
    if (user.role === 'org_admin' || user.role === 'super_admin') {
      whereConditions.push(isNull(sessions.deletedAt)); // Org/Super Admin sees all sessions
    } else {
      // Therapist sees: sessions they created + sessions for their currently-assigned patients
      therapistPatientIds = await getTherapistPatientIds(user.dbUserId);

      let patientGroupIdsForAccess: string[] = [];
      if (therapistPatientIds.length > 0) {
        const patientGroups = await db
          .select({ groupId: groupMembers.groupId })
          .from(groupMembers)
          .where(
            and(
              inArray(groupMembers.patientId, therapistPatientIds),
              isNull(groupMembers.leftAt),
            ),
          );
        patientGroupIdsForAccess = patientGroups
          .map(g => g.groupId)
          .filter((id): id is string => id !== null);
      }

      const accessConditions = [
        eq(sessions.therapistId, user.dbUserId),
      ];
      if (therapistPatientIds.length > 0) {
        accessConditions.push(inArray(sessions.patientId, therapistPatientIds));
      }
      if (patientGroupIdsForAccess.length > 0) {
        accessConditions.push(inArray(sessions.groupId, patientGroupIdsForAccess));
      }

      whereConditions.push(or(...accessConditions)!);
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
        therapistId: sessions.therapistId,
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

        const isOwner = user.role === 'therapist'
          ? session.therapistId === user.dbUserId
          : true;
        const isReadOnly = user.role === 'therapist'
          ? session.therapistId !== user.dbUserId
            || (session.patientId ? !therapistPatientIds.includes(session.patientId) : false)
          : false;

        return {
          ...session,
          audioUrl,
          patient,
          isOwner,
          isReadOnly,
        };
      }),
    );

    return NextResponse.json({ sessions: enrichedSessions });
  } catch (error) {
    console.error('Error fetching recent sessions:', error);
    return handleAuthError(error);
  }
}
