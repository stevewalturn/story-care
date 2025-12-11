/**
 * Video Processing Job Webhook Endpoint
 * Receives status updates from Cloud Run video processor
 */

import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { scenes, videoProcessingJobs } from '@/models/Schema';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/video-jobs/[id]/webhook
 * Receive status update from Cloud Run video processor
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Verify webhook secret
    const authHeader = request.headers.get('Authorization');
    const webhookSecret = Env.WEBHOOK_SECRET || 'your-webhook-secret';

    if (!authHeader || authHeader !== `Bearer ${webhookSecret}`) {
      console.warn(`⚠️ Unauthorized webhook attempt for job ${id}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, progress, currentStep, outputUrl, thumbnailUrl, errorMessage } = body;

    console.log(`📬 Webhook received for job ${id}:`, {
      status,
      progress,
      currentStep,
    });

    // Validate job exists
    const [job] = await db
      .select()
      .from(videoProcessingJobs)
      .where(eq(videoProcessingJobs.id, id))
      .limit(1);

    if (!job) {
      console.error(`❌ Job ${id} not found`);
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Update job status
    const updateData: any = {
      status,
      progress,
      currentStep,
      updatedAt: new Date(),
    };

    if (status === 'processing' && !job.startedAt) {
      updateData.startedAt = new Date();
    }

    if (status === 'completed') {
      updateData.completedAt = new Date();
      updateData.outputUrl = outputUrl;
      updateData.thumbnailUrl = thumbnailUrl;
      updateData.progress = 100;
    }

    if (status === 'failed') {
      updateData.completedAt = new Date();
      updateData.errorMessage = errorMessage || 'Unknown error';
    }

    // Calculate duration if completed
    if ((status === 'completed' || status === 'failed') && job.startedAt) {
      const duration = Math.floor(
        (new Date().getTime() - new Date(job.startedAt).getTime()) / 1000
      );
      updateData.durationSeconds = duration;
    }

    await db.update(videoProcessingJobs).set(updateData).where(eq(videoProcessingJobs.id, id));

    // Update scene if job completed successfully
    if (status === 'completed' && job.sceneId && outputUrl) {
      console.log(`✅ Updating scene ${job.sceneId} with assembled video`);

      await db
        .update(scenes)
        .set({
          assembledVideoUrl: outputUrl,
          thumbnailUrl: thumbnailUrl || undefined,
          status: 'completed',
          updatedAt: new Date(),
        })
        .where(eq(scenes.id, job.sceneId));
    }

    // Update scene if job failed
    if (status === 'failed' && job.sceneId) {
      console.error(`❌ Scene ${job.sceneId} assembly failed:`, errorMessage);

      await db
        .update(scenes)
        .set({
          status: 'failed',
          processingError: errorMessage || 'Video assembly failed',
          updatedAt: new Date(),
        })
        .where(eq(scenes.id, job.sceneId));
    }

    console.log(`✅ Job ${id} updated:`, { status, progress, currentStep });

    return NextResponse.json({
      success: true,
      jobId: id,
      status,
    });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      {
        error: 'Failed to process webhook',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
