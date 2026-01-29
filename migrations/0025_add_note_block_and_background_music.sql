-- Add 'note' to block_type enum
ALTER TYPE "block_type" ADD VALUE IF NOT EXISTS 'note';

-- Add background music fields to story_pages
ALTER TABLE "story_pages" ADD COLUMN "background_music_url" text;
ALTER TABLE "story_pages" ADD COLUMN "background_music_media_id" uuid REFERENCES "media_library"("id");
