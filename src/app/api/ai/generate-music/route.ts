import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/libs/DB';
import { generateSunoMusic } from '@/libs/SunoAI';
import { musicGenerationTasksSchema, sessionsSchema } from '@/models/Schema';
import { handleAuthError, requireAuth } from '@/utils/AuthHelpers';
import { getPatientById, getSessionPatients } from '@/utils/SessionPatients';
import { buildTraceMetadata } from '@/utils/TraceMetadataBuilder';

const requestSchema = z.object({
  sessionId: z.string().optional(),
  patientId: z.string().optional(),
  instrumental: z.boolean().default(true),
  customMode: z.boolean().default(false),
  prompt: z.string().max(5000), // Lyrics when customMode=true (max 5000), description otherwise (max 500)
  style: z.string().max(1000).optional(), // Required when customMode=true
  title: z.string().max(100),
  model: z.string().default('V4_5'),
  duration: z.number().min(30).max(300).default(120),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await requireAuth(request);

    // Validate request body
    const body = await request.json();
    const validated = requestSchema.parse(body);

    // Require either sessionId or patientId
    if (!validated.sessionId && !validated.patientId) {
      return NextResponse.json(
        { error: 'Either sessionId or patientId is required' },
        { status: 400 },
      );
    }

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

    // If patientId is not provided but sessionId is, fetch it from the session
    let patientId = validated.patientId;
    if (!patientId && validated.sessionId) {
      const [session] = await db
        .select()
        .from(sessionsSchema)
        .where(eq(sessionsSchema.id, validated.sessionId))
        .limit(1);

      if (!session?.patientId) {
        return NextResponse.json(
          { error: 'Session not found or has no associated patient' },
          { status: 400 },
        );
      }

      patientId = session.patientId;
    }

    // Generate unique task ID
    const taskId = `music_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // Create task in database
    const result = await db
      .insert(musicGenerationTasksSchema)
      .values({
        taskId,
        sessionId: validated.sessionId || null,
        patientId: patientId!, // Now guaranteed to be non-null
        createdByTherapistId: user.dbUserId,
        status: 'pending',
        progress: 0,
        prompt: validated.prompt,
        title: validated.title,
        model: validated.model,
        instrumental: validated.instrumental,
        duration: validated.duration,
      })
      .returning() as any[];

    if (!result || result.length === 0) {
      throw new Error('Failed to create music task in database');
    }

    const task = result[0]!;

    console.log(`[Generate Music] Created task ${task.id} for user ${user.email}`);

    // Call Suno API to start music generation
    try {
      // Fetch patient info for tracing (individual + group sessions)
      let patients = validated.sessionId ? await getSessionPatients(validated.sessionId) : [];
      if (patients.length === 0 && patientId) {
        const patient = await getPatientById(patientId);
        if (patient) patients = [patient];
      }

      // Build trace metadata for observability
      const traceMetadata = buildTraceMetadata({
        user,
        sessionId: validated.sessionId,
        patients,
        additionalTags: ['generate-music', validated.model],
      });

      const sunoOptions = {
        prompt: validated.prompt,
        title: validated.title,
        style: validated.style,
        customMode: validated.customMode,
        instrumental: validated.instrumental,
        model: validated.model as any,
        traceMetadata,
      };

      console.log(`[Generate Music] Calling Suno API for task ${task.id}`, sunoOptions);

      const sunoResponse = await generateSunoMusic(sunoOptions);

      if (sunoResponse.code === 200 && sunoResponse.data?.taskId) {
        // Update task with Suno task ID and set status to processing
        await db
          .update(musicGenerationTasksSchema)
          .set({
            sunoTaskId: sunoResponse.data.taskId,
            status: 'processing',
            updatedAt: new Date(),
          })
          .where(eq(musicGenerationTasksSchema.id, task.id));

        console.log(`[Generate Music] Updated task ${task.id} with Suno task ID: ${sunoResponse.data.taskId}`);
      } else {
        throw new Error(sunoResponse.msg || 'Failed to start music generation');
      }
    } catch (error) {
      console.error(`[Generate Music] Error calling Suno API for task ${task.id}:`, error);

      // Update task status to failed
      await db
        .update(musicGenerationTasksSchema)
        .set({
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          updatedAt: new Date(),
        })
        .where(eq(musicGenerationTasksSchema.id, task.id));

      return NextResponse.json(
        { error: 'Failed to start music generation' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, taskId: task.id });
  } catch (error) {
    console.error('[Generate Music] Error:', error);
    return handleAuthError(error);
  }
}
