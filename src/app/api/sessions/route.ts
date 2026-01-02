import type { NextRequest } from 'next/server';
import { and, desc, eq, gte, inArray, isNull, lte, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { logPHIAccess } from '@/libs/AuditLogger';
import { db } from '@/libs/DB';
import { generatePresignedUrl } from '@/libs/GCS';
import { groupMembers, groups, sessions, users } from '@/models/Schema';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';

// GET /api/sessions - List all sessions for authenticated therapist
// HIPAA COMPLIANCE: Requires authentication and logs access
export async function GET(request: NextRequest) {
  try {
    // 1. AUTHENTICATE: Verify user is a therapist or admin
    const user = await requireTherapist(request);

    // 2. PARSE QUERY PARAMETERS
    const { searchParams } = new URL(request.url);
    const patientIdFilter = searchParams.get('patientId');
    const groupIdFilter = searchParams.get('groupId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 3. BUILD WHERE CONDITIONS
    const whereConditions = [];

    // Role-based access control
    if (user.role === 'org_admin' || user.role === 'super_admin') {
      whereConditions.push(isNull(sessions.deletedAt)); // Org/Super Admin sees all sessions
    } else {
      whereConditions.push(eq(sessions.therapistId, user.dbUserId)); // Therapist sees only their sessions
      whereConditions.push(isNull(sessions.deletedAt)); // Filter out soft-deleted sessions
    }

    // Optional patient filter - include both individual sessions AND group sessions where patient is a member
    let patientGroupIds: string[] = [];
    if (patientIdFilter) {
      // First, find all groups where this patient is an active member
      const patientGroups = await db
        .select({ groupId: groupMembers.groupId })
        .from(groupMembers)
        .where(
          and(
            eq(groupMembers.patientId, patientIdFilter),
            isNull(groupMembers.leftAt),
          ),
        );
      // Filter out null group IDs
      patientGroupIds = patientGroups.map(g => g.groupId).filter((id): id is string => id !== null);

      // Include both individual sessions for this patient AND group sessions they're a member of
      if (patientGroupIds.length > 0) {
        whereConditions.push(
          or(
            eq(sessions.patientId, patientIdFilter),
            inArray(sessions.groupId, patientGroupIds),
          )!,
        );
      } else {
        whereConditions.push(eq(sessions.patientId, patientIdFilter));
      }
    }

    // Optional group filter
    if (groupIdFilter) {
      whereConditions.push(eq(sessions.groupId, groupIdFilter));
    }

    // Optional date range filters
    if (startDate) {
      whereConditions.push(gte(sessions.sessionDate, startDate));
    }
    if (endDate) {
      whereConditions.push(lte(sessions.sessionDate, endDate));
    }

    // Only show sessions that have completed speaker setup
    whereConditions.push(eq(sessions.speakersSetupCompleted, true));

    // 4. FETCH: Get sessions with module data, group data, transcripts, and speakers
    let allSessions;
    try {
      console.log('=== FETCHING SESSIONS ===');
      console.log('User dbUserId:', user.dbUserId);
      console.log('Where conditions:', whereConditions.length);

      allSessions = await db.query.sessions.findMany({
        where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
        with: {
          patient: {
            columns: {
              id: true,
              name: true,
              avatarUrl: true,
              referenceImageUrl: true,
            },
          },
          group: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [desc(sessions.createdAt)],
      });

      console.log('=== SESSIONS FETCHED ===');
      console.log('Total sessions found:', allSessions.length);
    } catch (queryError) {
      console.error('=== SESSION QUERY ERROR ===');
      console.error('Error:', queryError);
      console.error('Error name:', (queryError as Error).name);
      console.error('Error message:', (queryError as Error).message);
      console.error('Error stack:', (queryError as Error).stack);
      throw queryError;
    }

    // 5. FETCH GROUP MEMBERS: For group sessions, get ALL members from group_members
    const groupIds = allSessions
      .filter(s => s.sessionType === 'group' && s.groupId)
      .map(s => s.groupId as string);

    // Create a map of groupId -> first patient (for backwards compatibility)
    const groupPatientMap = new Map<string, { id: string; name: string; avatarUrl: string | null; referenceImageUrl: string | null }>();
    // Create a map of groupId -> all members (for stacked avatars)
    const groupMembersMap = new Map<string, { id: string; name: string; avatarUrl: string | null }[]>();

    if (groupIds.length > 0) {
      // Fetch ALL group members with patient data for each group session
      const uniqueGroupIds = [...new Set(groupIds)];
      for (const groupId of uniqueGroupIds) {
        const members = await db
          .select({
            patientId: users.id,
            patientName: users.name,
            patientAvatarUrl: users.avatarUrl,
            patientReferenceImageUrl: users.referenceImageUrl,
          })
          .from(groupMembers)
          .innerJoin(users, eq(groupMembers.patientId, users.id))
          .where(
            and(
              eq(groupMembers.groupId, groupId),
              isNull(groupMembers.leftAt),
            ),
          );

        if (members.length > 0) {
          const firstMember = members[0];
          // Store all members for stacked avatars
          groupMembersMap.set(groupId, members.map(m => ({
            id: m.patientId,
            name: m.patientName,
            avatarUrl: m.patientAvatarUrl,
          })));

          // Store first patient for backwards compatibility
          if (firstMember) {
            groupPatientMap.set(groupId, {
              id: firstMember.patientId,
              name: firstMember.patientName,
              avatarUrl: firstMember.patientAvatarUrl,
              referenceImageUrl: firstMember.patientReferenceImageUrl,
            });
          }
        }
      }
    }

    // 6. FILTER: Show all sessions (allow users to complete wizard for incomplete ones)
    // Previously filtered to only show sessions with completed speaker assignments
    // Now showing all sessions so users can see and complete any pending work
    const completeSessions = allSessions;

    // 7. TRANSFORM: Format sessions to match expected structure
    const sessionsList = completeSessions.map((session) => {
      // Handle Drizzle's relation type (can be single object or array)
      let patientData = Array.isArray(session.patient) ? session.patient[0] : session.patient;
      const group = Array.isArray(session.group) ? session.group[0] : session.group;

      // For group sessions without direct patient, use the patient from groupPatientMap
      if (!patientData && session.groupId) {
        const groupPatient = groupPatientMap.get(session.groupId);
        if (groupPatient) {
          patientData = groupPatient;
        }
      }

      // Normalize patient object to only include needed fields
      const patient = patientData ? {
        id: patientData.id,
        name: patientData.name,
        avatarUrl: patientData.avatarUrl || null,
        referenceImageUrl: patientData.referenceImageUrl || null,
      } : null;

      return {
        id: session.id,
        title: session.title,
        sessionDate: session.sessionDate,
        sessionType: session.sessionType,
        audioUrl: session.audioUrl,
        audioDurationSeconds: session.audioDurationSeconds,
        transcriptionStatus: session.transcriptionStatus,
        patientId: patient?.id || session.patientId,
        groupId: session.groupId,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        patient,
        group: group ? {
          id: group.id,
          name: group.name,
          members: session.groupId ? groupMembersMap.get(session.groupId) || [] : [],
        } : null,
      };
    });

    // 8. GENERATE PRESIGNED URLS: HIPAA compliant (1-hour expiration)
    const sessionsWithSignedUrls = await Promise.all(
      sessionsList.map(async (session) => {
        const patient = session.patient as { id: string; name: string; avatarUrl: string | null; referenceImageUrl: string | null } | null;
        const group = session.group as { id: string; name: string; members: { id: string; name: string; avatarUrl: string | null }[] } | null;

        const [signedAudioUrl, signedAvatarUrl, signedReferenceImageUrl] = await Promise.all([
          session.audioUrl ? generatePresignedUrl(session.audioUrl, 1) : null,
          patient?.avatarUrl ? generatePresignedUrl(patient.avatarUrl, 1) : null,
          patient?.referenceImageUrl ? generatePresignedUrl(patient.referenceImageUrl, 1) : null,
        ]);

        // Generate presigned URLs for group member avatars
        let groupWithSignedUrls = group;
        if (group && group.members && group.members.length > 0) {
          const membersWithSignedUrls = await Promise.all(
            group.members.map(async member => ({
              ...member,
              avatarUrl: member.avatarUrl ? await generatePresignedUrl(member.avatarUrl, 1) : null,
            })),
          );
          groupWithSignedUrls = { ...group, members: membersWithSignedUrls };
        }

        return {
          ...session,
          audioUrl: signedAudioUrl || session.audioUrl,
          patient: patient ? {
            ...patient,
            avatarUrl: signedAvatarUrl || patient.avatarUrl,
            referenceImageUrl: signedReferenceImageUrl || patient.referenceImageUrl,
          } : null,
          group: groupWithSignedUrls,
        };
      }),
    );

    // 9. AUDIT LOG: Record PHI access
    await logPHIAccess(user.dbUserId, 'session', 'list', request);

    return NextResponse.json({ sessions: sessionsWithSignedUrls });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return handleAuthError(error);
  }
}

// POST /api/sessions - Create a new session
// HIPAA COMPLIANCE: Requires authentication and logs session creation
export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATE: Verify user is a therapist or admin
    const user = await requireTherapist(request);

    // 2. VALIDATE INPUT
    const body = await request.json();
    const {
      title,
      sessionDate,
      sessionType: explicitSessionType,
      patientIds,
      groupId: explicitGroupId,
      audioUrl,
    } = body;

    // Validate required fields
    if (!title || !sessionDate || !audioUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: title, sessionDate, audioUrl' },
        { status: 400 },
      );
    }

    // Determine session type (explicit or auto-computed)
    const sessionType = explicitSessionType || (
      patientIds && Array.isArray(patientIds) && patientIds.length > 1
        ? 'group'
        : 'individual'
    );

    // Validate session-specific requirements
    if (sessionType === 'individual') {
      if (!patientIds || !Array.isArray(patientIds) || patientIds.length === 0) {
        return NextResponse.json(
          { error: 'Individual session requires at least one patient' },
          { status: 400 },
        );
      }
    } else if (sessionType === 'group') {
      if (!explicitGroupId && (!patientIds || !Array.isArray(patientIds) || patientIds.length === 0)) {
        return NextResponse.json(
          { error: 'Group session requires either a groupId or multiple patientIds' },
          { status: 400 },
        );
      }
    }

    // 3. AUTHORIZATION CHECK: Verify therapist can create for these patients
    if (user.role === 'therapist') {
      // Verify all patients are assigned to this therapist
      for (const patientId of patientIds) {
        const patient = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.id, patientId),
        });

        if (!patient) {
          return NextResponse.json(
            { error: `Patient not found: ${patientId}` },
            { status: 404 },
          );
        }

        if (patient.therapistId !== user.dbUserId) {
          return NextResponse.json(
            { error: 'Forbidden: You can only create sessions for your assigned patients' },
            { status: 403 },
          );
        }
      }
    }

    // 4. CREATE SESSION (with optional group creation for multiple patients)
    let groupId: string | null = explicitGroupId || null;

    if (sessionType === 'group' && !explicitGroupId && patientIds && patientIds.length > 0) {
      // Auto-create a temporary group for this session (only if no explicit groupId)
      const groupName = `Session - ${title} (${new Date(sessionDate).toLocaleDateString()})`;

      const groupResult = await db
        .insert(groups)
        .values({
          name: groupName,
          description: `Auto-generated group for session: ${title}`,
          organizationId: user.organizationId || '',
          therapistId: user.dbUserId || user.uid,
        })
        .returning();

      const newGroup = groupResult[0];
      groupId = newGroup?.id || null;

      if (!groupId) {
        return NextResponse.json(
          { error: 'Failed to create group for session' },
          { status: 500 },
        );
      }

      // Add all patients as group members
      await db.insert(groupMembers).values(
        patientIds.map((patientId: string) => ({
          groupId,
          patientId,
        })),
      );
    }

    // Create the session
    const sessionResult = await db
      .insert(sessions)
      .values({
        therapistId: user.dbUserId,
        patientId: sessionType === 'individual' ? patientIds[0] : null,
        groupId: sessionType === 'group' ? groupId : null,
        title,
        sessionDate: new Date(sessionDate).toISOString().split('T')[0],
        sessionType,
        audioUrl,
        transcriptionStatus: 'pending',
      } as any)
      .returning();

    const newSession = Array.isArray(sessionResult) && sessionResult.length > 0 ? sessionResult[0] : null;

    if (!newSession) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 },
      );
    }

    // 5. AUDIT LOG: Record session creation
    await logPHIAccess(user.dbUserId, 'session', newSession.id, request);

    return NextResponse.json({ session: newSession }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return handleAuthError(error);
  }
}
