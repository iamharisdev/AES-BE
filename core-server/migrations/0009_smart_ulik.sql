ALTER TABLE "current_pregnancy" ADD COLUMN "last_menstruation" text;--> statement-breakpoint
ALTER TABLE "current_pregnancy" ADD COLUMN "regular_menstruation" text;--> statement-breakpoint
ALTER TABLE "patient" DROP COLUMN IF EXISTS "last_menstruation";--> statement-breakpoint
ALTER TABLE "patient" DROP COLUMN IF EXISTS "regular_menstruation";