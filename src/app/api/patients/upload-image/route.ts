import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { logPHICreate } from '@/libs/AuditLogger';
import { uploadFile } from '@/libs/GCS';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';
import { checkRateLimit, getClientIP, uploadRateLimit } from '@/utils/RateLimiter';

// POST /api/patients/upload-image - Upload reference image to GCS
// HIPAA COMPLIANCE: Requires authentication, rate limiting, and audit logging
// CRITICAL: This endpoint handles PHI (patient reference images)
export async function POST(request: NextRequest) {
  try {
    // 1. RATE LIMITING: Prevent upload abuse (20 uploads per hour for images)
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(`upload-image:${clientIP}`, uploadRateLimit);

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
    const maxSize = 10 * 1024 * 1024; // 10MB for images

    // Check content length before parsing
    if (contentLength && Number.parseInt(contentLength, 10) > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 413 },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type - images only
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ];

    if (!file.type.startsWith('image/') && !allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only image files are allowed (JPEG, PNG, WebP, GIF).' },
        { status: 400 },
      );
    }

    // Validate file size again
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 413 },
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = require('node:buffer').Buffer.from(arrayBuffer);

    // 4. UPLOAD TO GCS (PHI storage)
    const { url, path } = await uploadFile(buffer, file.name, {
      folder: 'patients/images',
      contentType: file.type || 'image/jpeg',
      makePublic: false, // HIPAA: Never make PHI files public
    });

    // 5. AUDIT LOG: Record PHI file upload
    await logPHICreate(user.dbUserId, 'media', path, request, {
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type,
      uploadType: 'patient_reference_image',
    });

    return NextResponse.json({
      url,
      path,
      filename: file.name,
      size: file.size,
      contentType: file.type,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return handleAuthError(error);
  }
}
