-- Migration: Seed platform settings with default configuration
-- This ensures the email invitation system has proper configuration

INSERT INTO platform_settings (
  id,
  platform_name,
  support_email,
  default_ai_credits,
  image_gen_model,
  default_storage_quota,
  max_file_upload_size,
  require_email_verification,
  enable_mfa_for_admins,
  session_timeout,
  email_from_name,
  email_from_address,
  email_footer_text,
  smtp_provider,
  enable_email_notifications,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'StoryCare',
  'support@storycare.health',
  1000,
  'dall-e-3',
  10737418240, -- 10GB in bytes
  524288000,   -- 500MB in bytes
  true,
  true,
  15,
  'StoryCare',
  'notifications@storycare.health',
  'You received this because you are a user in the StoryCare platform.',
  'paubox',
  true, -- CRITICAL: Enable email notifications
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- If a row already exists (unlikely), update it to ensure emails are enabled
UPDATE platform_settings
SET
  enable_email_notifications = true,
  email_from_name = 'StoryCare',
  email_from_address = 'notifications@storycare.health',
  smtp_provider = 'paubox',
  updated_at = NOW()
WHERE enable_email_notifications IS NULL OR enable_email_notifications = false;
