CREATE TABLE IF NOT EXISTS "previous_pregnancy" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"child_age" text,
	"child_gender" text,
	"full_term_birth" text,
	"birth_method" text,
	"birth_place" text,
	"contractions" text,
	"duration_birth" text,
	"operation_reason" text,
	"post_delivery_problems" text,
	"child_condition" text,
	"pregnancy_problems" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "current_pregnancy" ADD COLUMN "pregnancy_detection_method" text;--> statement-breakpoint
ALTER TABLE "current_pregnancy" ADD COLUMN "pregnancy_consent" text;--> statement-breakpoint
ALTER TABLE "current_pregnancy" ADD COLUMN "pregnancy_clinical_findings" text;--> statement-breakpoint
ALTER TABLE "current_pregnancy" ADD COLUMN "urine_test" text;--> statement-breakpoint
ALTER TABLE "current_pregnancy" ADD COLUMN "ultrasound" text;--> statement-breakpoint
ALTER TABLE "current_pregnancy" ADD COLUMN "folic_acid" text;--> statement-breakpoint
ALTER TABLE "current_pregnancy" ADD COLUMN "blood_urine_test" text;--> statement-breakpoint
ALTER TABLE "current_pregnancy" ADD COLUMN "blood_urine_test_types" text;--> statement-breakpoint
ALTER TABLE "current_pregnancy" ADD COLUMN "early_preg_problems" text;--> statement-breakpoint
ALTER TABLE "family_history" ADD COLUMN "current_meds" text;--> statement-breakpoint
ALTER TABLE "family_history" ADD COLUMN "sugar_blood_pressure" text;--> statement-breakpoint
ALTER TABLE "family_history" ADD COLUMN "family_medical_conditions" text;--> statement-breakpoint
ALTER TABLE "family_history" ADD COLUMN "twins_family_history" text;--> statement-breakpoint
ALTER TABLE "gynecological_history" ADD COLUMN "section" text;--> statement-breakpoint
ALTER TABLE "gynecological_history" ADD COLUMN "family_planning" text;--> statement-breakpoint
ALTER TABLE "gynecological_history" ADD COLUMN "family_planning_method" text;--> statement-breakpoint
ALTER TABLE "gynecological_history" ADD COLUMN "pap_smear_test" text;--> statement-breakpoint
ALTER TABLE "personal_history" ADD COLUMN "allergy_status" text;--> statement-breakpoint
ALTER TABLE "personal_history" ADD COLUMN "allergy_type" text;--> statement-breakpoint
ALTER TABLE "personal_history" ADD COLUMN "blood_group" text;--> statement-breakpoint
ALTER TABLE "personal_history" ADD COLUMN "current_weight" text;--> statement-breakpoint
ALTER TABLE "personal_history" ADD COLUMN "substance_use" text;--> statement-breakpoint
ALTER TABLE "personal_history" ADD COLUMN "marital_status" text;--> statement-breakpoint
ALTER TABLE "personal_history" ADD COLUMN "sleep_and_hunger" text;--> statement-breakpoint
ALTER TABLE "personal_history" ADD COLUMN "domestic_abuse" text;--> statement-breakpoint
ALTER TABLE "socio_economic_history" ADD COLUMN "no_family_members" text;--> statement-breakpoint
ALTER TABLE "socio_economic_history" ADD COLUMN "family_type" text;--> statement-breakpoint
ALTER TABLE "socio_economic_history" ADD COLUMN "living_situation" text;--> statement-breakpoint
ALTER TABLE "socio_economic_history" ADD COLUMN "more_info" text;--> statement-breakpoint
ALTER TABLE "surgical_history" ADD COLUMN "past_surgeries" text;--> statement-breakpoint
ALTER TABLE "surgical_history" ADD COLUMN "additional_info" text;--> statement-breakpoint
ALTER TABLE "trimester" ADD COLUMN "fetus_movement" text;--> statement-breakpoint
ALTER TABLE "trimester" ADD COLUMN "ultrasound_5thMonth" text;--> statement-breakpoint
ALTER TABLE "trimester" ADD COLUMN "checkup_regularity" text;--> statement-breakpoint
ALTER TABLE "trimester" ADD COLUMN "hb_level" text;--> statement-breakpoint
ALTER TABLE "trimester" ADD COLUMN "trimester_problems" text;--> statement-breakpoint
ALTER TABLE "trimester" ADD COLUMN "sugar_blood_pressure" text;--> statement-breakpoint
ALTER TABLE "trimester" ADD COLUMN "strength_meds" text;--> statement-breakpoint
ALTER TABLE "trimester" ADD COLUMN "preg_problems" text;--> statement-breakpoint
ALTER TABLE "trimester" ADD COLUMN "additional_info" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "previous_pregnancy" ADD CONSTRAINT "previous_pregnancy_emr_id_emr_id_fk" FOREIGN KEY ("emr_id") REFERENCES "public"."emr"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "current_pregnancy" DROP COLUMN IF EXISTS "lmp";--> statement-breakpoint
ALTER TABLE "current_pregnancy" DROP COLUMN IF EXISTS "edd";--> statement-breakpoint
ALTER TABLE "current_pregnancy" DROP COLUMN IF EXISTS "gravida";--> statement-breakpoint
ALTER TABLE "current_pregnancy" DROP COLUMN IF EXISTS "para";--> statement-breakpoint
ALTER TABLE "current_pregnancy" DROP COLUMN IF EXISTS "abortions";--> statement-breakpoint
ALTER TABLE "current_pregnancy" DROP COLUMN IF EXISTS "live_births";--> statement-breakpoint
ALTER TABLE "family_history" DROP COLUMN IF EXISTS "conditions";--> statement-breakpoint
ALTER TABLE "family_history" DROP COLUMN IF EXISTS "relationship";--> statement-breakpoint
ALTER TABLE "gynecological_history" DROP COLUMN IF EXISTS "menstrual_history";--> statement-breakpoint
ALTER TABLE "gynecological_history" DROP COLUMN IF EXISTS "contraceptive_use";--> statement-breakpoint
ALTER TABLE "gynecological_history" DROP COLUMN IF EXISTS "previous_gynecological_conditions";--> statement-breakpoint
ALTER TABLE "patient" DROP COLUMN IF EXISTS "prev_pregnancies";--> statement-breakpoint
ALTER TABLE "personal_history" DROP COLUMN IF EXISTS "smoking";--> statement-breakpoint
ALTER TABLE "personal_history" DROP COLUMN IF EXISTS "alcohol";--> statement-breakpoint
ALTER TABLE "personal_history" DROP COLUMN IF EXISTS "exercise";--> statement-breakpoint
ALTER TABLE "socio_economic_history" DROP COLUMN IF EXISTS "education";--> statement-breakpoint
ALTER TABLE "socio_economic_history" DROP COLUMN IF EXISTS "occupation";--> statement-breakpoint
ALTER TABLE "socio_economic_history" DROP COLUMN IF EXISTS "income";--> statement-breakpoint
ALTER TABLE "socio_economic_history" DROP COLUMN IF EXISTS "living_conditions";--> statement-breakpoint
ALTER TABLE "surgical_history" DROP COLUMN IF EXISTS "previous_surgeries";--> statement-breakpoint
ALTER TABLE "surgical_history" DROP COLUMN IF EXISTS "surgery_dates";--> statement-breakpoint
ALTER TABLE "surgical_history" DROP COLUMN IF EXISTS "complications";--> statement-breakpoint
ALTER TABLE "trimester" DROP COLUMN IF EXISTS "fetal_movement";--> statement-breakpoint
ALTER TABLE "trimester" DROP COLUMN IF EXISTS "fetal_heart_rate";--> statement-breakpoint
ALTER TABLE "trimester" DROP COLUMN IF EXISTS "fundal_height";--> statement-breakpoint
ALTER TABLE "trimester" DROP COLUMN IF EXISTS "presentation";