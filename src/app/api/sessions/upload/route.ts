import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/libs/GCS';

// POST /api/sessions/upload - Upload audio file to GCS
// Note: Body parser is automatically disabled for FormData in App Router
export async function POST(request: NextRequest) {
  try {
    const contentLength = request.headers.get('content-length');
    const maxSize = 500 * 1024 * 1024; // 500MB

    // Check content length before parsing
    if (contentLength && parseInt(contentLength, 10) > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 500MB.' },
        { status: 413 },
      );
    }

    const formData = await request.formData();
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
    const buffer = Buffer.from(arrayBuffer);

    // Upload to GCS
    const { url, path } = await uploadFile(buffer, file.name, {
      folder: 'sessions/audio',
      contentType: file.type || 'audio/mpeg',
      makePublic: false,
    });

    return NextResponse.json({
      url,
      path,
      filename: file.name,
      size: file.size,
      contentType: file.type,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}
