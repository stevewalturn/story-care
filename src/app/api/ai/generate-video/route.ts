import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { uploadFile } from '@/libs/GCS';
import { generateVideo } from '@/libs/VideoGeneration';
import { mediaLibrary } from '@/models/Schema';
import { VideoTaskService } from '@/services/VideoTaskService';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';

// POST /api/ai/generate-video - Generate video
export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATE
    const user = await requireTherapist(request);

    const body = await request.json();
    const {
      sessionId,
      title = 'AI Generated Video',
      prompt,
      model = 'seedance-1-lite',
      referenceImage,
      duration = 5,
      fps = 24,
      patientId,
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Video prompt is required' },
        { status: 400 },
      );
    }

    // 2. GET PATIENT ID from session if not provided
    let finalPatientId = patientId;
    let groupId = null;

    if (!finalPatientId && sessionId) {
      const session = await db.query.sessions.findFirst({
        where: (sessions, { eq }) => eq(sessions.id, sessionId),
      });
      finalPatientId = session?.patientId;
      groupId = session?.groupId;
    }

    // For group sessions, patientId can be null - media belongs to the group/session
    if (!finalPatientId && !groupId && !sessionId) {
      return NextResponse.json(
        { error: 'Either patient ID, group ID, or session ID is required' },
        { status: 400 },
      );
    }

    // 3. CREATE TASK ID
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const taskId = `video_${timestamp}_${random}`;

    // 4. INITIALIZE TASK
    VideoTaskService.createTask(taskId);

    // 5. START ASYNC VIDEO GENERATION (non-blocking)
    generateVideoAsync({
      taskId,
      prompt,
      model,
      referenceImage,
      duration,
      fps,
      patientId: finalPatientId,
      sessionId,
      title,
      therapistId: user.dbUserId,
    }).catch((error) => {
      console.error('Video generation async error:', error);
      VideoTaskService.failTask(taskId, error.message);
    });

    // 6. RETURN TASK ID IMMEDIATELY
    return NextResponse.json({
      taskId,
      status: 'pending',
      message: 'Video generation started. Use the taskId to poll for status.',
    });
  } catch (error) {
    console.error('Video generation error:', error);
    return handleAuthError(error);
  }
}

// ============================================================================
// ASYNC VIDEO GENERATION FUNCTION
// ============================================================================

type VideoGenParams = {
  taskId: string;
  prompt: string;
  model: string;
  referenceImage?: string;
  duration: number;
  fps: number;
  patientId: string;
  sessionId?: string;
  title: string;
  therapistId: string;
};

async function generateVideoAsync(params: VideoGenParams) {
  const { taskId, prompt, model, referenceImage, duration, fps, patientId, sessionId, title, therapistId } = params;

  try {
    // Update task status to processing
    VideoTaskService.updateTask(taskId, {
      status: 'processing',
      progress: 10,
    });

    // ========================================================================
    // ATLAS CLOUD VIDEO GENERATION
    // ========================================================================
    console.log(`[VIDEO GEN] Starting generation for task ${taskId}`);
    console.log(`[VIDEO GEN] Prompt: ${prompt}`);
    console.log(`[VIDEO GEN] Model: ${model}, Duration: ${duration}s, FPS: ${fps}`);

    VideoTaskService.updateTask(taskId, { progress: 30 });

    // Generate video using Atlas Cloud
    const result = await generateVideo({
      prompt,
      model: model as any,
      referenceImage,
      duration,
      fps,
    });

    const videoUrl = result.videoUrl;
    console.log(`[VIDEO GEN] Atlas completed: ${videoUrl}`);

    VideoTaskService.updateTask(taskId, { progress: 70 });

    // Download and upload to GCS
    const videoResponse = await fetch(videoUrl);
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

    VideoTaskService.updateTask(taskId, { progress: 85 });

    const { path: gcsPath } = await uploadFile(
      videoBuffer,
      `video-${Date.now()}.mp4`,
      {
        folder: 'media/videos',
        contentType: 'video/mp4',
        makePublic: false,
      },
    );

    VideoTaskService.updateTask(taskId, { progress: 95 });

    // Save to media library (patientId can be null for group sessions)
    const dbResult = await db
      .insert(mediaLibrary)
      .values({
        patientId: patientId || null, // Null for group sessions
        createdByTherapistId: therapistId,
        title,
        mediaType: 'video',
        mediaUrl: gcsPath, // Save GCS path
        sourceType: 'generated',
        sourceSessionId: sessionId || null,
        generationPrompt: prompt,
        aiModel: `atlas-${model}`,
        durationSeconds: duration,
        status: 'completed',
      })
      .returning();

    const media = (dbResult as any[])[0];

    // Update task to completed
    VideoTaskService.completeTask(taskId, media.id);

    console.log(`[VIDEO GEN] Completed task ${taskId}, media ID: ${media.id}`);
  } catch (error) {
    console.error(`[VIDEO GEN] Failed task ${taskId}:`, error);
    VideoTaskService.failTask(taskId, (error as Error).message);
  }
}
