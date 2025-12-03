/**
 * Music Tasks API
 * List music generation tasks with filtering
 */

import type { NextRequest } from 'next/server';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { musicGenerationTasksSchema } from '@/models/Schema';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';
import { downloadAndSaveAudio } from '@/app/api/webhooks/suno/route';

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

/**
 * GET /api/ai/music-tasks
 * List music generation tasks filtered by patient and status
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const statusParam = searchParams.get('status'); // e.g., 'pending,processing'

    if (!patientId) {
      return NextResponse.json(
        { error: 'patientId is required' },
        { status: 400 },
      );
    }

    // Build filters
    const filters = [eq(musicGenerationTasksSchema.patientId, patientId)];

    // Filter by status if provided
    if (statusParam) {
      const statuses = statusParam.split(',');
      filters.push(inArray(musicGenerationTasksSchema.status, statuses as any));
    }

    // Fetch tasks
    const tasks = await db
      .select()
      .from(musicGenerationTasksSchema)
      .where(and(...filters))
      .orderBy(desc(musicGenerationTasksSchema.createdAt));

    // Poll Suno API for each in-progress task to get real-time status
    const sunoApiKey = process.env.SUNO_API_KEY;

    if (sunoApiKey) {
      const updatedTasks = await Promise.all(
        tasks.map(async (task) => {
          // Only poll if task has sunoTaskId and is in progress
          if (task.sunoTaskId && (task.status === 'pending' || task.status === 'processing')) {
            try {
              console.log(`[Music Tasks] Polling Suno for task ${task.id} (sunoTaskId: ${task.sunoTaskId})`);

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
                      console.log(`[Music Tasks] Downloading and saving audio for task ${task.id}`);
                      console.log(`[Music Tasks] Suno audio data:`, sunoAudio);

                      await downloadAndSaveAudio(task, sunoAudio.audioUrl, {
                        title: sunoAudio.title || task.title,
                        duration: sunoAudio.duration,
                        prompt: sunoAudio.prompt || task.prompt,
                      });

                      console.log(`[Music Tasks] Audio saved successfully for task ${task.id}`);

                      // Refresh task from database to get updated mediaId
                      const [updatedTask] = await db
                        .select()
                        .from(musicGenerationTasksSchema)
                        .where(eq(musicGenerationTasksSchema.id, task.id));

                      return updatedTask;
                    } catch (saveError) {
                      console.error(`[Music Tasks] Failed to save audio for task ${task.id}:`, saveError);
                      // Mark task as failed if audio download fails
                      await db
                        .update(musicGenerationTasksSchema)
                        .set({
                          status: 'failed',
                          error: saveError instanceof Error ? saveError.message : 'Failed to save audio',
                          updatedAt: new Date(),
                        })
                        .where(eq(musicGenerationTasksSchema.id, task.id));

                      return {
                        ...task,
                        status: 'failed' as any,
                        error: saveError instanceof Error ? saveError.message : 'Failed to save audio',
                      };
                    }
                  }

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

                  console.log(`[Music Tasks] Updated ${task.id}: ${task.status} → ${status} (${progress}%)`);

                  // Return updated task
                  return {
                    ...task,
                    status: status as any,
                    progress,
                    error,
                  };
                }
              } else {
                console.error(`[Music Tasks] Suno API error for ${task.id}:`, sunoResponse.status);
              }
            } catch (error) {
              console.error(`[Music Tasks] Error polling Suno for task ${task.id}:`, error);
            }
          }

          // Return unchanged task if not polling or error
          return task;
        }),
      );

      return NextResponse.json({ tasks: updatedTasks });
    }

    // Fallback: return database tasks if no API key
    console.warn('[Music Tasks] SUNO_API_KEY not configured, returning database status');
    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error('[Music Tasks API] Error fetching tasks:', error);
    return handleAuthError(error);
  }
}
