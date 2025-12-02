-- Migration: Add building blocks support to module_ai_prompts table
-- This enables the new form-based prompt builder while maintaining backward compatibility

-- Add blocks column to store BlockInstance[] as JSONB
ALTER TABLE module_ai_prompts
ADD COLUMN IF NOT EXISTS blocks JSONB DEFAULT NULL;

-- Add flag to indicate whether prompt uses building blocks or advanced JSON mode
ALTER TABLE module_ai_prompts
ADD COLUMN IF NOT EXISTS use_advanced_mode BOOLEAN DEFAULT FALSE;

-- Set all existing prompts with jsonSchema to advanced mode (preserves current behavior)
UPDATE module_ai_prompts
SET use_advanced_mode = TRUE
WHERE json_schema IS NOT NULL AND use_advanced_mode IS FALSE;

-- Add GIN index on blocks column for faster JSONB queries
CREATE INDEX IF NOT EXISTS idx_module_ai_prompts_blocks
ON module_ai_prompts USING GIN (blocks);

-- Add comment to blocks column
COMMENT ON COLUMN module_ai_prompts.blocks IS 'Array of BlockInstance objects for form-based prompt builder';

-- Add comment to use_advanced_mode column
COMMENT ON COLUMN module_ai_prompts.use_advanced_mode IS 'True if prompt uses advanced JSON mode, false if using building blocks';
