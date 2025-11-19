-- Add output_type column to module_ai_prompts table
ALTER TABLE module_ai_prompts ADD COLUMN output_type VARCHAR(50) DEFAULT 'text';
