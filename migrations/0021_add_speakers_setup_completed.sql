-- Add speakers_setup_completed column to sessions table
ALTER TABLE "sessions" ADD COLUMN "speakers_setup_completed" boolean DEFAULT false;

-- Migrate existing sessions: mark sessions with summaries as having completed speaker setup
UPDATE "sessions"
SET "speakers_setup_completed" = true
WHERE "session_summary" IS NOT NULL;
