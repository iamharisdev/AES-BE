DROP TABLE IF EXISTS "examination_details";
DROP TABLE IF EXISTS "diagnostics";
DROP TABLE IF EXISTS "red_flags";
DROP TABLE IF EXISTS "doctor";
DROP TABLE IF EXISTS "turn_emr";
DROP TABLE IF EXISTS "patient";

CREATE TABLE "doctor" (
	"doctor_id" uuid PRIMARY KEY NOT NULL,
	"phone_number" text NOT NULL,
	"name" text NOT NULL,
	"encrypted_password" text NOT NULL,
	"maternity_home_name" text NOT NULL
);

CREATE TABLE "patient" (
	"patient_id" uuid PRIMARY KEY NOT NULL,
	"phone" text,
	"name" text,
	"location" text,
	"cnic" text,
	"generation_time" timestamp DEFAULT now() NOT NULL,
	"prev_pregnancies" jsonb,
	"voice_notes" jsonb DEFAULT '[]'
);

CREATE TABLE "turn_emr" (
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
	"patient_id" uuid REFERENCES patient(patient_id),
	"files" jsonb DEFAULT '[]'
);

CREATE TABLE "examination_details" (
	"generation_time" timestamp NOT NULL,
	"emr_id" uuid PRIMARY KEY NOT NULL REFERENCES turn_emr(emr_id),
	"doctor_id" uuid NOT NULL REFERENCES doctor(doctor_id),
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
	"modified_doctor_id" uuid REFERENCES doctor(doctor_id),
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "diagnostics" (
	"emr_id" text PRIMARY KEY NOT NULL,
	"generation_time" timestamp DEFAULT now() NOT NULL,
	"diagnostics" json NOT NULL
);

CREATE TABLE "red_flags" (
	"emr_id" text PRIMARY KEY NOT NULL,
	"generation_time" timestamp DEFAULT now() NOT NULL,
	"red_flags" json NOT NULL
);
