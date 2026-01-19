import type { AudioChunk } from '@/models/Schema';
import type { NextRequest } from 'next/server';
import { Storage } from '@google-cloud/storage';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { recordingLinks, uploadedRecordings } from '@/models/Schema';

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
  params: Promise<{ token: string }>;
};

// POST /api/record/[token]/chunk - Upload a chunk (public, token + recordingId validated)
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    const { searchParams } = new URL(request.url);
    const isConfirm = searchParams.get('confirm') === 'true';

    // Fetch and validate link
    const [link] = await db
      .select()
      .from(recordingLinks)
      .where(eq(recordingLinks.token, token))
      .limit(1);

    if (!link) {
      return NextResponse.json({ error: 'Recording link not found' }, { status: 404 });
    }

    // Check link is active
    if (link.status !== 'recording' && link.status !== 'pending') {
      return NextResponse.json(
        { error: 'Recording link is not active' },
        { status: 410 },
      );
    }

    // Check expiration
    if (link.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Recording link has expired' }, { status: 410 });
    }

    const body = await request.json();
    const { recordingId } = body;

    // Fetch recording
    const [recording] = await db
      .select()
      .from(uploadedRecordings)
      .where(eq(uploadedRecordings.id, recordingId))
      .limit(1);

    if (!recording) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }

    // Verify recording belongs to this link
    if (recording.recordingLinkId !== link.id) {
      return NextResponse.json({ error: 'Recording does not belong to this link' }, { status: 403 });
    }

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
        .where(eq(uploadedRecordings.id, recordingId));

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
      const gcsPath = `recordings/${recordingId}/chunk-${chunkIndex}.${extension || 'webm'}`;

      // Generate signed upload URL (15 minutes)
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(gcsPath);

      const [signedUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        contentType: mimeType,
      });

      return NextResponse.json({
        uploadUrl: signedUrl,
        gcsPath,
        expiresIn: 900,
      });
    }
  } catch (error) {
    console.error('Error handling chunk:', error);
    return NextResponse.json(
      { error: 'Failed to handle chunk' },
      { status: 500 },
    );
  }
}
