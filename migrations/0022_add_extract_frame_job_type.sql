-- Add extract_frame to job_type enum
ALTER TYPE "job_type" ADD VALUE IF NOT EXISTS 'extract_frame';
