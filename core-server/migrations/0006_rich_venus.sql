ALTER TABLE "diagnostics" ALTER COLUMN "visit_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "diagnostics" DROP COLUMN IF EXISTS "patient_id";