import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { logPHICreate } from '@/libs/AuditLogger';
import { db } from '@/libs/DB';
import { groupMembers, groups, recordingLinks, sessions, uploadedRecordings } from '@/models/Schema';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/recordings/[id]/create-session - Create a session from a recording
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireTherapist(request);
    const { id } = await context.params;

    // Fetch recording
    const [recording] = await db
      .select()
      .from(uploadedRecordings)
      .where(eq(uploadedRecordings.id, id))
      .limit(1);

    if (!recording) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }

    // Verify ownership
    if (recording.therapistId !== user.dbUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify recording is completed
    if (recording.status !== 'completed') {
      return NextResponse.json(
        { error: 'Recording must be completed before creating a session' },
        { status: 400 },
      );
    }

    // Check if already used (sessionId indicates it's been used)
    if (recording.sessionId) {
      return NextResponse.json(
        { error: 'Recording has already been used to create a session', sessionId: recording.sessionId },
        { status: 400 },
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      title,
      sessionDate,
      patientIds = [],
      groupId: explicitGroupId,
    } = body;

    // Try to get pre-filled data from recording link if available
    let linkData: { sessionTitle: string | null; sessionDate: Date | null; patientIds: string[] | null } | null = null;
    if (recording.recordingLinkId) {
      const [link] = await db
        .select()
        .from(recordingLinks)
        .where(eq(recordingLinks.id, recording.recordingLinkId))
        .limit(1);

      if (link) {
        linkData = {
          sessionTitle: link.sessionTitle,
          sessionDate: link.sessionDate,
          patientIds: link.patientIds,
        };
      }
    }

    // Use provided values or fall back to link data
    const finalTitle = title || linkData?.sessionTitle || recording.title || 'Session from Recording';
    const finalSessionDate = sessionDate || linkData?.sessionDate || recording.recordedAt || new Date();
    const finalPatientIds = patientIds.length > 0 ? patientIds : (linkData?.patientIds || []);

    // Validate required fields
    if (!finalTitle || finalPatientIds.length === 0) {
      return NextResponse.json(
        { error: 'Title and at least one patient are required' },
        { status: 400 },
      );
    }

    // Determine session type
    const sessionType = finalPatientIds.length > 1 ? 'group' : 'individual';

    // Handle group creation if needed
    let groupId: string | null = explicitGroupId || null;

    if (sessionType === 'group' && !explicitGroupId && finalPatientIds.length > 1) {
      // Auto-create a temporary group
      const groupName = `Session - ${finalTitle} (${new Date(finalSessionDate).toLocaleDateString()})`;

      const [newGroup] = await db
        .insert(groups)
        .values({
          name: groupName,
          description: `Auto-generated group for session: ${finalTitle}`,
          organizationId: user.organizationId || '',
          therapistId: user.dbUserId,
        })
        .returning();

      groupId = newGroup?.id || null;

      if (groupId) {
        // Add all patients as group members
        await db.insert(groupMembers).values(
          finalPatientIds.map((patientId: string) => ({
            groupId,
            patientId,
          })),
        );
      }
    }

    // Get the audio URL from the recording
    const audioUrl = recording.finalAudioUrl || `recordings/${id}/`;

    // Create the session
    const [newSession] = await db
      .insert(sessions)
      .values({
        therapistId: user.dbUserId,
        patientId: sessionType === 'individual' ? finalPatientIds[0] : null,
        groupId: sessionType === 'group' ? groupId : null,
        title: finalTitle,
        sessionDate: new Date(finalSessionDate).toISOString().split('T')[0],
        sessionType,
        audioUrl,
        audioDurationSeconds: recording.totalDurationSeconds,
        audioFileSizeBytes: recording.totalFileSizeBytes,
        transcriptionStatus: 'pending',
      } as any)
      .returning();

    if (!newSession) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    // Mark recording as used
    await db
      .update(uploadedRecordings)
      .set({
        status: 'used',
        sessionId: newSession.id,
        updatedAt: new Date(),
      })
      .where(eq(uploadedRecordings.id, id));

    await logPHICreate(user.dbUserId, 'session', newSession.id, request, { action: 'create_from_recording' });

    return NextResponse.json({
      success: true,
      sessionId: newSession.id,
      session: newSession,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating session from recording:', error);
    return handleAuthError(error);
  }
}
