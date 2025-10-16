ALTER TABLE "proposed_plan" ADD COLUMN "emr_id" uuid NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proposed_plan" ADD CONSTRAINT "proposed_plan_emr_id_visits_id_fk" FOREIGN KEY ("emr_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
