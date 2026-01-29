-- Add 'merging' status to uploaded_recording_status enum
ALTER TYPE "uploaded_recording_status" ADD VALUE IF NOT EXISTS 'merging' AFTER 'uploading';

-- Add 'merge_audio_chunks' to job_type enum
ALTER TYPE "job_type" ADD VALUE IF NOT EXISTS 'merge_audio_chunks' AFTER 'extract_frame';
