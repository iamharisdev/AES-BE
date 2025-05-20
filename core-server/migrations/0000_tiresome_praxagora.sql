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
	"patient_id" uuid NOT NULL,
	"files" jsonb DEFAULT '[]',
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
CREATE TABLE IF NOT EXISTS "patient" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone_number" text,
	"name" text,
	"location" text,
	"cnic" text,
	"prev_pregnancies" jsonb,
	"voice_notes" jsonb DEFAULT '[]',
	"doctor_id" uuid NOT NULL,
	"hospital_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "red_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emr_id" uuid NOT NULL,
	"red_flags" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone_number" text NOT NULL,
	"name" text NOT NULL,
	"encrypted_password" text NOT NULL,
	"role" text DEFAULT 'doctor' NOT NULL,
	"hospital_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
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
 ALTER TABLE "patient" ADD CONSTRAINT "patient_doctor_id_user_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "red_flags" ADD CONSTRAINT "red_flags_emr_id_emr_id_fk" FOREIGN KEY ("emr_id") REFERENCES "public"."emr"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
