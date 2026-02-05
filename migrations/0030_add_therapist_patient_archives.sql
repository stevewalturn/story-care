-- Migration: Add therapist_patient_archives table
-- Per-therapist patient visibility - allows therapists to hide patients from
-- their personal view without affecting other users or deleting the patient

CREATE TABLE "therapist_patient_archives" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "therapist_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "patient_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "archived_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "therapist_patient_archive_unique" UNIQUE("therapist_id", "patient_id")
);

CREATE INDEX "therapist_patient_archives_therapist_idx" ON "therapist_patient_archives" ("therapist_id");
CREATE INDEX "therapist_patient_archives_patient_idx" ON "therapist_patient_archives" ("patient_id");
