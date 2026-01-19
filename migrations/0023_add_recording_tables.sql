-- Add recording enums and tables for voice recording feature
-- Supports direct recording and shareable recording links

-- Create enums for recording feature
CREATE TYPE "recording_source" AS ENUM ('direct', 'share_link');
CREATE TYPE "uploaded_recording_status" AS ENUM ('recording', 'uploading', 'completed', 'failed', 'used');
CREATE TYPE "recording_link_status" AS ENUM ('pending', 'recording', 'completed', 'expired', 'revoked');

-- Create recording_links table (shareable links for mobile recording)
CREATE TABLE IF NOT EXISTS "recording_links" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "token" varchar(64) NOT NULL UNIQUE,
  "session_title" varchar(255),
  "session_date" timestamp,
  "patient_ids" uuid[],
  "notes" text,
  "therapist_id" uuid NOT NULL REFERENCES "users"("id"),
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id"),
  "status" "recording_link_status" NOT NULL DEFAULT 'pending',
  "expires_at" timestamp NOT NULL,
  "expiry_duration_minutes" integer NOT NULL,
  "access_count" integer NOT NULL DEFAULT 0,
  "last_accessed_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Create uploaded_recordings table (stores all recordings - direct + via link)
CREATE TABLE IF NOT EXISTS "uploaded_recordings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "source" "recording_source" NOT NULL,
  "recording_link_id" uuid REFERENCES "recording_links"("id") ON DELETE SET NULL,
  "therapist_id" uuid NOT NULL REFERENCES "users"("id"),
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id"),
  "title" varchar(255),
  "recorded_at" timestamp,
  "audio_chunks" jsonb DEFAULT '[]',
  "final_audio_url" text,
  "total_duration_seconds" integer,
  "total_file_size_bytes" bigint,
  "status" "uploaded_recording_status" NOT NULL DEFAULT 'recording',
  "session_id" uuid REFERENCES "sessions"("id") ON DELETE SET NULL,
  "device_info" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Create indexes for uploaded_recordings
CREATE INDEX IF NOT EXISTS "uploaded_recordings_therapist_id_idx" ON "uploaded_recordings" ("therapist_id");
CREATE INDEX IF NOT EXISTS "uploaded_recordings_status_idx" ON "uploaded_recordings" ("status");
CREATE INDEX IF NOT EXISTS "uploaded_recordings_recording_link_id_idx" ON "uploaded_recordings" ("recording_link_id");

-- Add comments
COMMENT ON TABLE "recording_links" IS 'Shareable links for mobile recording - allows external users to record audio via a link';
COMMENT ON TABLE "uploaded_recordings" IS 'Stores all uploaded recordings from direct recording or via shareable links';
COMMENT ON COLUMN "uploaded_recordings"."audio_chunks" IS 'Array of {chunkIndex, gcsPath, durationSeconds, sizeBytes, uploadedAt} for chunked uploads';
COMMENT ON COLUMN "uploaded_recordings"."device_info" IS 'Device information: {userAgent, platform, browser}';
