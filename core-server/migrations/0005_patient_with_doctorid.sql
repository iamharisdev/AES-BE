CREATE TABLE IF NOT EXISTS "patient_info" (
	"doctor_id" text NOT NULL,
	"phone" text NOT NULL,
	"name" text NOT NULL,
	"location" text NOT NULL,
	CONSTRAINT "global_id" PRIMARY KEY("doctor_id","phone")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "patient_info" ADD CONSTRAINT "patient_info_doctor_id_doctor_phone_number_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctor"("phone_number") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
