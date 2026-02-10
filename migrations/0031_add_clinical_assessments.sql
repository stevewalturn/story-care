-- Migration: Add clinical assessment tables
-- Clinician-facing standardized instruments (PCL-5, HAM-D, PANSS, BAM, OASIS)
-- for tracking patient progress through therapy

-- Enums
DO $$ BEGIN
  CREATE TYPE "instrument_type" AS ENUM('ptsd', 'depression', 'schizophrenia', 'substance_use', 'anxiety', 'enrollment', 'general');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "assessment_timepoint" AS ENUM('screening', 'baseline', 'mid_treatment', 'post_treatment', 'follow_up_1m', 'follow_up_3m', 'follow_up_6m', 'follow_up_12m', 'other');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "assessment_session_status" AS ENUM('in_progress', 'completed', 'abandoned');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "instrument_status" AS ENUM('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "assessment_item_type" AS ENUM('likert', 'multi_choice', 'open_text', 'select', 'number', 'date');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Assessment Instruments (form definitions)
CREATE TABLE "assessment_instruments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(50) NOT NULL,
  "full_name" varchar(255) NOT NULL,
  "instrument_type" "instrument_type" NOT NULL,
  "description" text,
  "instructions" text,
  "scale_min" integer NOT NULL DEFAULT 0,
  "scale_max" integer NOT NULL DEFAULT 4,
  "scale_labels" jsonb,
  "scoring_method" varchar(50) NOT NULL DEFAULT 'sum',
  "total_score_range" jsonb,
  "subscales" jsonb,
  "clinical_cutoffs" jsonb,
  "item_count" integer NOT NULL DEFAULT 0,
  "status" "instrument_status" NOT NULL DEFAULT 'active',
  "created_by" uuid REFERENCES "users"("id"),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Assessment Instrument Items (individual questions)
CREATE TABLE "assessment_instrument_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "instrument_id" uuid NOT NULL REFERENCES "assessment_instruments"("id") ON DELETE CASCADE,
  "item_number" integer NOT NULL,
  "question_text" text NOT NULL,
  "item_type" "assessment_item_type" NOT NULL DEFAULT 'likert',
  "scale_min" integer,
  "scale_max" integer,
  "scale_labels" jsonb,
  "options" jsonb,
  "is_reverse_scored" boolean NOT NULL DEFAULT false,
  "subscale_name" varchar(100),
  "is_required" boolean NOT NULL DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "assessment_items_instrument_idx" ON "assessment_instrument_items" ("instrument_id");
CREATE INDEX "assessment_items_number_idx" ON "assessment_instrument_items" ("instrument_id", "item_number");

-- Assessment Sessions (administration of instrument to patient)
CREATE TABLE "assessment_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "patient_id" uuid NOT NULL REFERENCES "users"("id"),
  "therapist_id" uuid NOT NULL REFERENCES "users"("id"),
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id"),
  "instrument_id" uuid NOT NULL REFERENCES "assessment_instruments"("id"),
  "timepoint" "assessment_timepoint" NOT NULL,
  "status" "assessment_session_status" NOT NULL DEFAULT 'in_progress',
  "total_score" decimal(10, 2),
  "subscale_scores" jsonb,
  "percent_complete" integer NOT NULL DEFAULT 0,
  "last_item_number" integer DEFAULT 0,
  "session_id" uuid REFERENCES "sessions"("id"),
  "clinician_notes" text,
  "completed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "assessment_sessions_patient_idx" ON "assessment_sessions" ("patient_id");
CREATE INDEX "assessment_sessions_therapist_idx" ON "assessment_sessions" ("therapist_id");
CREATE INDEX "assessment_sessions_org_idx" ON "assessment_sessions" ("organization_id");
CREATE INDEX "assessment_sessions_instrument_idx" ON "assessment_sessions" ("instrument_id");
CREATE INDEX "assessment_sessions_status_idx" ON "assessment_sessions" ("status");

-- Assessment Responses (individual item answers)
CREATE TABLE "assessment_responses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL REFERENCES "assessment_sessions"("id") ON DELETE CASCADE,
  "item_id" uuid NOT NULL REFERENCES "assessment_instrument_items"("id"),
  "response_numeric" integer,
  "response_text" text,
  "response_value" varchar(255),
  "scored_value" decimal(10, 2),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "assessment_response_session_item" UNIQUE("session_id", "item_id")
);

CREATE INDEX "assessment_responses_session_idx" ON "assessment_responses" ("session_id");
