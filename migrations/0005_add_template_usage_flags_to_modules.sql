-- Migration: Add template usage flags to treatment_modules table
-- This allows modules to toggle between using custom questions (JSONB array)
-- or referencing reusable templates

ALTER TABLE treatment_modules
  ADD COLUMN IF NOT EXISTS use_reflection_template BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS use_survey_template BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN treatment_modules.use_reflection_template IS 'If true, use reflectionTemplateId; if false, use reflectionQuestions JSONB array';
COMMENT ON COLUMN treatment_modules.use_survey_template IS 'If true, use surveyTemplateId; if false, use custom survey questions';
