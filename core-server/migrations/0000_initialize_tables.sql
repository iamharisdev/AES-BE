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
	"name" text NOT NULL,
	"location" text NOT NULL,
	"cnic" text NOT NULL,
	"generation_time" timestamp DEFAULT now() NOT NULL,
  "prev_pregnancies" JSONB DEFAULT NULL
);

CREATE TABLE "turn_emr" (
  "phone" TEXT NOT NULL,
  "visit" INTEGER NOT NULL,
  "generation_time" TIMESTAMP NOT NULL,
  "last_modified_time" TIMESTAMP NOT NULL,
  "patient_profile" JSONB NOT NULL,
  "presenting_complaint" JSONB NOT NULL,
  "current_pregnancy" JSONB NOT NULL,
  "second_third_trimesters" JSONB NOT NULL,
  "obs_history" JSONB NOT NULL,
  "gynecological_history" JSONB NOT NULL,
  "past_medical_history" JSONB NOT NULL,
  "surgical_history" JSONB NOT NULL,
  "family_history" JSONB NOT NULL,
  "personal_history" JSONB NOT NULL,
  "socio_economic_history" JSONB NOT NULL,
  "emr_id" UUID NOT NULL PRIMARY KEY,
  "patient_id" UUID NOT NULL REFERENCES patient(patient_id)
);

CREATE TABLE "examination_details" (
  "generation_time" TIMESTAMP NOT NULL,
  "emr_id" UUID NOT NULL PRIMARY KEY REFERENCES turn_emr(emr_id),
  "content" JSONB NOT NULL,
  "doctor_id" UUID NOT NULL REFERENCES doctor(doctor_id)
)




