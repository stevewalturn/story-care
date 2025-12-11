-- Create video_processing_jobs table for async video assembly
CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE job_type AS ENUM ('scene_assembly', 'video_generation', 'transcoding');

CREATE TABLE IF NOT EXISTS video_processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Job metadata
  job_type job_type NOT NULL,
  status job_status NOT NULL DEFAULT 'pending',

  -- Resource references
  scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,
  media_id UUID REFERENCES media_library(id) ON DELETE SET NULL,

  -- Job progress
  progress INTEGER NOT NULL DEFAULT 0, -- 0-100
  current_step VARCHAR(255), -- e.g., "Downloading clips", "Encoding video"

  -- Input/Output data
  input_data JSONB, -- Clips, audio tracks, settings
  output_url TEXT, -- Final video URL in GCS
  thumbnail_url TEXT,

  -- Error handling
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,

  -- Cloud Run tracking
  cloud_run_job_id VARCHAR(255), -- Cloud Run execution ID
  cloud_run_log_url TEXT,

  -- Performance metrics
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_seconds INTEGER,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- User tracking
  created_by_user_id UUID REFERENCES users(id),

  -- Indexes for common queries
  CONSTRAINT valid_progress CHECK (progress >= 0 AND progress <= 100),
  CONSTRAINT valid_retry CHECK (retry_count <= max_retries)
);

-- Indexes for efficient queries
CREATE INDEX idx_video_jobs_status ON video_processing_jobs(status);
CREATE INDEX idx_video_jobs_scene_id ON video_processing_jobs(scene_id);
CREATE INDEX idx_video_jobs_created_at ON video_processing_jobs(created_at DESC);
CREATE INDEX idx_video_jobs_user_id ON video_processing_jobs(created_by_user_id);
CREATE INDEX idx_video_jobs_type_status ON video_processing_jobs(job_type, status);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_video_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER video_jobs_updated_at_trigger
  BEFORE UPDATE ON video_processing_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_video_jobs_updated_at();

-- Calculate duration on completion
CREATE OR REPLACE FUNCTION calculate_job_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('completed', 'failed') AND NEW.started_at IS NOT NULL THEN
    NEW.duration_seconds = EXTRACT(EPOCH FROM (COALESCE(NEW.completed_at, CURRENT_TIMESTAMP) - NEW.started_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER video_jobs_duration_trigger
  BEFORE UPDATE ON video_processing_jobs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_job_duration();

-- Comments for documentation
COMMENT ON TABLE video_processing_jobs IS 'Tracks async video processing jobs executed on Cloud Run';
COMMENT ON COLUMN video_processing_jobs.input_data IS 'JSONB containing clips array, audio tracks, and assembly settings';
COMMENT ON COLUMN video_processing_jobs.progress IS 'Processing progress percentage (0-100)';
COMMENT ON COLUMN video_processing_jobs.cloud_run_job_id IS 'Cloud Run execution ID for tracking and logging';
