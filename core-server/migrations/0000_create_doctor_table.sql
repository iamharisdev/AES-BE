CREATE TABLE IF NOT EXISTS "doctor" (
	"phone_number" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"encrypted_password" text NOT NULL,
	"maternity_home_name" text NOT NULL
);
