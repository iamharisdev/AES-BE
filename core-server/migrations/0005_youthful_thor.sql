ALTER TABLE "diagnostics" ALTER COLUMN "visit_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "diagnostics" ADD COLUMN "patient_id" uuid NOT NULL;