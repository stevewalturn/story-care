-- Remove schema_type column from module_ai_prompts table
-- This field is no longer needed - only outputType (text/json) and optional jsonSchema are used
ALTER TABLE module_ai_prompts
  DROP COLUMN IF EXISTS schema_type;

-- Remove schema_type column from ai_chat_messages table
-- This field is no longer needed for JSON messages
ALTER TABLE ai_chat_messages
  DROP COLUMN IF EXISTS schema_type;
