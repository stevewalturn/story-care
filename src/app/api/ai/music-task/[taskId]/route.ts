import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { mediaLibrary, musicGenerationTasksSchema } from '@/models/Schema';
import { MusicTaskService } from '@/services/MusicTaskService';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';
import { downloadAndSaveAudio } from '@/app/api/webhooks/suno/route';

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

/**
 * Map Suno API status to our internal status and progress
 */
function mapSunoStatus(sunoStatus: string): { status: string; progress: number } {
  switch (sunoStatus) {
    case 'PENDING':
      return { status: 'pending', progress: 0 };
    case 'TEXT_SUCCESS':
      return { status: 'processing', progress: 20 };
    case 'FIRST_SUCCESS':
      return { status: 'processing', progress: 60 };
    case 'SUCCESS':
      return { status: 'completed', progress: 100 };
    case 'CREATE_TASK_FAILED':
    case 'GENERATE_AUDIO_FAILED':
    case 'CALLBACK_EXCEPTION':
    case 'SENSITIVE_WORD_ERROR':
      return { status: 'failed', progress: 0 };
    default:
      return { status: 'processing', progress: 10 };
  }
}

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

    // 4. IF TASK HAS SUNO TASK ID AND IS NOT COMPLETED/FAILED, POLL SUNO API
    if (task.sunoTaskId && task.status !== 'completed' && task.status !== 'failed') {
      try {
        const sunoApiKey = process.env.SUNO_API_KEY;
        if (!sunoApiKey) {
          console.warn('[Music Task] SUNO_API_KEY not configured, skipping Suno polling');
        } else {
          // Poll Suno API for latest status
          const sunoResponse = await fetch(
            `https://api.sunoapi.org/api/v1/generate/record-info?taskId=${task.sunoTaskId}`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${sunoApiKey}`,
                'Content-Type': 'application/json',
              },
            },
          );

          if (sunoResponse.ok) {
            const sunoData = await sunoResponse.json();

            if (sunoData.code === 200 && sunoData.data) {
              // Map Suno status to our status
              const { status, progress } = mapSunoStatus(sunoData.data.status);

              // Extract error information if failed
              const error
                = status === 'failed'
                  ? sunoData.data.errorMessage || 'Generation failed'
                  : null;

              // If completed and no mediaId, download and save audio
              if (status === 'completed' && !task.mediaId && sunoData.data.response?.sunoData?.[0]) {
                try {
                  const sunoAudio = sunoData.data.response.sunoData[0];
                  console.log(`[Music Task] Downloading and saving audio for task ${task.taskId}`);
                  console.log(`[Music Task] Suno audio data:`, sunoAudio);

                  await downloadAndSaveAudio(task, sunoAudio.audioUrl, {
                    title: sunoAudio.title || task.title,
                    duration: sunoAudio.duration,
                    prompt: sunoAudio.prompt || task.prompt,
                  });

                  console.log(`[Music Task] Audio saved successfully for task ${task.taskId}`);

                  // Refresh task from database to get updated mediaId
                  const refreshedTask = await MusicTaskService.getTask(taskId);
                  if (refreshedTask) {
                    task.status = refreshedTask.status;
                    task.progress = refreshedTask.progress;
                    task.mediaId = refreshedTask.mediaId;
                  }
                } catch (saveError) {
                  console.error(`[Music Task] Failed to save audio for task ${task.taskId}:`, saveError);
                  // Mark task as failed if audio download fails
                  await db
                    .update(musicGenerationTasksSchema)
                    .set({
                      status: 'failed',
                      error: saveError instanceof Error ? saveError.message : 'Failed to save audio',
                      updatedAt: new Date(),
                    })
                    .where(eq(musicGenerationTasksSchema.id, task.id));

                  task.status = 'failed';
                  task.error = saveError instanceof Error ? saveError.message : 'Failed to save audio';
                }
              } else {
                // Update database with latest status from Suno (for non-completed or already-saved tasks)
                await db
                  .update(musicGenerationTasksSchema)
                  .set({
                    status: status as any,
                    progress,
                    error,
                    updatedAt: new Date(),
                  })
                  .where(eq(musicGenerationTasksSchema.id, task.id));

                // Update task object for response
                task.status = status as any;
                task.progress = progress;
                task.error = error;

                console.log(`[Music Task] Updated status from Suno: ${task.taskId} -> ${status} (${progress}%)`);
              }
            }
          } else {
            console.error('[Music Task] Suno API error:', sunoResponse.status, await sunoResponse.text());
          }
        }
      } catch (sunoError) {
        // Log but don't fail - return database status as fallback
        console.error('[Music Task] Error polling Suno API:', sunoError);
      }
    }

    // 5. IF COMPLETED, FETCH MEDIA DETAILS
    let media = null;
    if (task.status === 'completed' && task.mediaId) {
      media = await db.query.mediaLibrary.findFirst({
        where: (mediaLib, { eq }) => eq(mediaLib.id, task.mediaId!),
      });
    }

    // 6. RETURN STATUS
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
