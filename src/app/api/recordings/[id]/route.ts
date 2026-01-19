import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { logPHIAccess, logPHIDelete } from '@/libs/AuditLogger';
import { db } from '@/libs/DB';
import { generatePresignedUrl } from '@/libs/GCS';
import { uploadedRecordings } from '@/models/Schema';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/recordings/[id] - Get recording details
export async function GET(request: NextRequest, context: RouteContext) {
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
    if (recording.therapistId !== user.dbUserId && user.role !== 'super_admin' && user.role !== 'org_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generate presigned URL if audio exists
    const audioUrl = recording.finalAudioUrl
      ? await generatePresignedUrl(recording.finalAudioUrl, 1)
      : null;

    await logPHIAccess(user.dbUserId, 'recording', id, request);

    return NextResponse.json({
      recording: {
        ...recording,
        audioUrl,
      },
    });
  } catch (error) {
    console.error('Error fetching recording:', error);
    return handleAuthError(error);
  }
}

// DELETE /api/recordings/[id] - Delete recording
export async function DELETE(request: NextRequest, context: RouteContext) {
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
    if (recording.therapistId !== user.dbUserId && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Don't allow deletion if recording is already used for a session
    if (recording.status === 'used' && recording.sessionId) {
      return NextResponse.json(
        { error: 'Cannot delete recording that has been used to create a session' },
        { status: 400 },
      );
    }

    // Delete recording (hard delete for now - TODO: consider soft delete for HIPAA)
    await db
      .delete(uploadedRecordings)
      .where(eq(uploadedRecordings.id, id));

    await logPHIDelete(user.dbUserId, 'recording', id, request, { action: 'delete' });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting recording:', error);
    return handleAuthError(error);
  }
}
