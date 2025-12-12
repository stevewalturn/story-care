-- Migration: Restrict reflection questions to open_text only
-- Purpose: Simplify reflection questions to only support open-ended text responses
-- Converts all existing scale and emotion type questions to open_text

-- Step 1: Convert all existing scale and emotion reflection questions to open_text
UPDATE "reflection_questions"
SET "question_type" = 'open_text'
WHERE "question_type" IN ('scale', 'emotion');

-- Step 2: Drop the old reflection_question_type enum
DROP TYPE IF EXISTS "reflection_question_type" CASCADE;

-- Step 3: Create new reflection_question_type enum with only open_text
CREATE TYPE "reflection_question_type" AS ENUM('open_text');

-- Step 4: Add temporary column with new enum type
ALTER TABLE "reflection_questions"
ADD COLUMN "question_type_new" "reflection_question_type";

-- Step 5: Set all values to open_text (safe since we converted everything in Step 1)
UPDATE "reflection_questions"
SET "question_type_new" = 'open_text';

-- Step 6: Drop old column and rename new column
ALTER TABLE "reflection_questions"
DROP COLUMN "question_type";

ALTER TABLE "reflection_questions"
RENAME COLUMN "question_type_new" TO "question_type";

-- Step 7: Set NOT NULL constraint and default value
ALTER TABLE "reflection_questions"
ALTER COLUMN "question_type" SET NOT NULL,
ALTER COLUMN "question_type" SET DEFAULT 'open_text';

-- Note: This migration ensures all reflection questions only support open text responses
-- Survey questions continue to support all question types (open_text, multiple_choice, scale, emotion)
