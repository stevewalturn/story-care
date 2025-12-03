import crypto from 'crypto';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { uploadFile } from '@/libs/GCS';
import { mediaLibrary, musicGenerationTasks } from '@/models/Schema';

// Suno webhook callback payload type
type SunoWebhookPayload = {
  taskId: string; // Suno's task ID
  status: 'pending' | 'processing' | 'completed' | 'failed';
  audioUrl?: string;
  title?: string;
  duration?: number;
  error?: string;
};

/**
 * Verify webhook signature using HMAC-SHA256
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  } catch {
    // If lengths don't match, timingSafeEqual throws - return false
    return false;
  }
}

/**
 * POST /api/webhooks/suno
 * Receive music generation completion callbacks from Suno AI
 */
export async function POST(request: NextRequest) {
  try {
    // 1. VERIFY WEBHOOK SIGNATURE
    const signature = request.headers.get('x-suno-signature');
    const webhookSecret = process.env.SUNO_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[SUNO WEBHOOK] SUNO_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 },
      );
    }

    if (!signature) {
      console.error('[SUNO WEBHOOK] Missing signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const rawBody = await request.text();
    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);

    if (!isValid) {
      console.error('[SUNO WEBHOOK] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 2. PARSE PAYLOAD
    const payload: SunoWebhookPayload = JSON.parse(rawBody);
    console.log('[SUNO WEBHOOK] Received callback:', payload);

    // 3. FIND TASK BY SUNO TASK ID
    const task = await db.query.musicGenerationTasks.findFirst({
      where: (tasks, { eq }) => eq(tasks.sunoTaskId, payload.taskId),
    });

    if (!task) {
      console.error(`[SUNO WEBHOOK] Task not found: ${payload.taskId}`);
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // 4. UPDATE TASK BASED ON STATUS
    if (payload.status === 'completed' && payload.audioUrl) {
      await handleCompletedMusic(task, payload);
    } else if (payload.status === 'failed') {
      await handleFailedMusic(task, payload);
    } else if (payload.status === 'processing') {
      // Update progress
      await db
        .update(musicGenerationTasks)
        .set({
          status: 'processing',
          progress: 50, // Arbitrary progress for processing state
          updatedAt: new Date(),
        })
        .where(eq(musicGenerationTasks.id, task.id));
    }

    // 5. RETURN SUCCESS
    return NextResponse.json({ success: true, taskId: task.taskId });
  } catch (error) {
    console.error('[SUNO WEBHOOK] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * Download audio from Suno and save to media library
 * Reusable function for both webhook and polling endpoints
 */
export async function downloadAndSaveAudio(
  task: any,
  audioUrl: string,
  audioData: {
    title?: string;
    duration?: number;
    prompt?: string;
  },
) {
  console.log(`[Suno Audio] Downloading audio for task ${task.taskId}`);

  // 1. Download audio from Suno URL
  const audioResponse = await fetch(audioUrl);
  if (!audioResponse.ok) {
    throw new Error(`Failed to download audio: ${audioResponse.statusText}`);
  }

  const audioBuffer = await audioResponse.arrayBuffer();
  const buffer = Buffer.from(audioBuffer);

  // 2. Upload to GCS
  const fileName = `${task.taskId}.mp3`;
  const { url: gcsUrl, path: gcsPath } = await uploadFile(buffer, fileName, {
    folder: 'music',
    contentType: 'audio/mpeg',
    makePublic: false,
  });

  console.log(`[Suno Audio] Uploaded to GCS: ${gcsPath}`);

  // 3. Save to media_library (store path, not signed URL)
  const [media] = await db
    .insert(mediaLibrary)
    .values({
      mediaType: 'audio',
      mediaUrl: gcsPath,
      sourceType: 'generated',
      generationPrompt: audioData.prompt || task.prompt,
      aiModel: `suno-${task.model}`,
      durationSeconds: Math.round(audioData.duration || task.duration || 120),
      status: 'completed',
      patientId: task.patientId,
      sourceSessionId: task.sessionId,
      createdByTherapistId: task.createdByTherapistId,
      title: audioData.title || task.title || 'AI Generated Music',
    })
    .returning();

  console.log(`[Suno Audio] Created media record: ${media.id}`);

  // 4. Update task as completed
  await db
    .update(musicGenerationTasks)
    .set({
      status: 'completed',
      progress: 100,
      mediaId: media.id,
      audioUrl,
      duration: audioData.duration ? Math.round(audioData.duration) : undefined,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(musicGenerationTasks.id, task.id));

  console.log(`[Suno Audio] Task completed: ${task.taskId}`);

  return media;
}

/**
 * Handle completed music generation (webhook-specific wrapper)
 */
async function handleCompletedMusic(task: any, payload: SunoWebhookPayload) {
  try {
    console.log(
      `[SUNO WEBHOOK] Processing completed music for task ${task.taskId}`,
    );

    // Use the reusable function
    await downloadAndSaveAudio(task, payload.audioUrl!, {
      title: payload.title || task.title,
      duration: payload.duration,
      prompt: task.prompt,
    });
  } catch (error) {
    console.error('[SUNO WEBHOOK] Error handling completed music:', error);

    // Mark task as failed
    await db
      .update(musicGenerationTasks)
      .set({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        updatedAt: new Date(),
      })
      .where(eq(musicGenerationTasks.id, task.id));
  }
}

/**
 * Handle failed music generation
 */
async function handleFailedMusic(task: any, payload: SunoWebhookPayload) {
  console.log(`[SUNO WEBHOOK] Handling failed music for task ${task.taskId}`);

  await db
    .update(musicGenerationTasks)
    .set({
      status: 'failed',
      error: payload.error || 'Music generation failed',
      updatedAt: new Date(),
    })
    .where(eq(musicGenerationTasks.id, task.id));

  console.log(`[SUNO WEBHOOK] Task marked as failed: ${task.taskId}`);
}
