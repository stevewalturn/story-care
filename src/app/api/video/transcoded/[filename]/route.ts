import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { verifyIdToken } from '@/libs/FirebaseAdmin';
import { VideoTranscodingService } from '@/services/VideoTranscodingService';

// Configure runtime for consistent behavior
export const runtime = 'nodejs';

/**
 * GET /api/video/transcoded/[filename]
 * Get signed URL for transcoded video
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    // Authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    try {
      await verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { filename } = await params;

    // Validate filename (basic security check)
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 },
      );
    }

    // Get signed URL from GCS
    console.log('[TRANSCODE] Getting signed URL for:', filename);
    const url = await VideoTranscodingService.getTranscodedVideoUrl(filename);

    return NextResponse.json({
      filename,
      url,
      expiresIn: 3600, // 1 hour
    });
  } catch (error: any) {
    console.error('[ERROR] Get transcoded video URL failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get transcoded video URL' },
      { status: 500 },
    );
  }
}
