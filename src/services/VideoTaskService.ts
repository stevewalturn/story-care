// Video Generation Task Service
// Shared in-memory task storage for video generation
// Note: In production, replace with Redis or database for persistence

export type VideoTask = {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  mediaId?: string;
  error?: string;
  createdAt: Date;
};

// Singleton task storage
const videoTasks = new Map<string, VideoTask>();

// Export task management functions
export const VideoTaskService = {
  /**
   * Create a new video generation task
   */
  createTask(taskId: string): VideoTask {
    const task: VideoTask = {
      taskId,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
    };
    videoTasks.set(taskId, task);
    return task;
  },

  /**
   * Get task by ID
   */
  getTask(taskId: string): VideoTask | undefined {
    return videoTasks.get(taskId);
  },

  /**
   * Update task status and progress
   */
  updateTask(taskId: string, updates: Partial<Omit<VideoTask, 'taskId' | 'createdAt'>>): void {
    const task = videoTasks.get(taskId);
    if (task) {
      Object.assign(task, updates);
      videoTasks.set(taskId, task);
    }
  },

  /**
   * Mark task as completed with media ID
   */
  completeTask(taskId: string, mediaId: string): void {
    const task = videoTasks.get(taskId);
    if (task) {
      task.status = 'completed';
      task.progress = 100;
      task.mediaId = mediaId;
      videoTasks.set(taskId, task);
    }
  },

  /**
   * Mark task as failed with error message
   */
  failTask(taskId: string, error: string): void {
    const task = videoTasks.get(taskId);
    if (task) {
      task.status = 'failed';
      task.error = error;
      videoTasks.set(taskId, task);
    }
  },

  /**
   * Delete task by ID
   */
  deleteTask(taskId: string): void {
    videoTasks.delete(taskId);
  },

  /**
   * Clean up old tasks (> 1 hour)
   */
  cleanup(): number {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    let deletedCount = 0;
    for (const [taskId, task] of videoTasks.entries()) {
      if (task.createdAt < oneHourAgo) {
        videoTasks.delete(taskId);
        deletedCount++;
      }
    }
    return deletedCount;
  },

  /**
   * Get all task IDs (for debugging)
   */
  getAllTaskIds(): string[] {
    return Array.from(videoTasks.keys());
  },
};

// Automatic cleanup every 5 minutes
if (typeof window === 'undefined') {
  // Server-side only
  setInterval(() => {
    const deletedCount = VideoTaskService.cleanup();
    if (deletedCount > 0) {
      console.log(`[VideoTaskService] Cleaned up ${deletedCount} expired tasks`);
    }
  }, 5 * 60 * 1000);
}
