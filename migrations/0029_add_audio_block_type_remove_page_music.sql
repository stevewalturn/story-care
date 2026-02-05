-- Migration: Convert music from page-level to content block
-- This migration adds 'audio' to the block_type enum and removes
-- page-level background music fields from story_pages table.

-- Add 'audio' to block_type enum
ALTER TYPE block_type ADD VALUE IF NOT EXISTS 'audio';

-- Drop page-level music columns from story_pages
-- Note: Existing data in these columns will be lost per user request
ALTER TABLE story_pages DROP COLUMN IF EXISTS background_music_url;
ALTER TABLE story_pages DROP COLUMN IF EXISTS background_music_media_id;
