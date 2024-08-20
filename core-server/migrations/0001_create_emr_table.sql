CREATE TABLE IF NOT EXISTS "emr_records" (
	"emr_id" text PRIMARY KEY NOT NULL,
	"doctor_id" text NOT NULL,
	"patient_id" text NOT NULL,
	"generation_time" timestamp DEFAULT now() NOT NULL,
	"content" json NOT NULL
);
