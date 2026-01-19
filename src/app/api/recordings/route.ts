import type { NextRequest } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { logPHIAccess, logPHICreate } from '@/libs/AuditLogger';
import { db } from '@/libs/DB';
import { generatePresignedUrl } from '@/libs/GCS';
import { recordingLinks, uploadedRecordings } from '@/models/Schema';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';

// GET /api/recordings - List all recordings for authenticated therapist
export async function GET(request: NextRequest) {
  try {
    const user = await requireTherapist(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const source = searchParams.get('source');

    // Build where conditions
    const whereConditions = [
      eq(uploadedRecordings.therapistId, user.dbUserId),
    ];

    // Filter by status if provided
    if (status && ['recording', 'uploading', 'completed', 'failed', 'used'].includes(status)) {
      whereConditions.push(eq(uploadedRecordings.status, status as any));
    }

    // Filter by source if provided
    if (source && ['direct', 'share_link'].includes(source)) {
      whereConditions.push(eq(uploadedRecordings.source, source as any));
    }

    // Fetch recordings
    const recordings = await db
      .select({
        id: uploadedRecordings.id,
        source: uploadedRecordings.source,
        recordingLinkId: uploadedRecordings.recordingLinkId,
        title: uploadedRecordings.title,
        recordedAt: uploadedRecordings.recordedAt,
        audioChunks: uploadedRecordings.audioChunks,
        finalAudioUrl: uploadedRecordings.finalAudioUrl,
        totalDurationSeconds: uploadedRecordings.totalDurationSeconds,
        totalFileSizeBytes: uploadedRecordings.totalFileSizeBytes,
        status: uploadedRecordings.status,
        sessionId: uploadedRecordings.sessionId,
        deviceInfo: uploadedRecordings.deviceInfo,
        createdAt: uploadedRecordings.createdAt,
        updatedAt: uploadedRecordings.updatedAt,
      })
      .from(uploadedRecordings)
      .where(and(...whereConditions))
      .orderBy(desc(uploadedRecordings.createdAt));

    // Generate presigned URLs for audio
    const recordingsWithUrls = await Promise.all(
      recordings.map(async (recording) => {
        const audioUrl = recording.finalAudioUrl
          ? await generatePresignedUrl(recording.finalAudioUrl, 1)
          : null;

        return {
          ...recording,
          audioUrl,
        };
      }),
    );

    await logPHIAccess(user.dbUserId, 'recording', 'list', request);

    return NextResponse.json({ recordings: recordingsWithUrls });
  } catch (error) {
    console.error('Error fetching recordings:', error);
    return handleAuthError(error);
  }
}

// POST /api/recordings - Create a new recording entry
export async function POST(request: NextRequest) {
  try {
    const user = await requireTherapist(request);

    const body = await request.json();
    const {
      source = 'direct',
      recordingLinkId,
      title,
      deviceInfo,
    } = body;

    // Validate source
    if (!['direct', 'share_link'].includes(source)) {
      return NextResponse.json(
        { error: 'Invalid source. Must be "direct" or "share_link"' },
        { status: 400 },
      );
    }

    // If share_link source, verify the link exists and belongs to this user
    if (source === 'share_link' && recordingLinkId) {
      const link = await db
        .select()
        .from(recordingLinks)
        .where(eq(recordingLinks.id, recordingLinkId))
        .limit(1);

      if (!link[0] || link[0].therapistId !== user.dbUserId) {
        return NextResponse.json(
          { error: 'Recording link not found' },
          { status: 404 },
        );
      }
    }

    // Create recording entry
    const [recording] = await db
      .insert(uploadedRecordings)
      .values({
        source: source as any,
        recordingLinkId: recordingLinkId || null,
        therapistId: user.dbUserId,
        organizationId: user.organizationId || '',
        title: title || `Recording ${new Date().toLocaleString()}`,
        recordedAt: new Date(),
        status: 'recording',
        deviceInfo: deviceInfo || null,
        audioChunks: [],
      })
      .returning();

    if (!recording) {
      return NextResponse.json({ error: 'Failed to create recording' }, { status: 500 });
    }

    await logPHICreate(user.dbUserId, 'recording', recording.id, request);

    return NextResponse.json({ recordingId: recording.id }, { status: 201 });
  } catch (error) {
    console.error('Error creating recording:', error);
    return handleAuthError(error);
  }
}
