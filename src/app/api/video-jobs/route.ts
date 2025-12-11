/**
 * Video Processing Jobs API
 * Manages async video assembly jobs processed on Cloud Run
 */

import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { videoProcessingJobs } from '@/models/Schema';
import { and, desc, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/video-jobs
 * List all video processing jobs for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sceneId = searchParams.get('sceneId');
    const status = searchParams.get('status');
    const limit = Number.parseInt(searchParams.get('limit') || '50', 10);

    // Build query with filters
    const filters = [];
    if (sceneId) {
      filters.push(eq(videoProcessingJobs.sceneId, sceneId));
    }
    if (status) {
      filters.push(eq(videoProcessingJobs.status, status as any));
    }

    const query = db
      .select()
      .from(videoProcessingJobs)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(videoProcessingJobs.createdAt))
      .limit(limit);

    const jobs = await query;

    return NextResponse.json({
      jobs,
      total: jobs.length,
    });
  } catch (error: any) {
    console.error('Error fetching video jobs:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch video jobs',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/video-jobs
 * Create and trigger a new video processing job
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sceneId, jobType, inputData } = body;

    // Validate required fields
    if (!sceneId || !jobType || !inputData) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['sceneId', 'jobType', 'inputData'],
        },
        { status: 400 }
      );
    }

    // Create job in database
    const jobResult = await db
      .insert(videoProcessingJobs)
      .values({
        sceneId,
        jobType,
        status: 'pending',
        progress: 0,
        inputData,
        currentStep: 'Initializing',
      })
      .returning();

    const job = jobResult[0];
    if (!job) {
      return NextResponse.json(
        { error: 'Failed to create video processing job' },
        { status: 500 },
      );
    }

    // Trigger Cloud Run service
    const videoProcessorUrl = Env.VIDEO_PROCESSOR_URL || 'http://localhost:8080';
    const webhookSecret = Env.WEBHOOK_SECRET || 'your-webhook-secret';
    const webhookUrl = `${Env.NEXT_PUBLIC_APP_URL}/api/video-jobs/${job.id}/webhook`;

    console.log(`🎬 Triggering video job ${job.id} on Cloud Run...`);

    try {
      const response = await fetch(`${videoProcessorUrl}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${webhookSecret}`,
        },
        body: JSON.stringify({
          jobId: job.id,
          sceneId,
          inputData,
          webhookUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(`Cloud Run service returned ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Job ${job.id} accepted by Cloud Run:`, result);

      // Update job with Cloud Run execution ID
      await db
        .update(videoProcessingJobs)
        .set({
          status: 'processing',
          cloudRunJobId: result.executionId || null,
          startedAt: new Date(),
        })
        .where(eq(videoProcessingJobs.id, job.id));
    } catch (error: any) {
      console.error(`❌ Failed to trigger Cloud Run for job ${job.id}:`, error);

      // Mark job as failed
      await db
        .update(videoProcessingJobs)
        .set({
          status: 'failed',
          errorMessage: `Failed to trigger Cloud Run: ${error.message}`,
        })
        .where(eq(videoProcessingJobs.id, job.id));

      return NextResponse.json(
        {
          error: 'Failed to trigger video processing',
          jobId: job.id,
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        job,
        message: 'Video processing job created and triggered',
      },
      { status: 202 }
    );
  } catch (error: any) {
    console.error('Error creating video job:', error);
    return NextResponse.json(
      {
        error: 'Failed to create video job',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
