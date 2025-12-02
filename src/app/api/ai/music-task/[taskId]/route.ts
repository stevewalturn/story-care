import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { mediaLibrary } from '@/models/Schema';
import { MusicTaskService } from '@/services/MusicTaskService';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

// GET /api/ai/music-task/[taskId] - Poll music generation status
export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    // 1. AUTHENTICATE
    await requireAuth(request);

    // 2. GET TASK ID
    const { taskId } = await context.params;

    // 3. CHECK TASK STATUS FROM DATABASE
    const task = await MusicTaskService.getTask(taskId);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found or expired' },
        { status: 404 },
      );
    }

    // 4. IF COMPLETED, FETCH MEDIA DETAILS
    let media = null;
    if (task.status === 'completed' && task.mediaId) {
      media = await db.query.mediaLibrary.findFirst({
        where: (mediaLib, { eq }) => eq(mediaLib.id, task.mediaId!),
      });
    }

    // 5. RETURN STATUS
    return NextResponse.json({
      taskId: task.taskId,
      status: task.status,
      progress: task.progress,
      media: media || undefined,
      error: task.error,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    });
  } catch (error) {
    console.error('Error polling music task:', error);
    return handleAuthError(error);
  }
}
