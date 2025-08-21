CREATE TABLE IF NOT EXISTS "current_pregnancy" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"pregnancy_detection_method" text,
	"pregnancy_consent" text,
	"pregnancy_method" text,
	"pregnancy_clinical_findings" text,
	"urine_test" text,
	"ultrasound" text,
	"folic_acid" text,
	"blood_urine_test" text,
	"blood_urine_test_types" text,
	"early_pregnancy_symptoms" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "diagnostics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"diagnostics" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "emr" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" text NOT NULL,
	"visit" integer NOT NULL,
	"patient_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "examination" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"updated_by_user_id" uuid,
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
	"cvs" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "family_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"family_medical_conditions" text,
	"twins_family_history" text,
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
	"family_planning" text,
	"family_planning_method" text,
	"pap_smear_test" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hospital" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "migrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"hash" text NOT NULL,
	"created_at" bigint
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "medical_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"current_medications" text,
	"medical_conditions" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "obs_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"child_age" text,
	"child_gender" text,
	"full_term_birth" text,
	"birth_place" text,
	"birth_method" text,
	"contractions" text,
	"birth_duration" text,
	"operation_reason" text,
	"birth_weight" text,
	"post_delivery_problems" text,
	"child_health_status" text,
	"child_school_status" text,
	"pregnancy_problems" text,
	"children_ages" text,
	"children_genders" text,
	"children_birth_places" text,
	"children_birth_methods" text,
	"children_contractions" text,
	"children_birth_durations" text,
	"children_operation_reasons" text,
	"children_birth_weights" text,
	"children_health_status" text,
	"children_school_status" text,
	"gravida_para" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "patient" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone_number" text NOT NULL,
	"husband_phone_number" text,
	"name" text,
	"age" text,
	"marital_status" text,
	"occupation" text,
	"location" text,
	"cnic" text,
	"education" text,
	"married_years" text,
	"pregnancy_months" text,
	"miscarriage" text,
	"first_pregnancy" text,
	"family_marriage" text,
	"patient_blood_group" text,
	"husband_blood_group" text,
	"last_menstruation_date" text,
	"total_pregnancies" text,
	"miscarriages" text,
	"miscarriage_timing" text,
	"stillbirths" text,
	"neonatal_deaths" text,
	"living_children" text,
	"voice_notes" jsonb DEFAULT '[]',
	"doctor_id" uuid,
	"hospital_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "personal_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"allergy_status" text,
	"allergy_type" text,
	"substance_use" text,
	"relationship_domestic_situation" text,
	"sleep_issues" text,
	"hunger_issues" text,
	"diet" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "presenting_complaint" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"problem" text NOT NULL,
	"detail" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE IF NOT EXISTS "proposed_plan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"general_plan" text,
	"medications" text,
	"instructions" text,
	"next_follow_up_timing" date,
	"next_follow_up_purpose" text,
	"advised_lab_tests" text[],
	"created_by" text DEFAULT 'AI' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "qr_code" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" varchar(255) NOT NULL,
	"patient_id" uuid NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "qr_code_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "red_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"flag" text,
	"justification" text,
	"severity" text,
	"action_taken" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "socio_economic_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"no_family_members" text,
	"financial_situation" text,
	"living_situation" text,
	"additional_info" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "surgical_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"surgical_history" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trimester" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"fetus_movement" text,
	"movement_reduction" text,
	"ultrasound" text,
	"recent_scan" text,
	"scan_results" text,
	"checkup_regularity" text,
	"blood_urine_tests" text,
	"hb_level" text,
	"hb_symptoms" text,
	"sugar_test" text,
	"sugar_test_result" text,
	"sugar_medication" text,
	"blood_pressure" text,
	"blood_pressure_result" text,
	"bp_medication" text,
	"strength_meds" text,
	"pregnancy_symptoms" text,
	"additional_info" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone_number" text NOT NULL,
	"email" text,
	"name" text NOT NULL,
	"encrypted_password" text NOT NULL,
	"role" text DEFAULT 'doctor' NOT NULL,
	"hospital_id" uuid,
	"reset_otp_hash" text,
	"reset_otp_expiry" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vitals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"blood_pressure" text,
	"pulse" text,
	"temperature" text,
	"weight" text,
	"height" text,
	"bmi" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "current_pregnancy" ADD CONSTRAINT "current_pregnancy_emr_id_emr_id_fk" FOREIGN KEY ("emr_id") REFERENCES "public"."emr"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "diagnostics" ADD CONSTRAINT "diagnostics_emr_id_emr_id_fk" FOREIGN KEY ("emr_id") REFERENCES "public"."emr"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "emr" ADD CONSTRAINT "emr_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "examination" ADD CONSTRAINT "examination_emr_id_emr_id_fk" FOREIGN KEY ("emr_id") REFERENCES "public"."emr"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "examination" ADD CONSTRAINT "examination_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "examination" ADD CONSTRAINT "examination_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "patient" ADD CONSTRAINT "patient_doctor_id_user_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
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
 ALTER TABLE "previous_pregnancy" ADD CONSTRAINT "previous_pregnancy_emr_id_emr_id_fk" FOREIGN KEY ("emr_id") REFERENCES "public"."emr"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "proposed_plan" ADD CONSTRAINT "proposed_plan_emr_id_emr_id_fk" FOREIGN KEY ("emr_id") REFERENCES "public"."emr"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "qr_code" ADD CONSTRAINT "qr_code_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE no action;
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
 ALTER TABLE "user" ADD CONSTRAINT "user_hospital_id_hospital_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospital"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vitals" ADD CONSTRAINT "vitals_emr_id_emr_id_fk" FOREIGN KEY ("emr_id") REFERENCES "public"."emr"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
