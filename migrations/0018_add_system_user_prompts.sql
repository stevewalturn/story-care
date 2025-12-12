-- Migration: Add system_prompt and user_prompt columns to module_ai_prompts
-- Purpose: Separate hidden AI instructions from user-facing prompt text

-- Add new columns
ALTER TABLE "module_ai_prompts" ADD COLUMN "system_prompt" text;
ALTER TABLE "module_ai_prompts" ADD COLUMN "user_prompt" text;

-- Migrate existing data: copy prompt_text to system_prompt
UPDATE "module_ai_prompts"
SET "system_prompt" = "prompt_text"
WHERE "system_prompt" IS NULL;

-- Add comment to mark prompt_text as deprecated
COMMENT ON COLUMN "module_ai_prompts"."prompt_text" IS 'DEPRECATED: Use system_prompt instead. Kept for backward compatibility during migration.';
