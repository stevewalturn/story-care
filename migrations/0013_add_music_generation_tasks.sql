-- Create enum for music generation status
CREATE TYPE music_generation_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Create music_generation_tasks table
CREATE TABLE music_generation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id VARCHAR(255) NOT NULL UNIQUE,
  suno_task_id VARCHAR(255),

  status music_generation_status NOT NULL DEFAULT 'pending',
  progress INTEGER NOT NULL DEFAULT 0,

  prompt TEXT,
  style VARCHAR(1000),
  title VARCHAR(100),
  model VARCHAR(50) NOT NULL DEFAULT 'V4_5',
  custom_mode BOOLEAN NOT NULL DEFAULT false,
  instrumental BOOLEAN NOT NULL DEFAULT true,

  persona_id VARCHAR(255),
  negative_tags TEXT,
  vocal_gender VARCHAR(1),
  style_weight DECIMAL(3, 2),
  weirdness_constraint DECIMAL(3, 2),
  audio_weight DECIMAL(3, 2),

  media_id UUID REFERENCES media_library(id),
  audio_url TEXT,
  duration INTEGER,

  error TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,

  patient_id UUID NOT NULL REFERENCES users(id),
  session_id UUID REFERENCES sessions(id),
  created_by_therapist_id UUID NOT NULL REFERENCES users(id),

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_music_tasks_task_id ON music_generation_tasks(task_id);
CREATE INDEX idx_music_tasks_suno_task_id ON music_generation_tasks(suno_task_id);
CREATE INDEX idx_music_tasks_status ON music_generation_tasks(status);
CREATE INDEX idx_music_tasks_created_at ON music_generation_tasks(created_at);
CREATE INDEX idx_music_tasks_patient_id ON music_generation_tasks(patient_id);
CREATE INDEX idx_music_tasks_therapist_id ON music_generation_tasks(created_by_therapist_id);
