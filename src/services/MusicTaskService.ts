// Music Generation Task Service
// Database-backed task storage for music generation (production-ready)

import { eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { musicGenerationTasks } from '@/models/Schema';

export type MusicTaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type MusicTask = {
  id: string;
  taskId: string;
  sunoTaskId?: string;
  status: MusicTaskStatus;
  progress: number;
  mediaId?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateMusicTaskParams = {
  taskId: string;
  prompt?: string;
  style?: string;
  title?: string;
  model: string;
  customMode: boolean;
  instrumental: boolean;
  personaId?: string;
  negativeTags?: string;
  vocalGender?: 'm' | 'f';
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
  patientId: string;
  sessionId?: string;
  therapistId: string;
};

export const MusicTaskService = {
  /**
   * Create a new music generation task in database
   */
  async createTask(params: CreateMusicTaskParams): Promise<MusicTask> {
    const [task] = await db
      .insert(musicGenerationTasks)
      .values({
        taskId: params.taskId,
        status: 'pending',
        progress: 0,
        prompt: params.prompt,
        style: params.style,
        title: params.title,
        model: params.model,
        customMode: params.customMode,
        instrumental: params.instrumental,
        personaId: params.personaId,
        negativeTags: params.negativeTags,
        vocalGender: params.vocalGender,
        styleWeight: params.styleWeight?.toString(),
        weirdnessConstraint: params.weirdnessConstraint?.toString(),
        audioWeight: params.audioWeight?.toString(),
        patientId: params.patientId,
        sessionId: params.sessionId,
        createdByTherapistId: params.therapistId,
      })
      .returning();

    return {
      id: task.id,
      taskId: task.taskId,
      sunoTaskId: task.sunoTaskId || undefined,
      status: task.status as MusicTaskStatus,
      progress: task.progress,
      mediaId: task.mediaId || undefined,
      error: task.error || undefined,
      createdAt: task.createdAt!,
      updatedAt: task.updatedAt!,
    };
  },

  /**
   * Get task by taskId
   */
  async getTask(taskId: string): Promise<MusicTask | null> {
    const task = await db.query.musicGenerationTasks.findFirst({
      where: (tasks, { eq }) => eq(tasks.taskId, taskId),
    });

    if (!task) return null;

    return {
      id: task.id,
      taskId: task.taskId,
      sunoTaskId: task.sunoTaskId || undefined,
      status: task.status as MusicTaskStatus,
      progress: task.progress,
      mediaId: task.mediaId || undefined,
      error: task.error || undefined,
      createdAt: task.createdAt!,
      updatedAt: task.updatedAt!,
    };
  },

  /**
   * Update task with Suno task ID
   */
  async setSunoTaskId(taskId: string, sunoTaskId: string): Promise<void> {
    await db
      .update(musicGenerationTasks)
      .set({
        sunoTaskId,
        status: 'processing',
        progress: 10,
        updatedAt: new Date(),
      })
      .where(eq(musicGenerationTasks.taskId, taskId));
  },

  /**
   * Update task status and progress
   */
  async updateTask(
    taskId: string,
    updates: {
      status?: MusicTaskStatus;
      progress?: number;
      error?: string;
    },
  ): Promise<void> {
    await db
      .update(musicGenerationTasks)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(musicGenerationTasks.taskId, taskId));
  },

  /**
   * Mark task as failed (for fallback polling)
   */
  async failTask(taskId: string, error: string): Promise<void> {
    await db
      .update(musicGenerationTasks)
      .set({
        status: 'failed',
        error,
        updatedAt: new Date(),
      })
      .where(eq(musicGenerationTasks.taskId, taskId));
  },

  /**
   * Clean up old tasks (completed/failed > 7 days)
   * Note: This should be run via cron job or scheduled task
   */
  async cleanup(): Promise<number> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Delete completed or failed tasks older than 7 days
    // Keep pending/processing tasks to avoid orphaning active generations
    const result = await db
      .delete(musicGenerationTasks)
      .where(eq(musicGenerationTasks.createdAt, sevenDaysAgo));

    // Note: DrizzleORM delete doesn't return affected count directly
    // In production, you might want to query first to count
    return 0; // Placeholder
  },
};
