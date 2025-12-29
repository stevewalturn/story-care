import type { NextRequest } from 'next/server';
import { Storage } from '@google-cloud/storage';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { requireTherapist } from '@/utils/AuthHelpers';
import { checkRateLimit, getClientIP, uploadRateLimit } from '@/utils/RateLimiter';

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

/**
 * POST /api/sessions/upload-url
 * Generate a signed URL for direct upload to Google Cloud Storage
 * This bypasses Cloud Run's 32MB request limit
 */
export async function POST(request: NextRequest) {
  try {
    // 1. RATE LIMITING
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(`upload-url:${clientIP}`, uploadRateLimit);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
        },
        { status: 429 },
      );
    }

    // 2. AUTHENTICATION: Require therapist role
    const user = await requireTherapist(request);

    // 3. PARSE REQUEST BODY
    const body = await request.json();
    const { fileName, fileType, fileSize } = body;

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: 'fileName and fileType are required' },
        { status: 400 },
      );
    }

    // 4. VALIDATE FILE SIZE (500MB limit)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (fileSize && fileSize > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 500MB.' },
        { status: 413 },
      );
    }

    // 5. VALIDATE FILE TYPE (audio files only)
    const allowedTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/x-wav',
      'audio/mp4',
      'audio/m4a',
      'audio/webm',
      'audio/ogg',
    ];

    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only audio files are allowed.' },
        { status: 400 },
      );
    }

    // 6. GENERATE UNIQUE FILE PATH
    const fileId = uuidv4();
    const ext = fileName.split('.').pop();
    const gcsPath = `sessions/${user.uid}/${fileId}.${ext}`;

    // 7. GENERATE SIGNED URL (valid for 15 minutes)
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(gcsPath);

    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: fileType,
    });

    // 8. RETURN SIGNED URL
    return NextResponse.json({
      uploadUrl: signedUrl,
      fileId,
      gcsPath,
      expiresIn: 900, // 15 minutes in seconds
    });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate upload URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
