ALTER TABLE "current_pregnancy" DROP COLUMN IF EXISTS "fetal_movements";--> statement-breakpoint
ALTER TABLE "current_pregnancy" DROP COLUMN IF EXISTS "anomaly_scan_results";--> statement-breakpoint
ALTER TABLE "current_pregnancy" DROP COLUMN IF EXISTS "antenatal_visits";--> statement-breakpoint
ALTER TABLE "current_pregnancy" DROP COLUMN IF EXISTS "glucose_screening";--> statement-breakpoint
ALTER TABLE "current_pregnancy" DROP COLUMN IF EXISTS "blood_pressure_monitoring";--> statement-breakpoint
ALTER TABLE "personal_history" DROP COLUMN IF EXISTS "living_situation";--> statement-breakpoint
ALTER TABLE "personal_history" DROP COLUMN IF EXISTS "financial_situation";--> statement-breakpoint
ALTER TABLE "personal_history" DROP COLUMN IF EXISTS "monthly_income";