CREATE TABLE IF NOT EXISTS "current_pregnancy" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"lmp" date,
	"edd" date,
	"gravida" integer,
	"para" integer,
	"abortions" integer,
	"live_births" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "family_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"conditions" text,
	"relationship" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "followup_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"question" text NOT NULL,
	"answer" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gynecological_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"menstrual_history" text,
	"contraceptive_use" text,
	"previous_gynecological_conditions" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "medical_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"conditions" text,
	"allergies" text,
	"medications" text,
	"diabetes" text,
	"hypertension" text,
	"heart_disease" text,
	"asthma" text,
	"thyroid" text,
	"other" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "obs_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"previous_pregnancies" integer,
	"previous_deliveries" integer,
	"previous_complications" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "personal_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"smoking" boolean,
	"alcohol" boolean,
	"diet" text,
	"exercise" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "presenting_complaint" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"primary_symptom" text NOT NULL,
	"symptom_duration" text,
	"symptom_severity" text,
	"related_symptoms" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "socio_economic_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"education" text,
	"occupation" text,
	"income" text,
	"living_conditions" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "surgical_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"previous_surgeries" text,
	"surgery_dates" text,
	"complications" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trimester" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"fetal_movement" text,
	"fetal_heart_rate" integer,
	"fundal_height" numeric,
	"presentation" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vitals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"blood_pressure" text,
	"pulse" integer,
	"temperature" numeric,
	"weight" numeric,
	"height" numeric,
	"bmi" numeric,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "red_flags" DROP CONSTRAINT "red_flags_emr_id_emr_id_fk";
--> statement-breakpoint
ALTER TABLE "patient" ALTER COLUMN "phone_number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "age" integer;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "gender" text;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "marital_status" text;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "occupation" text;--> statement-breakpoint
ALTER TABLE "patient" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "red_flags" ADD COLUMN "symptoms" text;--> statement-breakpoint
ALTER TABLE "red_flags" ADD COLUMN "severity" text;--> statement-breakpoint
ALTER TABLE "red_flags" ADD COLUMN "action_taken" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "current_pregnancy" ADD CONSTRAINT "current_pregnancy_emr_id_emr_id_fk" FOREIGN KEY ("emr_id") REFERENCES "public"."emr"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "family_history" ADD CONSTRAINT "family_history_emr_id_emr_id_fk" FOREIGN KEY ("emr_id") REFERENCES "public"."emr"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "files" ADD CONSTRAINT "files_emr_id_emr_id_fk" FOREIGN KEY ("emr_id") REFERENCES "public"."emr"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "followup_questions" ADD CONSTRAINT "followup_questions_emr_id_emr_id_fk" FOREIGN KEY ("emr_id") REFERENCES "public"."emr"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gynecological_history" ADD CONSTRAINT "gynecological_history_emr_id_emr_id_fk" FOREIGN KEY ("emr_id") REFERENCES "public"."emr"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "medical_history" ADD CONSTRAINT "medical_history_emr_id_emr_id_fk" FOREIGN KEY ("emr_id") REFERENCES "public"."emr"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "obs_history" ADD CONSTRAINT "obs_history_emr_id_emr_id_fk" FOREIGN KEY ("emr_id") REFERENCES "public"."emr"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "personal_history" ADD CONSTRAINT "personal_history_emr_id_emr_id_fk" FOREIGN KEY ("emr_id") REFERENCES "public"."emr"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "presenting_complaint" ADD CONSTRAINT "presenting_complaint_emr_id_emr_id_fk" FOREIGN KEY ("emr_id") REFERENCES "public"."emr"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "socio_economic_history" ADD CONSTRAINT "socio_economic_history_emr_id_emr_id_fk" FOREIGN KEY ("emr_id") REFERENCES "public"."emr"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "surgical_history" ADD CONSTRAINT "surgical_history_emr_id_emr_id_fk" FOREIGN KEY ("emr_id") REFERENCES "public"."emr"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trimester" ADD CONSTRAINT "trimester_emr_id_emr_id_fk" FOREIGN KEY ("emr_id") REFERENCES "public"."emr"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vitals" ADD CONSTRAINT "vitals_emr_id_emr_id_fk" FOREIGN KEY ("emr_id") REFERENCES "public"."emr"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "red_flags" ADD CONSTRAINT "red_flags_emr_id_emr_id_fk" FOREIGN KEY ("emr_id") REFERENCES "public"."emr"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user" ADD CONSTRAINT "user_hospital_id_hospital_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospital"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "emr" DROP COLUMN IF EXISTS "patient_profile";--> statement-breakpoint
ALTER TABLE "emr" DROP COLUMN IF EXISTS "presenting_complaint";--> statement-breakpoint
ALTER TABLE "emr" DROP COLUMN IF EXISTS "current_pregnancy";--> statement-breakpoint
ALTER TABLE "emr" DROP COLUMN IF EXISTS "second_third_trimesters";--> statement-breakpoint
ALTER TABLE "emr" DROP COLUMN IF EXISTS "obs_history";--> statement-breakpoint
ALTER TABLE "emr" DROP COLUMN IF EXISTS "gynecological_history";--> statement-breakpoint
ALTER TABLE "emr" DROP COLUMN IF EXISTS "past_medical_history";--> statement-breakpoint
ALTER TABLE "emr" DROP COLUMN IF EXISTS "surgical_history";--> statement-breakpoint
ALTER TABLE "emr" DROP COLUMN IF EXISTS "family_history";--> statement-breakpoint
ALTER TABLE "emr" DROP COLUMN IF EXISTS "personal_history";--> statement-breakpoint
ALTER TABLE "emr" DROP COLUMN IF EXISTS "socio_economic_history";--> statement-breakpoint
ALTER TABLE "emr" DROP COLUMN IF EXISTS "vitals";--> statement-breakpoint
ALTER TABLE "emr" DROP COLUMN IF EXISTS "red_flags";--> statement-breakpoint
ALTER TABLE "emr" DROP COLUMN IF EXISTS "followup_questions";--> statement-breakpoint
ALTER TABLE "emr" DROP COLUMN IF EXISTS "files";--> statement-breakpoint
ALTER TABLE "red_flags" DROP COLUMN IF EXISTS "red_flags";