CREATE TABLE "proposed_plan" (
  "id" serial PRIMARY KEY,
  "followup_date" timestamp NOT NULL,
  "doctor_notes" text NOT NULL,
  "additional_notes" text,
  "advised_lab_tests" jsonb NOT NULL DEFAULT '[]',
);