/**
 * Video Tasks API
 * Query in-progress video generation tasks from the media library
 */

import type { NextRequest } from 'next/server';
import { and, desc, eq, gte, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { mediaLibrary } from '@/models/Schema';
import { VideoTaskService } from '@/services/VideoTaskService';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';

/**
 * GET /api/ai/video-tasks
 * List video generation tasks (media items with status 'processing') filtered by patient/session
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const sessionId = searchParams.get('sessionId');
    const statusParam = searchParams.get('status'); // e.g., 'processing' or 'processing,pending'

    if (!patientId && !sessionId) {
      return NextResponse.json(
        { error: 'Either patientId or sessionId is required' },
        { status: 400 },
      );
    }

    // Build filters
    const filters = [];

    // Filter by media type = video
    filters.push(eq(mediaLibrary.mediaType, 'video'));

    if (patientId) {
      filters.push(eq(mediaLibrary.patientId, patientId));
    }

    if (sessionId) {
      filters.push(eq(mediaLibrary.sourceSessionId, sessionId));
    }

    // Filter by status if provided, default to processing
    if (statusParam) {
      const statuses = statusParam.split(',');
      filters.push(inArray(mediaLibrary.status, statuses as any));
    } else {
      // Default to processing status
      filters.push(eq(mediaLibrary.status, 'processing'));
    }

    // Filter out tasks older than 1 hour to avoid stale data
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    filters.push(gte(mediaLibrary.createdAt, oneHourAgo));

    // Fetch processing video items
    const tasks = await db
      .select({
        id: mediaLibrary.id,
        title: mediaLibrary.title,
        status: mediaLibrary.status,
        createdAt: mediaLibrary.createdAt,
        generationPrompt: mediaLibrary.generationPrompt,
        aiModel: mediaLibrary.aiModel,
        thumbnailUrl: mediaLibrary.thumbnailUrl,
        mediaUrl: mediaLibrary.mediaUrl,
        referenceImageUrl: mediaLibrary.referenceImageUrl,
      })
      .from(mediaLibrary)
      .where(and(...filters))
      .orderBy(desc(mediaLibrary.createdAt));

    // Enhance with progress from VideoTaskService (in-memory)
    const enhancedTasks = tasks.map((task) => {
      // Try to get progress from in-memory VideoTaskService
      // Task IDs are stored in the service, we need to find matching one
      const taskIds = VideoTaskService.getAllTaskIds();
      const matchingTaskId = taskIds.find((tid) => {
        const serviceTask = VideoTaskService.getTask(tid);
        return serviceTask?.mediaId === task.id;
      });

      let progress = 0;
      if (matchingTaskId) {
        const serviceTask = VideoTaskService.getTask(matchingTaskId);
        progress = serviceTask?.progress || 0;
      } else if (task.status === 'processing') {
        // Default progress for processing items without task ID
        progress = 50;
      }

      return {
        ...task,
        progress,
        mediaType: 'video' as const,
      };
    });

    return NextResponse.json({ tasks: enhancedTasks });
  } catch (error: any) {
    console.error('[Video Tasks API] Error fetching tasks:', error);
    return handleAuthError(error);
  }
}
