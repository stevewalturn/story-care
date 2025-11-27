// Music Generation Task Service
// Shared in-memory task storage for music generation
// Note: In production, replace with Redis or database for persistence

export type MusicTask = {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  mediaId?: string;
  error?: string;
  createdAt: Date;
};

// Singleton task storage
const musicTasks = new Map<string, MusicTask>();

// Export task management functions
export const MusicTaskService = {
  /**
   * Create a new music generation task
   */
  createTask(taskId: string): MusicTask {
    const task: MusicTask = {
      taskId,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
    };
    musicTasks.set(taskId, task);
    return task;
  },

  /**
   * Get task by ID
   */
  getTask(taskId: string): MusicTask | undefined {
    return musicTasks.get(taskId);
  },

  /**
   * Update task status and progress
   */
  updateTask(taskId: string, updates: Partial<Omit<MusicTask, 'taskId' | 'createdAt'>>): void {
    const task = musicTasks.get(taskId);
    if (task) {
      Object.assign(task, updates);
      musicTasks.set(taskId, task);
    }
  },

  /**
   * Mark task as completed with media ID
   */
  completeTask(taskId: string, mediaId: string): void {
    const task = musicTasks.get(taskId);
    if (task) {
      task.status = 'completed';
      task.progress = 100;
      task.mediaId = mediaId;
      musicTasks.set(taskId, task);
    }
  },

  /**
   * Mark task as failed with error message
   */
  failTask(taskId: string, error: string): void {
    const task = musicTasks.get(taskId);
    if (task) {
      task.status = 'failed';
      task.error = error;
      musicTasks.set(taskId, task);
    }
  },

  /**
   * Delete task by ID
   */
  deleteTask(taskId: string): void {
    musicTasks.delete(taskId);
  },

  /**
   * Clean up old tasks (> 1 hour)
   */
  cleanup(): number {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    let deletedCount = 0;
    for (const [taskId, task] of musicTasks.entries()) {
      if (task.createdAt < oneHourAgo) {
        musicTasks.delete(taskId);
        deletedCount++;
      }
    }
    return deletedCount;
  },

  /**
   * Get all task IDs (for debugging)
   */
  getAllTaskIds(): string[] {
    return Array.from(musicTasks.keys());
  },
};

// Automatic cleanup every 5 minutes
if (typeof window === 'undefined') {
  // Server-side only
  setInterval(() => {
    const deletedCount = MusicTaskService.cleanup();
    if (deletedCount > 0) {
      console.log(`[MusicTaskService] Cleaned up ${deletedCount} expired tasks`);
    }
  }, 5 * 60 * 1000);
}
