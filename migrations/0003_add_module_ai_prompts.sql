-- Migration: Add module_ai_prompts and module_prompt_links tables
-- Date: 2025-11-13
-- Description: Create reusable AI prompt templates and link them to treatment modules

-- ============================================================================
-- MODULE AI PROMPTS TABLE
-- ============================================================================
-- Stores reusable AI prompt templates that can be linked to treatment modules

CREATE TABLE IF NOT EXISTS module_ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Prompt Details
  name VARCHAR(255) NOT NULL,
  prompt_text TEXT NOT NULL,
  description TEXT,

  -- Classification
  category VARCHAR(100) NOT NULL, -- 'analysis', 'creative', 'extraction', 'reflection'
  icon VARCHAR(50) DEFAULT 'sparkles', -- Icon name for UI (e.g., 'sparkles', 'target', 'lightbulb')

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Audit
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add index on category for filtering
CREATE INDEX idx_module_ai_prompts_category ON module_ai_prompts(category);

-- Add index on is_active for filtering
CREATE INDEX idx_module_ai_prompts_is_active ON module_ai_prompts(is_active);

-- ============================================================================
-- MODULE PROMPT LINKS TABLE (Junction Table)
-- ============================================================================
-- Links treatment modules to their AI prompts (many-to-many relationship)

CREATE TABLE IF NOT EXISTS module_prompt_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  module_id UUID NOT NULL REFERENCES treatment_modules(id) ON DELETE CASCADE,
  prompt_id UUID NOT NULL REFERENCES module_ai_prompts(id) ON DELETE CASCADE,

  -- Display order in UI
  sort_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add indexes for foreign keys
CREATE INDEX idx_module_prompt_links_module_id ON module_prompt_links(module_id);
CREATE INDEX idx_module_prompt_links_prompt_id ON module_prompt_links(prompt_id);

-- Add unique constraint to prevent duplicate links
CREATE UNIQUE INDEX idx_module_prompt_links_unique ON module_prompt_links(module_id, prompt_id);

-- Add index on sort_order for efficient ordering
CREATE INDEX idx_module_prompt_links_sort_order ON module_prompt_links(module_id, sort_order);

-- ============================================================================
-- COMMENTS (for documentation)
-- ============================================================================

COMMENT ON TABLE module_ai_prompts IS 'Reusable AI prompt templates for analyzing therapy transcripts';
COMMENT ON TABLE module_prompt_links IS 'Junction table linking treatment modules to AI prompts (many-to-many)';

COMMENT ON COLUMN module_ai_prompts.name IS 'Display name of the prompt (e.g., "Self-Resilience Analysis")';
COMMENT ON COLUMN module_ai_prompts.prompt_text IS 'The actual AI prompt instructions';
COMMENT ON COLUMN module_ai_prompts.category IS 'Prompt category: analysis, creative, extraction, reflection';
COMMENT ON COLUMN module_ai_prompts.icon IS 'Icon name for UI display (from icon library)';
COMMENT ON COLUMN module_prompt_links.sort_order IS 'Display order in UI (lower numbers first)';
