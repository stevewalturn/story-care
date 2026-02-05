-- Add dismissedAt column to music_generation_tasks for persisting dismissed notifications
ALTER TABLE "music_generation_tasks" ADD COLUMN "dismissed_at" timestamp;
