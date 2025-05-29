ALTER TABLE "presenting_complaint" ADD COLUMN "problem" text NOT NULL;--> statement-breakpoint
ALTER TABLE "presenting_complaint" ADD COLUMN "detail" text;--> statement-breakpoint
ALTER TABLE "presenting_complaint" DROP COLUMN IF EXISTS "primary_symptom";--> statement-breakpoint
ALTER TABLE "presenting_complaint" DROP COLUMN IF EXISTS "symptom_duration";--> statement-breakpoint
ALTER TABLE "presenting_complaint" DROP COLUMN IF EXISTS "symptom_severity";--> statement-breakpoint
ALTER TABLE "presenting_complaint" DROP COLUMN IF EXISTS "related_symptoms";