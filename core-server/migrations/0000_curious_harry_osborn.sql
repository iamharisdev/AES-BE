DO $$ BEGIN
 CREATE TYPE "public"."advised_test_status" AS ENUM('not_submitted', 'submitted');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."section_status" AS ENUM('incomplete', 'complete');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "advised_tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visit_id" uuid NOT NULL,
	"test_name" text NOT NULL,
	"status" "advised_test_status" DEFAULT 'not_submitted' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "current_pregnancy" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"current_problems" text,
	"pregnancy_detection_method" text,
	"ultrasound" text,
	"folic_acid" text,
	"blood_urine_tests" text,
	"early_pregnancy_symptoms" text,
	"pregnancy_method" text,
	"bleeding" text,
	"fever" text,
	"headache_vision" text,
	"severe_pain" text,
	"convulsions" text,
	"breathing_difficulty" text,
	"other_concerns" text,
	"early_ultrasound" text,
	"ultrasound_location" text,
	"menstrual_regularity" text,
	"test_details" text,
	"pregnancy_consent" text,
	"pregnancy_clinical_findings" text,
	"uti_burn" text,
	"urine_test" text,
	"blood_urine_test" text,
	"blood_urine_test_types" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "diagnostics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visit_id" uuid NOT NULL,
	"diagnostics" jsonb NOT NULL,
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
	"visit_id" uuid NOT NULL,
	"updated_by_user_id" uuid,
	"bilateral_pedal_edema" varchar,
	"clubbing" varchar,
	"koilonychia" varchar,
	"lymph_nodes" varchar,
	"pallor" varchar,
	"spine" varchar,
	"abnormalSpine" varchar,
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
	"leukonychia" varchar,
	"presentation" varchar,
	"prominent_veins" varchar,
	"pulsations" varchar,
	"scar_tenderness" varchar,
	"shape_of_abdomen" varchar,
	"striae" varchar,
	"umbilicus" varchar,
	"per_speculum_findings" varchar,
	"per_vaginal_findings" varchar,
	"physical_findings" varchar,
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
	"patient_id" uuid,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_url" text NOT NULL,
	"summary" text NOT NULL,
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
	"menstrual_regularity" text,
	"family_planning_method" text,
	"pap_smear_test" text,
	"pap_smear_details" text,
	"family_planning" text,
	"pap_smear_result" text,
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
	"medical_conditions" text,
	"current_medications" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "obs_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"children_birth_methods" text,
	"children_birth_details" text,
	"oldest_child_age" text,
	"children_ages" text,
	"children_genders" text,
	"children_full_term" text,
	"children_birth_places" text,
	"children_birth_weights" text,
	"children_health_status" text,
	"previous_pregnancy_conditions" text,
	"previous_pregnancy_complications" text,
	"past_pregnancy_conditions" text,
	"single_child_delivery_type" text,
	"single_child_contractions" text,
	"single_child_birth_duration" text,
	"single_child_operation_reason" text,
	"multiple_children_delivery_types" text,
	"multiple_children_details" text,
	"child_age" text,
	"child_gender" text,
	"full_term_birth" text,
	"birth_place" text,
	"birth_weight" text,
	"post_delivery_problems" text,
	"child_health_status" text,
	"child_school_status" text,
	"birth_method" text,
	"contractions" text,
	"birth_duration" text,
	"operation_reason" text,
	"pregnancy_problems" text,
	"children_contractions" text,
	"children_birth_durations" text,
	"children_operation_reasons" text,
	"gravida_para" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "patient_chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" text NOT NULL,
	"session_started" timestamp with time zone NOT NULL,
	"last_message_at" timestamp with time zone,
	"messages" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "patient" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"age" text,
	"cnic" text,
	"phone_number" text NOT NULL,
	"gestational_age" text,
	"education" text,
	"location" text,
	"occupation" text,
	"married_years" text,
	"total_pregnancies" text,
	"living_children" text,
	"last_menstruation_date" text,
	"pregnancy_months" text,
	"first_pregnancy" text,
	"miscarriages" text,
	"miscarriage_count" text,
	"miscarriage_timing" text,
	"stillbirths" text,
	"stillbirth_count" text,
	"neonatal_deaths" text,
	"neonatal_death_count" text,
	"preterm_births" text,
	"voice_notes" jsonb DEFAULT '[]',
	"husband_phone_number" text,
	"marital_status" text,
	"family_marriage" text,
	"patient_blood_group" text,
	"husband_blood_group" text,
	"miscarriage" text,
	"current_problems" text,
	"medical_conditions" text,
	"current_medications" text,
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
	"diet" text,
	"substance_use" text,
	"relationship_domestic_situation" text,
	"sleep_issues" text,
	"hunger_issues" text,
	"relationship_quality" text,
	"family_behavior" text,
	"allergy_type" text,
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
	"birth_weight" text,
	"post_delivery_problems" text,
	"child_condition" text,
	"past_pregnancy_complications" text,
	"contractions" text,
	"complications" text,
	"duration_birth" text,
	"operation_reason" text,
	"pregnancy_problems" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "proposed_plan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visit_id" uuid NOT NULL,
	"general_plan" text,
	"medication" jsonb,
	"next_follow_up_timing" date,
	"advised_lab_tests" text[],
	"editable" boolean DEFAULT false NOT NULL,
	"doctorNotes" text,
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
CREATE TABLE IF NOT EXISTS "emr_section_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"section" text NOT NULL,
	"status" "section_status" DEFAULT 'incomplete' NOT NULL,
	"answered_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"skipped_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_question_id" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "socio_economic_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"hospital_accompaniment" text,
	"living_situation" text,
	"financial_situation" text,
	"monthly_income" text,
	"additional_info" text,
	"no_family_members" text,
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
	"ultrasound_five_months" text,
	"checkup_regularity" text,
	"sugar_test" text,
	"sugar_medication" text,
	"blood_pressure" text,
	"bp_medication" text,
	"recent_ultrasound" text,
	"additional_info" text,
	"movement_reduction" text,
	"recent_scan" text,
	"checkup_visits" text,
	"sugar_test_result" text,
	"blood_pressure_check" text,
	"blood_pressure_result" text,
	"recent_ultrasound_issues" text,
	"additional_pregnancy_info" text,
	"ultrasound" text,
	"scan_results" text,
	"blood_urine_tests" text,
	"hb_level" text,
	"hb_symptoms" text,
	"strength_meds" text,
	"pregnancy_symptoms" text,
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
CREATE TABLE IF NOT EXISTS "visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"visit_number" serial NOT NULL,
	"visit_date" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vitals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visit_id" uuid NOT NULL,
	"presenting_complaint" text,
	"blood_pressure" text,
	"pulse_rate" text,
	"temperature" text,
	"respiratory_rate" text,
	"weight" text,
	"visit_date" text
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "advised_tests" ADD CONSTRAINT "advised_tests_visit_id_visits_id_fk" FOREIGN KEY ("visit_id") REFERENCES "public"."visits"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "current_pregnancy" ADD CONSTRAINT "current_pregnancy_emr_id_emr_id_fk" FOREIGN KEY ("emr_id") REFERENCES "public"."emr"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "files" ADD CONSTRAINT "files_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "emr_section_progress" ADD CONSTRAINT "emr_section_progress_emr_id_emr_id_fk" FOREIGN KEY ("emr_id") REFERENCES "public"."emr"("id") ON DELETE no action ON UPDATE no action;
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
 ALTER TABLE "visits" ADD CONSTRAINT "visits_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
