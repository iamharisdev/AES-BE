ALTER TABLE "proposed_plan" DROP CONSTRAINT "proposed_plan_emr_id_visits_id_fk";
--> statement-breakpoint
ALTER TABLE "proposed_plan" DROP COLUMN IF EXISTS "emr_id";