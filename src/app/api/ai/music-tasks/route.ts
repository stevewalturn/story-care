/**
 * Music Tasks API
 * List music generation tasks with filtering and create new tasks
 */

import type { NextRequest } from 'next/server';
import { and, desc, eq, gte, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/libs/DB';
import { generateSunoMusic } from '@/libs/SunoAI';
import { musicGenerationTasksSchema } from '@/models/Schema';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';
import { downloadAndSaveAudio } from '@/utils/SunoAudioUtils';

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
 * Request body validation schema
 */
const createMusicTaskSchema = z.object({
  patientId: z.string(),
  sessionId: z.string().optional().nullable(),
  prompt: z.string().min(1, 'Prompt is required').max(5000), // Lyrics when customMode=true (max 5000)
  title: z.string().min(1, 'Title is required').max(100),
  style: z.string().max(1000).optional(), // Required when customMode=true
  model: z.enum(['V4', 'V4_5', 'V4_5PLUS', 'V4_5ALL', 'V5']).default('V4_5'),
  customMode: z.boolean().default(false),
  instrumental: z.boolean().default(true),
});

/**
 * POST /api/ai/music-tasks
 * Create a new music generation task
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth(request);

    // Parse and validate request body
    const body = await request.json();
    const validated = createMusicTaskSchema.parse(body);

    // Validate customMode requirements
    if (validated.customMode) {
      if (!validated.style) {
        return NextResponse.json(
          { error: 'Style is required when customMode is true' },
          { status: 400 },
        );
      }
      // For lyrical songs in custom mode, prompt contains lyrics
      if (!validated.instrumental && !validated.prompt) {
        return NextResponse.json(
          { error: 'Prompt (lyrics) is required for lyrical songs in custom mode' },
          { status: 400 },
        );
      }
    }

    console.log('[Music Tasks] Creating new task:', {
      patientId: validated.patientId,
      sessionId: validated.sessionId,
      title: validated.title,
      model: validated.model,
      customMode: validated.customMode,
      instrumental: validated.instrumental,
    });

    // Generate unique task ID
    const taskId = `music_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // Call Suno API to create generation task
    const sunoOptions = {
      prompt: validated.prompt,
      title: validated.title,
      style: validated.style,
      model: validated.model,
      customMode: validated.customMode,
      instrumental: validated.instrumental,
    };

    console.log('[Music Tasks] Calling Suno API with options:', sunoOptions);

    const sunoResponse = await generateSunoMusic(sunoOptions);

    if (sunoResponse.code !== 200 || !sunoResponse.data?.taskId) {
      throw new Error(sunoResponse.msg || 'Failed to create music generation task');
    }

    console.log('[Music Tasks] Suno task created:', sunoResponse.data.taskId);

    // Save task to database
    const result = await db
      .insert(musicGenerationTasksSchema)
      .values({
        taskId, // Custom task ID (not id - that's auto-generated UUID)
        patientId: validated.patientId,
        sessionId: validated.sessionId,
        title: validated.title,
        prompt: validated.prompt,
        style: validated.style || null,
        model: validated.model,
        customMode: validated.customMode,
        instrumental: validated.instrumental,
        sunoTaskId: sunoResponse.data.taskId,
        status: 'pending',
        progress: 0,
        createdByTherapistId: user.dbUserId, // Add therapist ID from authenticated user
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning() as any[];

    if (!result || result.length === 0) {
      throw new Error('Failed to create music task in database');
    }

    const newTask = result[0]!;

    console.log('[Music Tasks] Task saved to database:', newTask.id);

    return NextResponse.json({
      task: newTask,
      sunoTaskId: sunoResponse.data.taskId,
    });
  } catch (error: unknown) {
    console.error('[Music Tasks API] Error creating task:', error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 },
      );
    }

    return handleAuthError(error);
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
    const sessionId = searchParams.get('sessionId');
    const statusParam = searchParams.get('status'); // e.g., 'pending,processing'

    if (!patientId && !sessionId) {
      return NextResponse.json(
        { error: 'Either patientId or sessionId is required' },
        { status: 400 },
      );
    }

    // Build filters
    const filters = [];

    if (patientId) {
      filters.push(eq(musicGenerationTasksSchema.patientId, patientId));
    }

    if (sessionId) {
      filters.push(eq(musicGenerationTasksSchema.sessionId, sessionId));
    }

    // Filter by status if provided
    if (statusParam) {
      const statuses = statusParam.split(',');
      filters.push(inArray(musicGenerationTasksSchema.status, statuses as any));
    }

    // Filter out tasks older than 1 hour (only for pending/processing tasks)
    if (statusParam && (statusParam.includes('pending') || statusParam.includes('processing'))) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // 1 hour = 3600000ms
      filters.push(gte(musicGenerationTasksSchema.createdAt, oneHourAgo));
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
                    'Authorization': `Bearer ${sunoApiKey}`,
                    'Content-Type': 'application/json',
                  },
                },
              );

              if (sunoResponse.ok) {
                const sunoData = await sunoResponse.json();

                if (sunoData.code === 200 && sunoData.data) {
                  // Map Suno status to our status
                  const { status, progress } = mapSunoStatus(sunoData.data.status);

                  // Log the actual Suno status for debugging
                  console.log(`[Music Tasks] Suno status for ${task.id}:`, {
                    sunoStatus: sunoData.data.status,
                    errorMessage: sunoData.data.errorMessage,
                    mappedStatus: status,
                  });

                  // Extract error information with CLEAR human-readable messages
                  let error = null;
                  if (status === 'failed') {
                    const sunoStatus = sunoData.data.status;
                    const errorMessages: Record<string, string> = {
                      SENSITIVE_WORD_ERROR: 'Content flagged by Suno moderation. Please modify lyrics to remove sensitive words (medical terms, "war", "symptoms", etc. may be flagged).',
                      CREATE_TASK_FAILED: 'Failed to create music task. Please try again.',
                      GENERATE_AUDIO_FAILED: 'Audio generation failed. Please try different lyrics or style.',
                      CALLBACK_EXCEPTION: 'Server error during generation. Please try again.',
                    };
                    error = errorMessages[sunoStatus] || sunoData.data.errorMessage || 'Music generation failed';

                    console.error(`[Music Tasks] Task ${task.id} FAILED:`, {
                      sunoStatus,
                      errorMessage: error,
                      fullResponse: sunoData.data,
                    });
                  }

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
