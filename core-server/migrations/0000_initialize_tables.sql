DROP TABLE IF EXISTS "examination_details";
DROP TABLE IF EXISTS "prev_preg";
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
	"phone" text NOT NULL,
	"name" text,
	"location" text,
	"cnic" text,
	"generation_time" timestamp DEFAULT now() NOT NULL,
  "prev_pregnancies" JSONB DEFAULT NULL
);

CREATE TABLE "turn_emr" (
  "phone" TEXT NOT NULL,
  "visit" INTEGER NOT NULL,
  "generation_time" TIMESTAMP DEFAULT now() NOT NULL,
  "last_modified_time" TIMESTAMP DEFAULT now() NOT NULL,
  "patient_profile" JSONB,
  "presenting_complaint" JSONB,
  "current_pregnancy" JSONB,
  "second_third_trimesters" JSONB,
  "obs_history" JSONB,
  "gynecological_history" JSONB,
  "past_medical_history" JSONB,
  "surgical_history" JSONB,
  "family_history" JSONB,
  "personal_history" JSONB,
  "socio_economic_history" JSONB,
  "vitals" JSONB,
  "red_flags" JSONB,
  "followup_questions" JSONB,
  "emr_id" UUID NOT NULL PRIMARY KEY,
  "patient_id" UUID NOT NULL REFERENCES patient(patient_id)
);

CREATE TABLE "examination_details" (
  "generation_time" TIMESTAMP DEFAULT now() NOT NULL,
  "emr_id" UUID NOT NULL PRIMARY KEY REFERENCES turn_emr(emr_id),
  "content" JSONB NOT NULL,
  "doctor_id" UUID NOT NULL REFERENCES doctor(doctor_id)
)




