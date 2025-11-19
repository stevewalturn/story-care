-- Migration: Remove Survey Bundle and Add Multi-Select Template Support
-- Drop old single-template columns and boolean flags
-- Add new array columns for multiple template selection

-- Drop old columns from treatment_modules
ALTER TABLE "treatment_modules" DROP COLUMN IF EXISTS "reflection_template_id";
ALTER TABLE "treatment_modules" DROP COLUMN IF EXISTS "survey_template_id";
ALTER TABLE "treatment_modules" DROP COLUMN IF EXISTS "use_reflection_template";
ALTER TABLE "treatment_modules" DROP COLUMN IF EXISTS "use_survey_template";
ALTER TABLE "treatment_modules" DROP COLUMN IF EXISTS "reflection_questions";

-- Add new array columns for multi-select templates
ALTER TABLE "treatment_modules" ADD COLUMN "reflection_template_ids" uuid[] DEFAULT '{}' NOT NULL;
ALTER TABLE "treatment_modules" ADD COLUMN "survey_template_ids" uuid[] DEFAULT '{}' NOT NULL;

-- Note: Survey Bundle (surveyBundle in ai_prompt_metadata JSONB) will be removed at application layer
-- No database changes needed for JSONB field cleanup
