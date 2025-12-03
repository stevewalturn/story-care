import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { db } from '@/libs/DB';
import { generateSunoMusic } from '@/libs/SunoAI';
import { MusicTaskService } from '@/services/MusicTaskService';
import { handleAuthError, requireTherapist } from '@/utils/AuthHelpers';

// POST /api/ai/generate-music - Generate music track with webhook callback
export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATE
    const user = await requireTherapist(request);

    const body = await request.json();
    const {
      // Basic params
      sessionId,
      patientId,
      title = 'AI Generated Music',
      prompt,
      stylePrompt,
      model = 'V4_5',
      instrumental = true,
      customMode = false,
      duration: _duration = 120,

      // Advanced V5 params
      personaId,
      negativeTags,
      vocalGender,
      styleWeight,
      weirdnessConstraint,
      audioWeight,
      style,
    } = body;

    // 2. VALIDATE INPUTS
    if (!prompt && !stylePrompt) {
      return NextResponse.json(
        { error: 'Music prompt or style prompt is required' },
        { status: 400 },
      );
    }

    // Get patient ID from session if not provided
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

    // 4. CREATE TASK IN DATABASE
    await MusicTaskService.createTask({
      taskId,
      prompt: stylePrompt || prompt,
      style: customMode && style ? style : undefined,
      title: customMode ? title : undefined,
      model,
      customMode,
      instrumental,
      personaId,
      negativeTags,
      vocalGender: vocalGender as 'm' | 'f' | undefined,
      styleWeight,
      weirdnessConstraint,
      audioWeight,
      patientId: finalPatientId,
      sessionId,
      therapistId: user.dbUserId,
    });

    console.log(`[MUSIC GEN] Created task ${taskId} for patient ${finalPatientId}`);

    // 5. START SUNO GENERATION WITH CALLBACK URL
    const sunoOptions = {
      prompt: stylePrompt || prompt,
      style: customMode && style ? style : undefined,
      title: customMode ? title : undefined,
      model: model as any,
      customMode,
      instrumental,
      personaId,
      negativeTags,
      vocalGender: vocalGender as 'm' | 'f' | undefined,
      styleWeight,
      weirdnessConstraint,
      audioWeight,
      // Callback URL will be added automatically by generateSunoMusic
    };

    try {
      const sunoResponse = await generateSunoMusic(sunoOptions, true);

      if (sunoResponse.data?.taskId) {
        // Store Suno's task ID for webhook lookups
        await MusicTaskService.setSunoTaskId(taskId, sunoResponse.data.taskId);
        console.log(`[MUSIC GEN] Suno task started: ${sunoResponse.data.taskId}`);
      } else {
        throw new Error('No task ID returned from Suno API');
      }
    } catch (error) {
      console.error('[MUSIC GEN] Failed to start Suno generation:', error);
      await MusicTaskService.failTask(
        taskId,
        error instanceof Error ? error.message : 'Failed to start generation',
      );

      return NextResponse.json(
        {
          error: 'Failed to start music generation',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 },
      );
    }

    // 6. RETURN TASK ID IMMEDIATELY
    // Webhook will handle completion notification
    return NextResponse.json({
      taskId,
      status: 'pending',
      message:
        'Music generation started. Poll /api/ai/music-task/{taskId} for status or wait for webhook completion.',
    });
  } catch (error) {
    console.error('[MUSIC GEN] Error:', error);
    return handleAuthError(error);
  }
}
