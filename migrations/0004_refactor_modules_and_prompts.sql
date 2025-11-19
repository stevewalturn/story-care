-- Migration: Refactor Modules and Prompts
-- Remove inSessionQuestions from treatment_modules
-- Add scope, organizationId, createdBy, useCount to module_ai_prompts

-- Step 1: Add new columns to module_ai_prompts
ALTER TABLE module_ai_prompts
ADD COLUMN IF NOT EXISTS scope template_scope DEFAULT 'system' NOT NULL,
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS created_by UUID NOT NULL REFERENCES users(id),
ADD COLUMN IF NOT EXISTS use_count INTEGER DEFAULT 0 NOT NULL;

-- Step 2: Remove in_session_questions from treatment_modules
-- Note: This is a destructive operation. Data will be lost.
-- If you need to preserve the data, export it first.
ALTER TABLE treatment_modules
DROP COLUMN IF EXISTS in_session_questions;

-- Step 3: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_module_ai_prompts_scope ON module_ai_prompts(scope);
CREATE INDEX IF NOT EXISTS idx_module_ai_prompts_org ON module_ai_prompts(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_module_ai_prompts_creator ON module_ai_prompts(created_by);
CREATE INDEX IF NOT EXISTS idx_module_ai_prompts_active ON module_ai_prompts(is_active) WHERE is_active = true;
