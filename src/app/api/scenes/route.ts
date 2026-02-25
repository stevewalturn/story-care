import type { NextRequest } from 'next/server';
import { and, desc, eq, ilike, inArray, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getClientInfo, logAudit } from '@/libs/AuditLogger';
import { db } from '@/libs/DB';
import { verifyIdToken } from '@/libs/FirebaseAdmin';
import { generatePresignedUrl } from '@/libs/GCS';
import { mediaLibrary, sceneClips, scenes, sessions, usersSchema, videoProcessingJobs } from '@/models/Schema';
import { getTherapistPatientIds, handleAuthError, requireAuth, verifyTherapistPatientAccess } from '@/utils/AuthHelpers';

// GET /api/scenes - List scenes
export async function GET(request: NextRequest) {
  try {
    // HIPAA: Require authentication
    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const search = searchParams.get('search');

    let query = db
      .select({
        id: scenes.id,
        title: scenes.title,
        description: scenes.description,
        patientId: scenes.patientId,
        patientName: usersSchema.name,
        createdByTherapistId: scenes.createdByTherapistId,
        assembledVideoUrl: scenes.assembledVideoUrl,
        thumbnailUrl: scenes.thumbnailUrl,
        durationSeconds: scenes.durationSeconds,
        status: scenes.status,
        createdAt: scenes.createdAt,
        updatedAt: scenes.updatedAt,
      })
      .from(scenes)
      .leftJoin(usersSchema, eq(scenes.patientId, usersSchema.id));

    // Build filters
    const filters = [];

    // Role-based access control (HIPAA compliance)
    if (user.role === 'therapist') {
      // Therapists see: scenes for their assigned patients + scenes they created (even if patient reassigned)
      const therapistPatientIds = await getTherapistPatientIds(user.dbUserId);

      const accessConditions = [
        eq(scenes.createdByTherapistId, user.dbUserId), // Scenes I created
      ];
      if (therapistPatientIds.length > 0) {
        accessConditions.push(inArray(scenes.patientId, therapistPatientIds)); // Scenes for my assigned patients
      }
      filters.push(or(...accessConditions)!);
    } else if (user.role === 'patient') {
      // Patients can only see their own scenes
      filters.push(eq(scenes.patientId, user.dbUserId));
    } else if (user.role === 'org_admin') {
      // Org admins can see scenes created by therapists in their organization
      const therapistsInOrg = db
        .select({ id: usersSchema.id })
        .from(usersSchema)
        .where(and(
          eq(usersSchema.organizationId, user.organizationId!),
          eq(usersSchema.role, 'therapist'),
        ));
      filters.push(inArray(scenes.createdByTherapistId, therapistsInOrg));
    }
    // Super admin: no filter (sees all)

    if (patientId) {
      // HIPAA: Verify user has access to this patient before filtering
      const accessCheck = await verifyTherapistPatientAccess(user, patientId);
      if (!accessCheck.hasAccess) {
        return NextResponse.json(
          { error: accessCheck.error },
          { status: 403 },
        );
      }
      filters.push(eq(scenes.patientId, patientId));
    }
    if (search) {
      filters.push(ilike(scenes.title, `%${search}%`));
    }

    if (filters.length > 0) {
      query = query.where(and(...filters)) as any;
    }

    const scenesList = await query.orderBy(desc(scenes.updatedAt));

    // Generate presigned URLs and populate thumbnails from first clip
    const scenesWithSignedUrls = await Promise.all(
      scenesList.map(async (scene) => {
        // Generate presigned URL for assembled video
        const assembledVideoUrl = scene.assembledVideoUrl
          ? await generatePresignedUrl(scene.assembledVideoUrl, 1)
          : null;

        // Get first clip's thumbnail if scene has no thumbnail
        let thumbnailUrl = scene.thumbnailUrl;

        if (!thumbnailUrl) {
          // Query first clip's media for this scene
          const [firstClip] = await db
            .select({
              media: mediaLibrary,
            })
            .from(sceneClips)
            .leftJoin(mediaLibrary, eq(sceneClips.mediaId, mediaLibrary.id))
            .where(eq(sceneClips.sceneId, scene.id))
            .orderBy(sceneClips.sequenceNumber)
            .limit(1);

          if (firstClip?.media) {
            // Use first clip's thumbnail or mediaUrl as fallback
            thumbnailUrl = firstClip.media.thumbnailUrl || firstClip.media.mediaUrl;
          }
        }

        // Generate presigned URL for thumbnail
        const signedThumbnailUrl = thumbnailUrl
          ? await generatePresignedUrl(thumbnailUrl, 1)
          : null;

        // Get latest job data for processing scenes
        let job = null;
        if (scene.status === 'processing') {
          const [latestJob] = await db
            .select({
              id: videoProcessingJobs.id,
              status: videoProcessingJobs.status,
              progress: videoProcessingJobs.progress,
              currentStep: videoProcessingJobs.currentStep,
              cloudRunJobId: videoProcessingJobs.cloudRunJobId,
            })
            .from(videoProcessingJobs)
            .where(eq(videoProcessingJobs.sceneId, scene.id))
            .orderBy(desc(videoProcessingJobs.createdAt))
            .limit(1);

          job = latestJob || null;
        }

        return {
          ...scene,
          assembledVideoUrl,
          thumbnailUrl: signedThumbnailUrl,
          job,
        };
      }),
    );

    // HIPAA: Log PHI access
    await logAudit({
      userId: user.dbUserId,
      action: 'read',
      resourceType: 'scene',
      resourceId: 'list',
      ...getClientInfo(request),
      metadata: { count: scenesWithSignedUrls.length, patientId },
    });

    return NextResponse.json({ scenes: scenesWithSignedUrls });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return handleAuthError(error);
    }
    console.error('Error fetching scenes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scenes' },
      { status: 500 },
    );
  }
}

