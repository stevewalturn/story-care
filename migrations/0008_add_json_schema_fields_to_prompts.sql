-- Add JSON schema fields to module_ai_prompts table
ALTER TABLE module_ai_prompts
  ADD COLUMN json_schema JSONB,
  ADD COLUMN schema_type VARCHAR(50);

-- Add comment for clarity
COMMENT ON COLUMN module_ai_prompts.json_schema IS 'JSON schema definition for structured outputs';
COMMENT ON COLUMN module_ai_prompts.schema_type IS 'Type of JSON schema: scene_card, music_generation, scene_suggestions, image_references, etc.';
