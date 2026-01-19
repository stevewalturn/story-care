import type { AudioChunk } from '@/models/Schema';
import type { NextRequest } from 'next/server';
import { Storage } from '@google-cloud/storage';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { logPHIUpdate } from '@/libs/AuditLogger';
import { db } from '@/libs/DB';
import { uploadedRecordings } from '@/models/Schema';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';

// Route segment config
export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  credentials: {
    client_email: process.env.GCS_CLIENT_EMAIL,
    private_key: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

const bucketName = process.env.GCS_BUCKET_NAME || 'storycare-uploads';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/recordings/[id]/chunks - Request upload URL or confirm chunk upload
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireTherapist(request);
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const isConfirm = searchParams.get('confirm') === 'true';

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

    const body = await request.json();

    if (isConfirm) {
      // CONFIRM: Update the recording with the new chunk info
      const { chunkIndex, gcsPath, durationSeconds, sizeBytes, isFinal } = body;

      // Get current chunks
      const currentChunks = (recording.audioChunks as AudioChunk[]) || [];

      // Add new chunk
      const newChunk: AudioChunk = {
        chunkIndex,
        gcsPath,
        durationSeconds: durationSeconds || 0,
        sizeBytes: sizeBytes || 0,
        uploadedAt: new Date().toISOString(),
      };

      const updatedChunks = [...currentChunks, newChunk];

      // Calculate totals
      const totalDuration = updatedChunks.reduce((sum, chunk) => sum + chunk.durationSeconds, 0);
      const totalSize = updatedChunks.reduce((sum, chunk) => sum + chunk.sizeBytes, 0);

      // Update recording
      await db
        .update(uploadedRecordings)
        .set({
          audioChunks: updatedChunks,
          totalDurationSeconds: totalDuration,
          totalFileSizeBytes: totalSize,
          status: isFinal ? 'uploading' : 'recording',
          updatedAt: new Date(),
        })
        .where(eq(uploadedRecordings.id, id));

      return NextResponse.json({
        success: true,
        chunkIndex,
        totalChunks: updatedChunks.length,
        totalDurationSeconds: totalDuration,
      });
    } else {
      // REQUEST: Generate signed upload URL
      const { chunkIndex, mimeType, extension } = body;

      // Validate
      if (chunkIndex === undefined || !mimeType) {
        return NextResponse.json(
          { error: 'chunkIndex and mimeType are required' },
          { status: 400 },
        );
      }

      // Generate GCS path for this chunk
      const gcsPath = `recordings/${id}/chunk-${chunkIndex}.${extension || 'webm'}`;

      // Generate signed upload URL (15 minutes)
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(gcsPath);

      const [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: mimeType,
      });

      await logPHIUpdate(user.dbUserId, 'recording', id, request, { action: 'chunk_upload_url' });

      return NextResponse.json({
        uploadUrl: signedUrl,
        gcsPath,
        expiresIn: 900,
      });
    }
  } catch (error) {
    console.error('Error handling chunk:', error);
    return handleAuthError(error);
  }
}

// GET /api/recordings/[id]/chunks - List chunks for a recording
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireTherapist(request); // Auth check only, user not needed
    const { id } = await context.params;

    // Fetch recording
    const [recording] = await db
      .select({
        id: uploadedRecordings.id,
        audioChunks: uploadedRecordings.audioChunks,
        totalDurationSeconds: uploadedRecordings.totalDurationSeconds,
        totalFileSizeBytes: uploadedRecordings.totalFileSizeBytes,
      })
      .from(uploadedRecordings)
      .where(eq(uploadedRecordings.id, id))
      .limit(1);

    if (!recording) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }

    return NextResponse.json({
      chunks: recording.audioChunks || [],
      totalDurationSeconds: recording.totalDurationSeconds,
      totalFileSizeBytes: recording.totalFileSizeBytes,
    });
  } catch (error) {
    console.error('Error listing chunks:', error);
    return handleAuthError(error);
  }
}
