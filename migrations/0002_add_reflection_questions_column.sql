-- Migration: Add reflection_questions column for post-session patient reflection
-- Purpose: Separate in-session questions (therapist) from reflection questions (patient story pages)

ALTER TABLE "treatment_modules"
ADD COLUMN "reflection_questions" JSONB DEFAULT '[]'::jsonb;

-- Set default empty arrays for existing modules
UPDATE "treatment_modules"
SET "reflection_questions" = '[]'::jsonb
WHERE "reflection_questions" IS NULL;
