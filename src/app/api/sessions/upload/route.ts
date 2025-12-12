import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { logPHICreate } from '@/libs/AuditLogger';
import { uploadFile } from '@/libs/GCS';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';
import { checkRateLimit, getClientIP, uploadRateLimit } from '@/utils/RateLimiter';

// Route segment config for Cloud Run compatibility
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for large file uploads

// POST /api/sessions/upload - Upload audio file to GCS
// HIPAA COMPLIANCE: Requires authentication, rate limiting, and audit logging
// CRITICAL: This endpoint handles PHI (patient audio recordings)
export async function POST(request: NextRequest) {
  try {
    // 1. RATE LIMITING: Prevent upload abuse (10 uploads per hour)
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(`upload:${clientIP}`, uploadRateLimit);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too many upload attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
        },
        { status: 429 },
      );
    }

    // 2. AUTHENTICATION: Verify user is a therapist or admin
    const user = await requireTherapist(request);

    // 3. VALIDATE FILE SIZE
    const contentLength = request.headers.get('content-length');
    const maxSize = 500 * 1024 * 1024; // 500MB

    // Check content length before parsing
    if (contentLength && Number.parseInt(contentLength, 10) > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 500MB.' },
        { status: 413 },
      );
    }

    // Parse FormData - wrap in try-catch for better error messages
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (formDataError) {
      console.error('FormData parsing error:', formDataError);
      return NextResponse.json(
        {
          error: 'Failed to parse upload data',
          details: formDataError instanceof Error ? formDataError.message : 'Unknown error',
        },
        { status: 400 },
      );
    }

    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type - be more lenient with audio types
    const allowedTypes = [
      'audio/mpeg',
      'audio/wav',
      'audio/mp3',
      'audio/m4a',
      'audio/mp4',
      'audio/x-m4a',
      'audio/webm',
      'audio/ogg',
    ];

    if (!file.type.startsWith('audio/') && !allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only audio files are allowed.' },
        { status: 400 },
      );
    }

    // Validate file size again
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 500MB.' },
        { status: 413 },
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = require('node:buffer').Buffer.from(arrayBuffer);

    // 4. UPLOAD TO GCS (PHI storage)
    const { url, path } = await uploadFile(buffer, file.name, {
      folder: 'sessions/audio',
      contentType: file.type || 'audio/mpeg',
      makePublic: false, // HIPAA: Never make PHI files public
    });

    // 5. AUDIT LOG: Record PHI file upload
    await logPHICreate(user.dbUserId, 'media', path, request, {
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type,
      uploadType: 'session_audio',
    });

    // IMPORTANT: Clients should save 'path' to database (sessions.audioUrl), not 'url'
    // - 'url': Temporary presigned URL (expires in 1 hour) for immediate display
    // - 'path': Permanent GCS path to save in database
    return NextResponse.json({
      url, // Temporary presigned URL for immediate display
      path, // SAVE THIS to database (permanent GCS path)
      filename: file.name,
      size: file.size,
      contentType: file.type,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return handleAuthError(error);
  }
}
