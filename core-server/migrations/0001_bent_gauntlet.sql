DO $$ BEGIN
 CREATE TYPE "public"."section_status" AS ENUM('incomplete', 'complete');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "emr_section_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"section" text NOT NULL,
	"status" "section_status" DEFAULT 'incomplete' NOT NULL,
	"answered_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"skipped_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_question_id" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "files" DROP CONSTRAINT "files_emr_id_emr_id_fk";
--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "patient_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "emr_section_progress" ADD CONSTRAINT "emr_section_progress_emr_id_emr_id_fk" FOREIGN KEY ("emr_id") REFERENCES "public"."emr"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "files" ADD CONSTRAINT "files_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "files" DROP COLUMN IF EXISTS "emr_id";