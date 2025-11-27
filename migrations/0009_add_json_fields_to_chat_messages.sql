-- Add JSON output fields to ai_chat_messages table
ALTER TABLE ai_chat_messages
  ADD COLUMN message_type VARCHAR(50) DEFAULT 'text',
  ADD COLUMN json_data JSONB,
  ADD COLUMN schema_type VARCHAR(50),
  ADD COLUMN action_status VARCHAR(50);

-- Add comments
COMMENT ON COLUMN ai_chat_messages.message_type IS 'Type of message: text, json, system, progress';
COMMENT ON COLUMN ai_chat_messages.json_data IS 'Structured JSON data when message_type is json';
COMMENT ON COLUMN ai_chat_messages.schema_type IS 'Type of JSON schema: scene_card, music_generation, etc.';
COMMENT ON COLUMN ai_chat_messages.action_status IS 'Status of JSON action: pending, processing, completed, failed';
