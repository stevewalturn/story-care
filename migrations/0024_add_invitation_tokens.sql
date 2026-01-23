-- Add invitation token fields to users table
-- These fields support secure token-based invitation flow (replacing Firebase email verification)

ALTER TABLE "users" ADD COLUMN "invitation_token" varchar(64) UNIQUE;
ALTER TABLE "users" ADD COLUMN "invitation_token_expires_at" timestamp;
ALTER TABLE "users" ADD COLUMN "invitation_sent_at" timestamp;

-- Create index for faster token lookups
CREATE INDEX "idx_users_invitation_token" ON "users" ("invitation_token");
