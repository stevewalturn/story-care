-- Migration: Make email nullable in users table
-- This allows creating patients without email addresses

ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;
