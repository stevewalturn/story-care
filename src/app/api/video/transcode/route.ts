import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { verifyIdToken } from '@/libs/FirebaseAdmin';
import { VideoTranscodingService } from '@/services/VideoTranscodingService';
import { videoTranscodingJobs } from '@/models/Schema';

// Configure runtime for consistent behavior
export const runtime = 'nodejs';

/**
 * POST /api/video/transcode
 * Upload video and start GPU-accelerated transcoding job
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let user;
    try {
      user = await verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Parse multipart form data
    const clonedRequest = request.clone();
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
    const format = (formData.get('format') as string) || 'h264';
    const quality = (formData.get('quality') as string) || 'high';
    const widthStr = formData.get('width') as string | null;
    const heightStr = formData.get('height') as string | null;
    const fpsStr = formData.get('fps') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only video files are supported.' },
        { status: 400 },
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filenames
    const timestamp = Date.now();
    const inputFilename = `input-${timestamp}-${file.name}`;
    const outputFilename = `output-${timestamp}-${file.name}`;

    // Upload to preprocessing bucket
    console.log('[TRANSCODE] Uploading video to preprocessing bucket:', inputFilename);
    await VideoTranscodingService.uploadForTranscoding(buffer, inputFilename);

    // Start transcoding job
    console.log('[TRANSCODE] Starting GPU transcoding job');
    const job = await VideoTranscodingService.startTranscodingJob({
      inputPath: inputFilename,
      outputFilename,
      format: format as any,
      quality: quality as any,
      width: widthStr ? parseInt(widthStr) : undefined,
      height: heightStr ? parseInt(heightStr) : undefined,
      fps: fpsStr ? parseInt(fpsStr) : undefined,
    });

    // Save job to database
    const [dbJob] = await db
      .insert(videoTranscodingJobs)
      .values({
        userId: user.uid,
        organizationId: user.organizationId || '', // TODO: Get from user context
        executionName: job.executionName,
        status: 'pending',
        inputFilename,
        outputFilename,
        inputGcsPath: `gs://preprocessing-${process.env.GCS_PROJECT_ID}/${inputFilename}`,
        format: format as any,
        quality: quality as any,
        width: widthStr ? parseInt(widthStr) : null,
        height: heightStr ? parseInt(heightStr) : null,
        fps: fpsStr ? parseInt(fpsStr) : null,
        inputFileSizeBytes: buffer.length,
      })
      .returning();

    if (!dbJob) {
      throw new Error('Failed to create job in database');
    }

    console.log('[TRANSCODE] Job created in database:', dbJob.id);

    return NextResponse.json({
      jobId: dbJob.id,
      executionName: job.executionName,
      status: job.status,
      message: 'Transcoding job started successfully',
    });
  } catch (error: any) {
    console.error('[ERROR] Transcoding upload failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start transcoding job' },
      { status: 500 },
    );
  }
}
