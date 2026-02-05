-- Add AI model management enums and table
-- Migration: 0027_add_ai_models.sql

-- Create enums for AI model management
DO $$ BEGIN
    CREATE TYPE model_category AS ENUM (
        'text_to_image',
        'image_to_image',
        'image_to_text',
        'text_to_text',
        'text_to_video',
        'image_to_video',
        'music_generation',
        'transcription'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE model_status AS ENUM (
        'active',
        'hidden',
        'deprecated',
        'disabled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE pricing_unit AS ENUM (
        'per_image',
        'per_second',
        'per_minute',
        'per_1k_tokens',
        'per_request'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create ai_models table
CREATE TABLE IF NOT EXISTS "ai_models" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "model_id" varchar(100) UNIQUE NOT NULL,
    "display_name" varchar(255) NOT NULL,
    "description" text,
    "category" model_category NOT NULL,
    "provider" varchar(100) NOT NULL,
    "provider_group" varchar(100),
    "status" model_status DEFAULT 'active' NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "cost_per_unit" numeric(10, 6),
    "pricing_unit" pricing_unit,
    "capabilities" jsonb DEFAULT '{}'::jsonb,
    "api_model_id" varchar(255),
    "api_provider" varchar(100),
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "ai_models_category_idx" ON "ai_models" ("category");
CREATE INDEX IF NOT EXISTS "ai_models_status_idx" ON "ai_models" ("status");
CREATE INDEX IF NOT EXISTS "ai_models_provider_idx" ON "ai_models" ("provider");
