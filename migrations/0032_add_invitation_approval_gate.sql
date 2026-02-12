-- Add new enum values to user_status
ALTER TYPE "user_status" ADD VALUE IF NOT EXISTS 'pending_approval' BEFORE 'invited';
ALTER TYPE "user_status" ADD VALUE IF NOT EXISTS 'rejected' BEFORE 'deleted';

-- Add invitation approval tracking columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "invited_by" uuid;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "approved_by" uuid;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "approved_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rejected_by" uuid;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rejected_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rejection_reason" text;
