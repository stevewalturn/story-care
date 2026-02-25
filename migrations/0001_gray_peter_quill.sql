CREATE TYPE "public"."note_status" AS ENUM('draft', 'locked');--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "status" "note_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "locked_at" timestamp;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "locked_by" uuid;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_locked_by_users_id_fk" FOREIGN KEY ("locked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;