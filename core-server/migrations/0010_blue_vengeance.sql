CREATE TABLE IF NOT EXISTS "proposed_plan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"general_plan" text,
	"medications" text,
	"instructions" text,
	"next_follow_up_timing" date,
	"next_follow_up_purpose" text,
	"advised_lab_tests" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proposed_plan" ADD CONSTRAINT "proposed_plan_emr_id_emr_id_fk" FOREIGN KEY ("emr_id") REFERENCES "public"."emr"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
