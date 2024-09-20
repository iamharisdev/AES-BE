CREATE TABLE IF NOT EXISTS "diagnostics" (
	"emr_id" text PRIMARY KEY NOT NULL,
	"generation_time" timestamp DEFAULT now() NOT NULL,
	"diagnostics" json NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "red_flags" (
	"emr_id" text PRIMARY KEY NOT NULL,
	"generation_time" timestamp DEFAULT now() NOT NULL,
	"red_flags" json NOT NULL
);
