-- Migration: Remove multiple choice support from reflection questions
-- Purpose: Reflection questions should only provide qualitative data (open_text, scale, emotion)
-- Multiple choice remains available for survey questions only

-- Step 1: Create new enum types for reflection and survey questions
CREATE TYPE "reflection_question_type" AS ENUM('open_text', 'scale', 'emotion');
CREATE TYPE "survey_question_type" AS ENUM('open_text', 'multiple_choice', 'scale', 'emotion');

-- Step 2: Delete any existing reflection questions that are multiple_choice type
-- (These should not exist, but this ensures data consistency)
DELETE FROM "reflection_questions"
WHERE "question_type" = 'multiple_choice';

-- Step 3: Add temporary column with new enum type for reflection questions
ALTER TABLE "reflection_questions"
ADD COLUMN "question_type_new" "reflection_question_type";

-- Step 4: Copy data from old column to new column (casting is safe as we deleted multiple_choice)
UPDATE "reflection_questions"
SET "question_type_new" = "question_type"::text::"reflection_question_type";

-- Step 5: Drop old column and rename new column
ALTER TABLE "reflection_questions"
DROP COLUMN "question_type";

ALTER TABLE "reflection_questions"
RENAME COLUMN "question_type_new" TO "question_type";

-- Step 6: Set NOT NULL constraint and default value
ALTER TABLE "reflection_questions"
ALTER COLUMN "question_type" SET NOT NULL,
ALTER COLUMN "question_type" SET DEFAULT 'open_text';

-- Step 7: Remove options column from reflection_questions (no longer needed)
ALTER TABLE "reflection_questions"
DROP COLUMN IF EXISTS "options";

-- Step 8: Update survey_questions to use new survey_question_type enum
ALTER TABLE "survey_questions"
ADD COLUMN "question_type_new" "survey_question_type";

-- Step 9: Copy data from old column to new column for survey questions
UPDATE "survey_questions"
SET "question_type_new" = "question_type"::text::"survey_question_type";

-- Step 10: Drop old column and rename new column for survey questions
ALTER TABLE "survey_questions"
DROP COLUMN "question_type";

ALTER TABLE "survey_questions"
RENAME COLUMN "question_type_new" TO "question_type";

-- Step 11: Set NOT NULL constraint for survey questions
ALTER TABLE "survey_questions"
ALTER COLUMN "question_type" SET NOT NULL;

-- Note: The old 'question_type' enum is kept for backward compatibility
-- with existing code. It can be removed in a future migration after all
-- references have been updated.
