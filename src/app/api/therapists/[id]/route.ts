/**
 * Therapist Detail API
 * Get detailed information about a specific therapist
 * HIPAA Compliant: Requires authentication and enforces organization boundaries
 */

import type { NextRequest } from 'next/server';
import { and, count, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { auditLogs, mediaLibrary, sessions, storyPages, users } from '@/models/Schema';
import { handleAuthError, requireAdmin } from '@/utils/AuthHelpers';

/**
 * GET /api/therapists/[id] - Get detailed therapist information
 *
 * Access Control:
 * - Org admins: Can only view therapists in their organization
 * - Super admins: Can view therapists across all organizations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // HIPAA: Require org admin or super admin
    const authUser = await requireAdmin(request);
    const { id } = await params;

    // Fetch therapist
    const therapist = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, id),
    });

    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 },
      );
    }

    // Ensure therapist is actually a therapist role
    if (therapist.role !== 'therapist') {
      return NextResponse.json(
        { error: 'User is not a therapist' },
        { status: 400 },
      );
    }

    // Organization boundary enforcement
    if (authUser.role === 'org_admin') {
      // Org admins can only view therapists in their organization
      if (therapist.organizationId !== authUser.organizationId) {
        return NextResponse.json(
          { error: 'Forbidden: Cannot access therapists outside your organization' },
          { status: 403 },
        );
      }
    }

    // Fetch organization details
    let organization = null;
    if (therapist.organizationId) {
      organization = await db.query.organizations.findFirst({
        where: (orgs, { eq }) => eq(orgs.id, therapist.organizationId!),
      });
    }

    // Calculate metrics
    // 1. Total patients assigned to this therapist
    const totalPatientsResult = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.role, 'patient'),
          eq(users.therapistId, therapist.id),
        ),
      );
    const totalPatients = Number(totalPatientsResult[0]?.count || 0);

    // 2. Total sessions created by this therapist
    const totalSessionsResult = await db
      .select({ count: count() })
      .from(sessions)
      .where(eq(sessions.therapistId, therapist.id));
    const totalSessions = Number(totalSessionsResult[0]?.count || 0);

    // 3. Active sessions (sessions created in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeSessionsResult = await db
      .select({ count: count() })
      .from(sessions)
      .where(
        and(
          eq(sessions.therapistId, therapist.id),
        ),
      );
    const activeSessions = Number(activeSessionsResult[0]?.count || 0);

    // 4. Story pages created
    const storyPagesCreatedResult = await db
      .select({ count: count() })
      .from(storyPages)
      .where(eq(storyPages.createdByTherapistId, therapist.id));
    const storyPagesCreated = Number(storyPagesCreatedResult[0]?.count || 0);

    // 5. Media generated
    const mediaGeneratedResult = await db
      .select({ count: count() })
      .from(mediaLibrary)
      .where(eq(mediaLibrary.createdByTherapistId, therapist.id));
    const mediaGenerated = Number(mediaGeneratedResult[0]?.count || 0);

    // Fetch recent patients (top 10)
    const recentPatients = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        status: users.status,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .where(
        and(
          eq(users.role, 'patient'),
          eq(users.therapistId, therapist.id),
        ),
      )
      .orderBy(desc(users.createdAt))
      .limit(10);

    // Get session count for each recent patient
    const recentPatientsWithSessionCount = await Promise.all(
      recentPatients.map(async (patient) => {
        const sessionCountResult = await db
          .select({ count: count() })
          .from(sessions)
          .where(
            and(
              eq(sessions.patientId, patient.id),
              eq(sessions.therapistId, therapist.id),
            ),
          );

        // Get last session date
        const lastSession = await db.query.sessions.findFirst({
          where: (sessions, { and, eq }) =>
            and(
              eq(sessions.patientId, patient.id),
              eq(sessions.therapistId, therapist.id),
            ),
          orderBy: (sessions, { desc }) => [desc(sessions.sessionDate)],
        });

        return {
          ...patient,
          sessionCount: Number(sessionCountResult[0]?.count || 0),
          lastSessionDate: lastSession?.sessionDate || null,
        };
      }),
    );

    // Fetch recent sessions (top 10)
    const recentSessions = await db
      .select({
        id: sessions.id,
        title: sessions.title,
        sessionDate: sessions.sessionDate,
        sessionType: sessions.sessionType,
        patientId: sessions.patientId,
        transcriptionStatus: sessions.transcriptionStatus,
        audioDurationSeconds: sessions.audioDurationSeconds,
        createdAt: sessions.createdAt,
      })
      .from(sessions)
      .where(eq(sessions.therapistId, therapist.id))
      .orderBy(desc(sessions.sessionDate))
      .limit(10);

    // Get patient name for each session
    const recentSessionsWithPatient = await Promise.all(
      recentSessions.map(async (session) => {
        if (!session.patientId) {
          return { ...session, patientName: 'Group Session' };
        }

        const patient = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.id, session.patientId!),
        });

        return {
          ...session,
          patientName: patient?.name || 'Unknown Patient',
        };
      }),
    );

    // Fetch activity log (recent 50 entries)
    const activityLog = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        resourceType: auditLogs.resourceType,
        resourceId: auditLogs.resourceId,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        timestamp: auditLogs.timestamp,
        metadata: auditLogs.metadata,
      })
      .from(auditLogs)
      .where(eq(auditLogs.userId, therapist.id))
      .orderBy(desc(auditLogs.timestamp))
      .limit(50);

    // Determine last activity date
    const lastActivityDate = activityLog[0]?.timestamp || therapist.lastLoginAt || therapist.createdAt;

    return NextResponse.json({
      therapist: {
        id: therapist.id,
        name: therapist.name,
        email: therapist.email,
        status: therapist.status,
        role: therapist.role,
        organizationId: therapist.organizationId,
        licenseNumber: therapist.licenseNumber,
        specialty: therapist.specialty,
        avatarUrl: therapist.avatarUrl,
        firebaseUid: therapist.firebaseUid,
        createdAt: therapist.createdAt,
        updatedAt: therapist.updatedAt,
        lastLoginAt: therapist.lastLoginAt,
      },
      organization: organization
        ? {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
          }
        : null,
      metrics: {
        totalPatients,
        activeSessions,
        totalSessions,
        storyPagesCreated,
        mediaGenerated,
        lastActivityDate,
      },
      recentPatients: recentPatientsWithSessionCount,
      recentSessions: recentSessionsWithPatient,
      activityLog,
    });
  } catch (error) {
    console.error('Failed to fetch therapist details:', error);
    return handleAuthError(error);
  }
}