// POST /api/scenes - Create scene
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7);
    let user;
    try {
      user = await verifyIdToken(token);
    } catch {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      patientId,
      sessionId,
      title,
      description,
      loopAudio,
      loopScenes,
      sceneData: _sceneData,
      focusInstruction: _focusInstruction,
      keyQuote: _keyQuote,
      therapeuticRationale: _therapeuticRationale,
      forPatient: _forPatient,
    } = body;

    // Validate required fields - either patientId or sessionId must be provided
    if (!patientId && !sessionId) {
      return NextResponse.json(
        { error: 'Missing required field: patientId or sessionId' },
        { status: 400 },
      );
    }

    // Convert Firebase UID to database UUID
    const [therapist] = await db
      .select({ id: usersSchema.id })
      .from(usersSchema)
      .where(eq(usersSchema.firebaseUid, user.uid))
      .limit(1);

    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 },
      );
    }

    // Determine patient ID
    let finalPatientId = patientId;

    // If sessionId is provided, fetch the session to get patientId
    if (sessionId && !finalPatientId) {
      const [session] = await db
        .select({ patientId: sessions.patientId })
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1);

      if (!session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 },
        );
      }

      finalPatientId = session.patientId;
    }

    // Validate we have a patient ID
    if (!finalPatientId) {
      return NextResponse.json(
        { error: 'Unable to determine patient ID' },
        { status: 400 },
      );
    }

    // HIPAA: Verify therapist has access to this patient
    // Fetch therapist's full info for access check
    const [therapistInfo] = await db
      .select({
        organizationId: usersSchema.organizationId,
        role: usersSchema.role,
        name: usersSchema.name,
        email: usersSchema.email,
        status: usersSchema.status,
      })
      .from(usersSchema)
      .where(eq(usersSchema.id, therapist.id))
      .limit(1);

    if (therapistInfo) {
      const accessCheck = await verifyTherapistPatientAccess(
        {
          uid: user.uid,
          dbUserId: therapist.id,
          name: therapistInfo.name || '',
          organizationId: therapistInfo.organizationId,
          email: therapistInfo.email,
          emailVerified: true,
          role: therapistInfo.role as 'therapist',
          status: therapistInfo.status as 'active',
          avatarUrl: null,
        },
        finalPatientId,
      );

      if (!accessCheck.hasAccess) {
        return NextResponse.json(
          { error: accessCheck.error },
          { status: 403 },
        );
      }
    }

    // Insert new scene
    const [newScene] = await db
      .insert(scenes)
      .values({
        patientId: finalPatientId,
        createdByTherapistId: therapist.id,
        title: title || 'Untitled Scene',
        description: description || null,
        status: 'draft',
        durationSeconds: '0',
        loopAudio: loopAudio ?? true, // Default to true if not provided
        loopScenes: loopScenes ?? false, // Default to false if not provided
      })
      .returning();

    return NextResponse.json({ scene: newScene }, { status: 201 });
  } catch (error) {
    console.error('Error creating scene:', error);
    return NextResponse.json(
      { error: 'Failed to create scene' },
      { status: 500 },
    );
  }
}
