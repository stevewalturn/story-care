/**
 * Video Processing Job by ID
 * Get job status and details
 */

import { db } from '@/libs/DB';
import { videoProcessingJobs } from '@/models/Schema';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/video-jobs/[id]
 * Get video processing job status
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const [job] = await db
      .select()
      .from(videoProcessingJobs)
      .where(eq(videoProcessingJobs.id, id))
      .limit(1);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error: any) {
    console.error('Error fetching video job:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch video job',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/video-jobs/[id]
 * Cancel a pending/processing job (if possible)
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const [job] = await db
      .select()
      .from(videoProcessingJobs)
      .where(eq(videoProcessingJobs.id, id))
      .limit(1);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Only allow canceling pending jobs
    if (job.status !== 'pending') {
      return NextResponse.json(
        {
          error: 'Can only cancel pending jobs',
          currentStatus: job.status,
        },
        { status: 400 }
      );
    }

    // Mark as failed (cancelled)
    await db
      .update(videoProcessingJobs)
      .set({
        status: 'failed',
        errorMessage: 'Job cancelled by user',
        completedAt: new Date(),
      })
      .where(eq(videoProcessingJobs.id, id));

    return NextResponse.json({
      message: 'Job cancelled successfully',
      jobId: id,
    });
  } catch (error: any) {
    console.error('Error cancelling video job:', error);
    return NextResponse.json(
      {
        error: 'Failed to cancel video job',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
