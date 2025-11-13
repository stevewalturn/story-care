import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
// import { arcjet, uploadRateLimit } from '@/libs/Arcjet';
import { verifyIdToken } from '@/libs/FirebaseAdmin';
import { uploadFile } from '@/libs/GCS';

/**
 * POST /api/media/upload
 * Upload media files (images, videos, audio) to GCS for patient media library
 */
export async function POST(request: NextRequest) {
  try {
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
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 },
      );
    }

    // Validate file type and size
    const contentType = file.type;
    const fileSize = file.size;

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
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-z0-9.-]/gi, '_');
    const filename = `${timestamp}-${sanitizedName}`;

    // Upload to GCS
    const uploadResult = await uploadFile(buffer, filename, {
      folder: 'media/uploaded',
      contentType,
      makePublic: false, // HIPAA compliance - use signed URLs
    });

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
