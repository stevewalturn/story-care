import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
// import { arcjet, uploadRateLimit } from '@/libs/Arcjet';
import { verifyIdToken } from '@/libs/FirebaseAdmin';
import { uploadFile } from '@/libs/GCS';

// Configure runtime for consistent behavior
export const runtime = 'nodejs';

/**
 * POST /api/media/upload
 * Upload media files (images, videos, audio) to GCS for patient media library
 */
export async function POST(request: NextRequest) {
  try {
    // Clone request to avoid body lock issues in Next.js 16 dev mode
    const clonedRequest = request.clone();

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
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 },
      );
    }

    // Rate limiting - 20 uploads per hour
    // TODO: Re-enable Arcjet rate limiting when Arcjet.ts is available
    // const aj = await arcjet
    //   .withRule(uploadRateLimit)
    //   .protect(request, { userId: user.uid });

    // if (aj.denied) {
    //   return NextResponse.json(
    //     { error: 'Too many upload requests. Please try again later.' },
    //     { status: 429 },
    //   );
    // }

    // Parse multipart form data
    // Let browser set Content-Type automatically - DO NOT manually set Content-Type header
    // Note: In Next.js 16, we need to ensure request body is only read once
    // Use the cloned request to avoid "body already used" errors
    let formData: FormData;
    try {
      formData = await clonedRequest.formData();
    } catch (formDataError) {
      console.error('[ERROR] Failed to parse form data:', formDataError);
      return NextResponse.json(
        { error: 'Failed to parse upload data' },
        { status: 400 },
      );
    }
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 },
      );
    }

    // Validate file type and size
    const contentType = file.type;
    const fileSize = file.size;

    // Additional validation
    if (!contentType || !fileSize) {
      return NextResponse.json(
        { error: 'Invalid file data' },
        { status: 400 },
      );
    }

    // Define allowed types
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const videoTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
    const audioTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/aac', 'audio/ogg', 'audio/webm'];

    const allAllowedTypes = [...imageTypes, ...videoTypes, ...audioTypes];

    if (!allAllowedTypes.includes(contentType)) {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${contentType}. Supported types: images (JPG, PNG, GIF, WebP), videos (MP4, MOV, WebM), audio (MP3, WAV, AAC, OGG)`,
        },
        { status: 400 },
      );
    }

    // Determine media type
    let mediaType: 'image' | 'video' | 'audio';
    if (imageTypes.includes(contentType)) {
      mediaType = 'image';
    } else if (videoTypes.includes(contentType)) {
      mediaType = 'video';
    } else {
      mediaType = 'audio';
    }

    // Enforce size limits
    const maxSizes = {
      image: 50 * 1024 * 1024, // 50MB
      video: 500 * 1024 * 1024, // 500MB
      audio: 50 * 1024 * 1024, // 50MB
    };

    if (fileSize > maxSizes[mediaType]) {
      const maxSizeMB = maxSizes[mediaType] / (1024 * 1024);
      return NextResponse.json(
        {
          error: `File too large. Maximum size for ${mediaType} files is ${maxSizeMB}MB`,
        },
        { status: 400 },
      );
    }

    // Convert file to buffer
    let buffer: Buffer;
    try {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } catch (bufferError) {
      console.error('[ERROR] Failed to convert file to buffer:', bufferError);
      return NextResponse.json(
        { error: 'Failed to process file' },
        { status: 500 },
      );
    }

    // Generate filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-z0-9.-]/gi, '_');
    const filename = `${timestamp}-${sanitizedName}`;

    // Upload to GCS
    let uploadResult;
    try {
      uploadResult = await uploadFile(buffer, filename, {
        folder: 'media/uploaded',
        contentType,
        makePublic: false, // HIPAA compliance - use signed URLs
      });
    } catch (uploadError) {
      console.error('[ERROR] GCS upload failed:', uploadError);
      return NextResponse.json(
        {
          error: 'Failed to upload file to storage',
          details: uploadError instanceof Error ? uploadError.message : 'Unknown error',
        },
        { status: 500 },
      );
    }

    // Log upload for audit
    console.log('[AUDIT] Media file uploaded:', {
      userId: user.uid,
      filename,
      mediaType,
      size: fileSize,
      path: uploadResult.path,
      timestamp: new Date().toISOString(),
    });

    // Return upload result
    // IMPORTANT: Clients should save 'path' to database, not 'url'
    // - 'url': Temporary presigned URL (expires in 1 hour) for immediate display
    // - 'path': Permanent GCS path to save in database
    return NextResponse.json({
      success: true,
      url: uploadResult.url, // Temporary presigned URL for immediate display
      path: uploadResult.path, // SAVE THIS to database (permanent GCS path)
      filename: file.name,
      size: fileSize,
      contentType,
      mediaType,
    });
  } catch (error) {
    console.error('[ERROR] Media upload failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
