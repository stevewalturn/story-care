/**
 * Frame Extraction Tasks API
 * Query in-progress frame extraction jobs from video_processing_jobs table
 */

import type { NextRequest } from 'next/server';
import { and, desc, eq, gte, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { mediaLibrary, videoProcessingJobs } from '@/models/Schema';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';

/**
 * GET /api/ai/frame-extraction-tasks
 * List frame extraction jobs (video_processing_jobs with jobType='extract_frame')
 * filtered by session
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const statusParam = searchParams.get('status'); // e.g., 'pending,processing'

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 },
      );
    }

    // Build filters for video_processing_jobs
    const filters = [];

    // Filter by job type = extract_frame
    filters.push(eq(videoProcessingJobs.jobType, 'extract_frame'));

    // Filter by status if provided, default to pending and processing
    if (statusParam) {
      const statuses = statusParam.split(',');
      filters.push(inArray(videoProcessingJobs.status, statuses as any));
    } else {
      // Default to pending and processing
      filters.push(inArray(videoProcessingJobs.status, ['pending', 'processing']));
    }

    // Filter out tasks older than 1 hour to avoid stale data
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    filters.push(gte(videoProcessingJobs.createdAt, oneHourAgo));

    // Fetch processing frame extraction jobs
    const jobs = await db
      .select({
        id: videoProcessingJobs.id,
        jobType: videoProcessingJobs.jobType,
        status: videoProcessingJobs.status,
        progress: videoProcessingJobs.progress,
        currentStep: videoProcessingJobs.currentStep,
        inputData: videoProcessingJobs.inputData,
        createdAt: videoProcessingJobs.createdAt,
        startedAt: videoProcessingJobs.startedAt,
        mediaId: videoProcessingJobs.mediaId,
      })
      .from(videoProcessingJobs)
      .where(and(...filters))
      .orderBy(desc(videoProcessingJobs.createdAt));

    // Filter jobs by sessionId (stored in inputData.sessionId)
    // and enrich with source media title
    const tasksPromises = jobs
      .filter((job) => {
        const inputData = job.inputData as any;
        return inputData?.sessionId === sessionId;
      })
      .map(async (job) => {
        const inputData = job.inputData as any;
        let title = 'Extracting frame';

        // Get source video title if available
        if (inputData?.mediaId) {
          const [sourceMedia] = await db
            .select({ title: mediaLibrary.title })
            .from(mediaLibrary)
            .where(eq(mediaLibrary.id, inputData.mediaId))
            .limit(1);

          if (sourceMedia?.title) {
            title = `Extracting frame from "${sourceMedia.title}"`;
          }
        }

        return {
          id: job.id,
          title,
          status: job.status,
          progress: job.progress || 0,
          currentStep: job.currentStep || 'Initializing',
          createdAt: job.createdAt,
          mediaId: inputData?.mediaId,
        };
      });

    const tasks = await Promise.all(tasksPromises);

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error('[Frame Extraction Tasks API] Error fetching tasks:', error);
    return handleAuthError(error);
  }
}
