import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { verifyIdToken } from '@/libs/FirebaseAdmin';
import { VideoTranscodingService } from '@/services/VideoTranscodingService';
import { videoTranscodingJobs } from '@/models/Schema';
import { eq } from 'drizzle-orm';

// Configure runtime for consistent behavior
export const runtime = 'nodejs';

/**
 * GET /api/video/transcode/[jobId]
 * Get status of transcoding job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } },
) {
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

    const { jobId } = params;

    // Get job from database
    const [job] = await db
      .select()
      .from(videoTranscodingJobs)
      .where(eq(videoTranscodingJobs.id, jobId))
      .limit(1);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check authorization - user must own the job
    if (job.userId !== user.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If job is still pending or running, check Cloud Run status
    if (job.status === 'pending' || job.status === 'running') {
      console.log('[TRANSCODE] Checking Cloud Run job status:', job.executionName);

      try {
        const cloudRunStatus = await VideoTranscodingService.getJobStatus(
          job.executionName!,
        );

        // Map Cloud Run status to our database status
        let dbStatus: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' = 'pending';
        if (cloudRunStatus.status === 'SUCCEEDED') {
          dbStatus = 'completed';
        } else if (cloudRunStatus.status === 'FAILED') {
          dbStatus = 'failed';
        } else if (cloudRunStatus.status === 'RUNNING') {
          dbStatus = 'running';
        }

        // Update job in database if status changed
        if (dbStatus !== job.status) {
          await db
            .update(videoTranscodingJobs)
            .set({
              status: dbStatus,
              completedAt: dbStatus === 'completed' || dbStatus === 'failed' ? new Date() : undefined,
              errorMessage: cloudRunStatus.error || null,
              outputGcsPath: dbStatus === 'completed'
                ? `gs://transcoded-${process.env.GCS_PROJECT_ID}/${job.outputFilename}`
                : undefined,
              updatedAt: new Date(),
            })
            .where(eq(videoTranscodingJobs.id, jobId));

          job.status = dbStatus;
          job.errorMessage = cloudRunStatus.error || null;
        }
      } catch (error: any) {
        console.error('[ERROR] Failed to get Cloud Run status:', error);
        // Don't fail the request, just return database status
      }
    }

    // Get signed URL if completed
    let downloadUrl: string | undefined;
    if (job.status === 'completed' && job.outputFilename) {
      try {
        downloadUrl = await VideoTranscodingService.getTranscodedVideoUrl(
          job.outputFilename,
        );
      } catch (error) {
        console.error('[ERROR] Failed to get signed URL:', error);
      }
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      inputFilename: job.inputFilename,
      outputFilename: job.outputFilename,
      format: job.format,
      quality: job.quality,
      width: job.width,
      height: job.height,
      fps: job.fps,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      errorMessage: job.errorMessage,
      downloadUrl,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    });
  } catch (error: any) {
    console.error('[ERROR] Get job status failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get job status' },
      { status: 500 },
    );
  }
}
