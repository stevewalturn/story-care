import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { logPHICreate } from '@/libs/AuditLogger';
import { getSignedUrl } from '@/libs/GCS';
import { requireTherapist } from '@/utils/AuthHelpers';

// Route segment config
export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

/**
 * POST /api/sessions/upload-confirm
 * Confirm that a file was successfully uploaded to GCS via signed URL
 * Log the upload for audit compliance
 */
export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATION: Require therapist role
    const user = await requireTherapist(request);

    // 2. PARSE REQUEST BODY
    const body = await request.json();
    const { fileId, gcsPath, fileName, fileSize, sessionId } = body;

    if (!fileId || !gcsPath || !fileName) {
      return NextResponse.json(
        { error: 'fileId, gcsPath, and fileName are required' },
        { status: 400 },
      );
    }

    // 3. AUDIT LOGGING: Record PHI upload
    await logPHICreate(
      user.uid,
      'session',
      fileId,
      request,
      {
        fileName,
        fileSize,
        gcsPath,
        sessionId,
        uploadMethod: 'signed_url',
      },
    );

    // 4. GENERATE PRESIGNED URL: For preview/playback (1 hour expiration)
    const url = await getSignedUrl(gcsPath, 1);

    // 5. RETURN SUCCESS with presigned URL
    return NextResponse.json({
      success: true,
      fileId,
      gcsPath,
      url, // Presigned URL for preview (expires in 1 hour)
      message: 'Upload confirmed and logged',
    });
  } catch (error) {
    console.error('Error confirming upload:', error);
    return NextResponse.json(
      {
        error: 'Failed to confirm upload',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
