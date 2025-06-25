ALTER TABLE "obs_history" ALTER COLUMN "previous_pregnancies" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "obs_history" ALTER COLUMN "previous_deliveries" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "patient" ALTER COLUMN "age" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "patient" ALTER COLUMN "married_years" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "patient" ALTER COLUMN "pregnancy_months" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "vitals" ALTER COLUMN "pulse" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "vitals" ALTER COLUMN "temperature" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "vitals" ALTER COLUMN "weight" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "vitals" ALTER COLUMN "height" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "vitals" ALTER COLUMN "bmi" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "patient" DROP COLUMN IF EXISTS "gender";--> statement-breakpoint
ALTER TABLE "patient" DROP COLUMN IF EXISTS "address";