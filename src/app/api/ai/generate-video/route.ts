import type { NextRequest } from 'next/server';
import type { TraceMetadata } from '@/libs/LangfuseTracing';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { uploadFile } from '@/libs/GCS';
import { generateVideo } from '@/libs/VideoGeneration';
import { mediaLibrary } from '@/models/Schema';
import { VideoService } from '@/services/VideoService';
import { VideoTaskService } from '@/services/VideoTaskService';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';
import { getPatientById, getSessionPatients } from '@/utils/SessionPatients';
import { buildTraceMetadata } from '@/utils/TraceMetadataBuilder';

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
      model = 'seedance-v1.5-pro-i2v',
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

    // 2. GET PATIENT ID and GROUP ID from session if not provided
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

    // Fetch patient info for tracing (individual + group sessions)
    let patients = sessionId ? await getSessionPatients(sessionId) : [];
    if (patients.length === 0 && finalPatientId) {
      const patient = await getPatientById(finalPatientId);
      if (patient) patients = [patient];
    }

    // 3. CREATE TASK ID
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const taskId = `video_${timestamp}_${random}`;

    // 4. INITIALIZE TASK
    VideoTaskService.createTask(taskId);

    // 5. CREATE PLACEHOLDER MEDIA RECORD (shows in Library immediately as "processing")
    const placeholderResult = await db
      .insert(mediaLibrary)
      .values({
        patientId: finalPatientId || null,
        createdByTherapistId: user.dbUserId,
        title,
        mediaType: 'video',
        mediaUrl: '', // Placeholder - will be updated when complete
        sourceType: 'generated',
        sourceSessionId: sessionId || null,
        generationPrompt: prompt,
        aiModel: `atlas-${model}`,
        durationSeconds: duration,
        status: 'processing', // Key: shows as processing in Library
        referenceImageUrl: referenceImage || null,
        tags: ['ai-generated', 'atlas-video'],
      })
      .returning();
    const placeholderMedia = (placeholderResult as any[])[0];

    // Build trace metadata for observability
    const traceMetadata = buildTraceMetadata({
      user,
      sessionId,
      patients,
      additionalTags: ['generate-video', model],
    });

    // 6. START ASYNC VIDEO GENERATION (non-blocking)
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
      mediaId: placeholderMedia.id, // Pass placeholder ID to update later
      traceMetadata,
    }).catch((error) => {
      console.error('Video generation async error:', error);
      VideoTaskService.failTask(taskId, error.message);
      // Mark media as failed
      db.update(mediaLibrary)
        .set({ status: 'failed' })
        .where(eq(mediaLibrary.id, placeholderMedia.id))
        .catch(console.error);
    });

    // 7. RETURN TASK ID AND MEDIA ID IMMEDIATELY
    return NextResponse.json({
      taskId,
      mediaId: placeholderMedia.id,
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
  mediaId: string; // Placeholder media ID to update
  traceMetadata?: TraceMetadata;
};

async function generateVideoAsync(params: VideoGenParams) {
  const { taskId, prompt, model, referenceImage, duration, fps, mediaId, traceMetadata } = params;

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
      traceMetadata,
    });

    const videoUrl = result.videoUrl;
    console.log(`[VIDEO GEN] Atlas completed: ${videoUrl}`);

    VideoTaskService.updateTask(taskId, { progress: 70 });

    // Download and upload to GCS
    const videoResponse = await fetch(videoUrl);
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

    VideoTaskService.updateTask(taskId, { progress: 80 });

    const { path: gcsPath } = await uploadFile(
      videoBuffer,
      `video-${Date.now()}.mp4`,
      {
        folder: 'media/videos',
        contentType: 'video/mp4',
        makePublic: false,
      },
    );

    VideoTaskService.updateTask(taskId, { progress: 90 });

    // Extract thumbnail from video buffer (at 1 second mark)
    let thumbnailPath: string | null = null;
    try {
      thumbnailPath = await VideoService.extractThumbnailFromBuffer(videoBuffer, 1);
      console.log(`[VIDEO GEN] Thumbnail extracted: ${thumbnailPath}`);
    } catch (thumbError) {
      console.error('[VIDEO GEN] Failed to extract thumbnail:', thumbError);
      // Fallback: Use reference image as thumbnail if available
      if (referenceImage) {
        thumbnailPath = referenceImage;
        console.log(`[VIDEO GEN] Using reference image as thumbnail fallback: ${thumbnailPath}`);
      }
    }

    VideoTaskService.updateTask(taskId, { progress: 95 });

    // Build generation metadata (separate from therapist notes)
    const generationMetadata = {
      fps,
      duration,
      model,
      referenceImageUsed: !!referenceImage,
      generatedAt: new Date().toISOString(),
    };

    // Update the placeholder media record with actual video data and thumbnail
    await db
      .update(mediaLibrary)
      .set({
        mediaUrl: gcsPath,
        thumbnailUrl: thumbnailPath,
        status: 'completed',
        generationMetadata,
      })
      .where(eq(mediaLibrary.id, mediaId));

    // Update task to completed
    VideoTaskService.completeTask(taskId, mediaId);

    console.log(`[VIDEO GEN] Completed task ${taskId}, media ID: ${mediaId}`);
  } catch (error) {
    console.error(`[VIDEO GEN] Failed task ${taskId}:`, error);
    VideoTaskService.failTask(taskId, (error as Error).message);
    // Delete the placeholder record since video generation failed
    await db
      .delete(mediaLibrary)
      .where(eq(mediaLibrary.id, mediaId))
      .catch(console.error);
  }
}
