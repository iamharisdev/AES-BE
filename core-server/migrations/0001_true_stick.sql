CREATE TABLE IF NOT EXISTS "diagnostics" (
	"emr_id" text PRIMARY KEY NOT NULL,
	"generation_time" timestamp DEFAULT now() NOT NULL,
	"diagnostics" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "doctor" (
	"doctor_id" uuid PRIMARY KEY NOT NULL,
	"phone_number" text NOT NULL,
	"name" text NOT NULL,
	"encrypted_password" text NOT NULL,
	"maternity_home_name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "examination_details" (
	"generation_time" timestamp NOT NULL,
	"emr_id" uuid PRIMARY KEY NOT NULL,
	"doctor_id" uuid NOT NULL,
	"modified_doctor_id" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"blood_pressure" varchar,
	"pr" varchar,
	"rr" varchar,
	"temperature" varchar,
	"bilateral_pedal_edema" varchar,
	"clubbing" varchar,
	"jaundice" varchar,
	"koilonychia" varchar,
	"lymph_nodes" varchar,
	"pallor" varchar,
	"spine" varchar,
	"nipple_deformity" varchar,
	"nipple_discharge" varchar,
	"size_comparison" varchar,
	"swelling" varchar,
	"abdominal_wall_edema" varchar,
	"estimated_fetal_weight" varchar,
	"fetal_heart_rate" varchar,
	"fundal_height" varchar,
	"hernial_orfices" varchar,
	"lie" varchar,
	"liquor" varchar,
	"presentation" varchar,
	"prominent_veins" varchar,
	"pulsations" varchar,
	"scar_tenderness" varchar,
	"shape_of_abdomen" varchar,
	"striae" varchar,
	"umbilicus" varchar,
	"per_speculum_findings" varchar,
	"per_vaginal_findings" varchar,
	"cns" varchar,
	"cvs" varchar
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "migrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"hash" text NOT NULL,
	"created_at" bigint
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "patient" (
	"patient_id" uuid PRIMARY KEY NOT NULL,
	"phone" text,
	"name" text,
	"location" text,
	"cnic" text,
	"generation_time" timestamp DEFAULT now() NOT NULL,
	"prev_pregnancies" jsonb,
	"voice_notes" jsonb DEFAULT '[]'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "red_flags" (
	"emr_id" text PRIMARY KEY NOT NULL,
	"generation_time" timestamp DEFAULT now() NOT NULL,
	"red_flags" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "turn_emr" (
	"phone" text NOT NULL,
	"visit" integer NOT NULL,
	"generation_time" timestamp DEFAULT now(),
	"last_modified_time" timestamp,
	"patient_profile" jsonb,
	"presenting_complaint" jsonb,
	"current_pregnancy" jsonb,
	"second_third_trimesters" jsonb,
	"obs_history" jsonb,
	"gynecological_history" jsonb,
	"past_medical_history" jsonb,
	"surgical_history" jsonb,
	"family_history" jsonb,
	"personal_history" jsonb,
	"socio_economic_history" jsonb,
	"vitals" jsonb,
	"red_flags" jsonb,
	"followup_questions" jsonb,
	"emr_id" uuid PRIMARY KEY NOT NULL,
	"patient_id" uuid NOT NULL,
	"files" jsonb DEFAULT '[]'
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "examination_details" ADD CONSTRAINT "examination_details_emr_id_turn_emr_emr_id_fk" FOREIGN KEY ("emr_id") REFERENCES "public"."turn_emr"("emr_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "examination_details" ADD CONSTRAINT "examination_details_doctor_id_doctor_doctor_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctor"("doctor_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "examination_details" ADD CONSTRAINT "examination_details_modified_doctor_id_doctor_doctor_id_fk" FOREIGN KEY ("modified_doctor_id") REFERENCES "public"."doctor"("doctor_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "turn_emr" ADD CONSTRAINT "turn_emr_patient_id_patient_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("patient_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
