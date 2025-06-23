DROP TABLE "medical_history";--> statement-breakpoint
ALTER TABLE "red_flags" ADD COLUMN "flag" text;--> statement-breakpoint
ALTER TABLE "red_flags" ADD COLUMN "justification" text;--> statement-breakpoint
ALTER TABLE "red_flags" DROP COLUMN IF EXISTS "symptoms";