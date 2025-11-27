-- Make patient_id nullable in media_library to support group session media
ALTER TABLE "media_library" ALTER COLUMN "patient_id" DROP NOT NULL;
