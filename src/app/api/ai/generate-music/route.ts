import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { uploadFile } from '@/libs/GCS';
import { createTherapeuticMusicOptions, generateSunoMusic, getSunoTaskStatus } from '@/libs/SunoAI';
import { mediaLibrary } from '@/models/Schema';
import { MusicTaskService } from '@/services/MusicTaskService';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';

// POST /api/ai/generate-music - Generate music track
export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATE
    const user = await requireTherapist(request);

    const body = await request.json();
    const {
      sessionId,
      title = 'AI Generated Music',
      prompt,
      model = 'V4_5',
      instrumental = true,
      stylePrompt,
      duration = 120, // Default 2 minutes
      patientId,
    } = body;

    if (!prompt && !stylePrompt) {
      return NextResponse.json(
        { error: 'Music prompt or style prompt is required' },
        { status: 400 },
      );
    }

    // 2. GET PATIENT ID from session if not provided
    let finalPatientId = patientId;
    if (!finalPatientId && sessionId) {
      const session = await db.query.sessions.findFirst({
        where: (sessions, { eq }) => eq(sessions.id, sessionId),
      });
      finalPatientId = session?.patientId;
    }

    if (!finalPatientId) {
      return NextResponse.json(
        { error: 'Patient ID is required (either directly or via session)' },
        { status: 400 },
      );
    }

    // 3. CREATE TASK ID
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const taskId = `music_${timestamp}_${random}`;

    // 4. INITIALIZE TASK
    MusicTaskService.createTask(taskId);

    // 5. START ASYNC MUSIC GENERATION (non-blocking)
    generateMusicAsync({
      taskId,
      prompt: stylePrompt || prompt,
      model,
      instrumental,
      duration,
      patientId: finalPatientId,
      sessionId,
      title,
      therapistId: user.dbUserId,
    }).catch((error) => {
      console.error('Music generation async error:', error);
      MusicTaskService.failTask(taskId, error.message);
    });

    // 6. RETURN TASK ID IMMEDIATELY
    return NextResponse.json({
      taskId,
      status: 'pending',
      message: 'Music generation started. Use the taskId to poll for status.',
    });
  } catch (error) {
    console.error('Music generation error:', error);
    return handleAuthError(error);
  }
}

// ============================================================================
// ASYNC MUSIC GENERATION FUNCTION
// ============================================================================

type MusicGenParams = {
  taskId: string;
  prompt: string;
  model: string;
  instrumental: boolean;
  duration: number;
  patientId: string;
  sessionId?: string;
  title: string;
  therapistId: string;
};

async function generateMusicAsync(params: MusicGenParams) {
  const { taskId, prompt, model, instrumental, duration, patientId, sessionId, title, therapistId } = params;

  try {
    // Update task status to processing
    MusicTaskService.updateTask(taskId, {
      status: 'processing',
      progress: 10,
    });

    // ========================================================================
    // SUNO AI MUSIC GENERATION
    // ========================================================================
    console.log(`[MUSIC GEN] Starting generation for task ${taskId}`);
    console.log(`[MUSIC GEN] Prompt: ${prompt}`);
    console.log(`[MUSIC GEN] Model: ${model}, Instrumental: ${instrumental}, Duration: ${duration}s`);

    // Step 1: Start Suno AI generation
    MusicTaskService.updateTask(taskId, { progress: 20 });

    const sunoOptions = createTherapeuticMusicOptions({
      prompt,
      title,
      instrumental,
      duration,
      model: model as any,
    });

    const sunoResponse = await generateSunoMusic(sunoOptions);

    if (!sunoResponse.data?.taskId) {
      throw new Error('Failed to start Suno music generation');
    }

    const sunoTaskId = sunoResponse.data.taskId;
    console.log(`[MUSIC GEN] Suno task started: ${sunoTaskId}`);

    // Step 2: Poll Suno API for completion
    MusicTaskService.updateTask(taskId, { progress: 30 });

    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (5s intervals)
    let audioUrl: string | null = null;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;

      try {
        const statusResponse = await getSunoTaskStatus(sunoTaskId);

        if (statusResponse.data?.status === 'completed' && statusResponse.data.audioUrl) {
          audioUrl = statusResponse.data.audioUrl;
          console.log(`[MUSIC GEN] Suno completed: ${audioUrl}`);
          break;
        } else if (statusResponse.data?.status === 'failed') {
          throw new Error(statusResponse.data.error || 'Suno generation failed');
        }

        // Update progress (30% to 90% during polling)
        const progressPercent = 30 + Math.floor((attempts / maxAttempts) * 60);
        MusicTaskService.updateTask(taskId, { progress: progressPercent });
      } catch (pollError) {
        console.error(`[MUSIC GEN] Poll attempt ${attempts} failed:`, pollError);
        // Continue polling unless max attempts reached
        if (attempts >= maxAttempts) {
          throw pollError;
        }
      }
    }

    if (!audioUrl) {
      throw new Error('Music generation timed out');
    }

    // Step 3: Download and upload to GCS
    MusicTaskService.updateTask(taskId, { progress: 95 });

    const audioResponse = await fetch(audioUrl);
    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());

    const { path: gcsPath } = await uploadFile(
      audioBuffer,
      `music-${Date.now()}.mp3`,
      {
        folder: 'media/audio',
        contentType: 'audio/mpeg',
        makePublic: false,
      },
    );

    // Save to media library
    const result = await db
      .insert(mediaLibrary)
      .values({
        patientId,
        createdByTherapistId: therapistId,
        title,
        mediaType: 'audio',
        mediaUrl: gcsPath, // Save GCS path
        sourceType: 'generated',
        sourceSessionId: sessionId || null,
        generationPrompt: prompt,
        aiModel: `suno-${model}`,
        durationSeconds: duration,
        status: 'completed',
      })
      .returning();

    const media = (result as any[])[0];

    // Update task to completed
    MusicTaskService.completeTask(taskId, media.id);

    console.log(`[MUSIC GEN] Completed task ${taskId}, media ID: ${media.id}`);
  } catch (error) {
    console.error(`[MUSIC GEN] Failed task ${taskId}:`, error);
    MusicTaskService.failTask(taskId, (error as Error).message);
  }
}
