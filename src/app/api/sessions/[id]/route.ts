import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { logPHIAccess, logPHIDelete, logPHIUpdate } from '@/libs/AuditLogger';
import { db } from '@/libs/DB';
import { generatePresignedUrl } from '@/libs/GCS';
import { handleRBACError, requireSessionAccess } from '@/middleware/RBACMiddleware';
import { groupMembers, groups, sessionModules, sessions, treatmentModules, users } from '@/models/Schema';
import { handleAuthError } from '@/utils/AuthHelpers';

// GET /api/sessions/[id] - Get single session
// HIPAA COMPLIANCE: Requires authentication, RBAC, and logs access
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // 1. AUTHENTICATION & AUTHORIZATION: Verify user has access to this session
    const user = await requireSessionAccess(request, id);

    // 2. FETCH SESSION WITH ASSIGNED MODULE
    const [session] = await db
      .select({
        id: sessions.id,
        title: sessions.title,
        sessionDate: sessions.sessionDate,
        sessionType: sessions.sessionType,
        audioUrl: sessions.audioUrl,
        audioDurationSeconds: sessions.audioDurationSeconds,
        transcriptionStatus: sessions.transcriptionStatus,
        createdAt: sessions.createdAt,
        updatedAt: sessions.updatedAt,
        therapistId: sessions.therapistId,
        patientId: sessions.patientId,
        groupId: sessions.groupId,
        // Include assigned module information
        moduleId: sessionModules.moduleId,
        moduleName: treatmentModules.name,
        moduleDomain: treatmentModules.domain,
      })
      .from(sessions)
      .leftJoin(sessionModules, eq(sessions.id, sessionModules.sessionId))
      .leftJoin(treatmentModules, eq(sessionModules.moduleId, treatmentModules.id))
      .where(eq(sessions.id, id))
      .limit(1);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 },
      );
    }

    // Update lastOpenedAt timestamp when session is viewed
    await db
      .update(sessions)
      .set({ lastOpenedAt: new Date() })
      .where(eq(sessions.id, id));

    // Fetch patient info if individual session
    if (session.patientId) {
      const [patient] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(eq(users.id, session.patientId))
        .limit(1);

      // Generate presigned URLs (HIPAA compliant, 1-hour expiration)
      const [signedAudioUrl, signedAvatarUrl] = await Promise.all([
        session.audioUrl ? generatePresignedUrl(session.audioUrl, 1) : null,
        patient?.avatarUrl ? generatePresignedUrl(patient.avatarUrl, 1) : null,
      ]);

      // 3. AUDIT LOG: Record PHI access
      await logPHIAccess(user.dbUserId, 'session', id, request);

      return NextResponse.json({
        session: {
          ...session,
          audioUrl: signedAudioUrl || session.audioUrl,
          patient: patient ? {
            ...patient,
            avatarUrl: signedAvatarUrl || patient.avatarUrl,
          } : null,
        },
      });
    }

    // Fetch group info if group session
    if (session.groupId) {
      const [group] = await db
        .select({
          id: groups.id,
          name: groups.name,
        })
        .from(groups)
        .where(eq(groups.id, session.groupId))
        .limit(1);

      // Fetch group members
      const members = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl,
        })
        .from(groupMembers)
        .innerJoin(users, eq(groupMembers.patientId, users.id))
        .where(eq(groupMembers.groupId, session.groupId));

      // Generate presigned URLs (HIPAA compliant, 1-hour expiration)
      const signedAudioUrl = session.audioUrl ? await generatePresignedUrl(session.audioUrl, 1) : null;

      const membersWithSignedUrls = await Promise.all(
        members.map(async (member) => {
          const signedAvatarUrl = member.avatarUrl ? await generatePresignedUrl(member.avatarUrl, 1) : null;
          return {
            ...member,
            avatarUrl: signedAvatarUrl || member.avatarUrl,
          };
        }),
      );

      // 3. AUDIT LOG: Record PHI access
      await logPHIAccess(user.dbUserId, 'session', id, request);

      return NextResponse.json({
        session: {
          ...session,
          audioUrl: signedAudioUrl || session.audioUrl,
          group: {
            ...group,
            members: membersWithSignedUrls,
          },
        },
      });
    }

    // Generate presigned URL for audio if no patient or group
    const signedAudioUrl = session.audioUrl ? await generatePresignedUrl(session.audioUrl, 1) : null;

    // 3. AUDIT LOG: Record PHI access
    await logPHIAccess(user.dbUserId, 'session', id, request);

    return NextResponse.json({
      session: {
        ...session,
        audioUrl: signedAudioUrl || session.audioUrl,
      },
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return handleRBACError(error);
    }
    return handleAuthError(error);
  }
}

// PUT /api/sessions/[id] - Update session
// HIPAA COMPLIANCE: Requires authentication, RBAC, and logs updates
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // 1. AUTHENTICATION & AUTHORIZATION: Verify user has access to this session
    const user = await requireSessionAccess(request, id);

    // 2. VALIDATE INPUT
    const body = await request.json();
    const { title, sessionDate, audioUrl, audioDurationSeconds, transcriptionStatus } = body;

    // Get current session for audit log
    const [currentSession] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1);

    if (!currentSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 },
      );
    }

    // 3. UPDATE SESSION - only set fields that were provided
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title;
    if (sessionDate !== undefined) updateData.sessionDate = sessionDate;
    if (audioUrl !== undefined) updateData.audioUrl = audioUrl;
    if (audioDurationSeconds !== undefined) updateData.audioDurationSeconds = audioDurationSeconds;
    if (transcriptionStatus !== undefined) updateData.transcriptionStatus = transcriptionStatus;

    const [updatedSession] = await db
      .update(sessions)
      .set(updateData)
      .where(eq(sessions.id, id))
      .returning();

    if (!updatedSession) {
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 },
      );
    }

    // 4. AUDIT LOG: Record PHI update with changes
    await logPHIUpdate(user.dbUserId, 'session', id, request, {
      changedFields: Object.keys(body),
      oldValues: {
        title: currentSession.title,
        sessionDate: currentSession.sessionDate,
        transcriptionStatus: currentSession.transcriptionStatus,
      },
      newValues: {
        title,
        sessionDate,
        transcriptionStatus,
      },
    });

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error('Error updating session:', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return handleRBACError(error);
    }
    return handleAuthError(error);
  }
}

// DELETE /api/sessions/[id] - Soft delete session
// HIPAA COMPLIANCE: Soft delete with audit logging
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // 1. AUTHENTICATION & AUTHORIZATION: Verify user has access to this session
    const user = await requireSessionAccess(request, id);

    // 2. CHECK IF SESSION EXISTS
    const [existingSession] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1);

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 },
      );
    }

    // 3. SOFT DELETE: Mark as deleted instead of hard delete (HIPAA compliance)
    const [deletedSession] = await db
      .update(sessions)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, id))
      .returning();

    if (!deletedSession) {
      return NextResponse.json(
        { error: 'Failed to delete session' },
        { status: 500 },
      );
    }

    // 4. AUDIT LOG: Record PHI deletion
    await logPHIDelete(user.dbUserId, 'session', id, request, {
      softDelete: true,
      sessionTitle: existingSession.title,
      sessionType: existingSession.sessionType,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return handleRBACError(error);
    }
    return handleAuthError(error);
  }
}
