import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { mediaLibrary } from '@/models/Schema';
import { VideoTaskService } from '@/services/VideoTaskService';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

// GET /api/ai/video-task/[taskId] - Poll video generation status
export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    // 1. AUTHENTICATE
    await requireAuth(request);

    // 2. GET TASK ID
    const { taskId } = await context.params;

    // 3. CHECK TASK STATUS
    const task = VideoTaskService.getTask(taskId);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or expired' },
        { status: 404 },
      );
    }

    // 4. IF COMPLETED, FETCH MEDIA DETAILS
    let media = null;
    if (task.status === 'completed' && task.mediaId) {
      const [mediaRecord] = await db
        .select()
        .from(mediaLibrary)
        .where(eq(mediaLibrary.id, task.mediaId))
        .limit(1);

      media = mediaRecord || null;
    }

    // 5. RETURN STATUS
    return NextResponse.json({
      data: {
        taskId: task.taskId,
        status: task.status,
        progress: task.progress,
        media,
        error: task.error,
      },
    });
  } catch (error) {
    console.error('Error polling video task:', error);
    return handleAuthError(error);
  }
}
