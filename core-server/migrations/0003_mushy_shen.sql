CREATE TABLE IF NOT EXISTS "reminder_delivery" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"rule_id" uuid,
	"scheduled_for" timestamp,
	"sent_at" timestamp with time zone,
	"status" text DEFAULT 'pending' NOT NULL,
	"provider_message_id" text,
	"error" text,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reminder_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"target_week" integer,
	"trigger_code" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reminder_template" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"provider" text DEFAULT 'twilio' NOT NULL,
	"provider_template_id" text NOT NULL,
	"channel" text DEFAULT 'whatsapp' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reminder_template_code_unique" UNIQUE("code")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reminder_delivery" ADD CONSTRAINT "reminder_delivery_template_id_reminder_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."reminder_template"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reminder_delivery" ADD CONSTRAINT "reminder_delivery_rule_id_reminder_rule_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."reminder_rule"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reminder_rule" ADD CONSTRAINT "reminder_rule_template_id_reminder_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."reminder_template"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "reminder_delivery_unique_patient_template" ON "reminder_delivery" USING btree ("patient_id","template_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reminder_delivery_status_idx" ON "reminder_delivery" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reminder_delivery_scheduled_idx" ON "reminder_delivery" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reminder_delivery_patient_idx" ON "reminder_delivery" USING btree ("patient_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "reminder_rule_unique_week" ON "reminder_rule" USING btree ("target_week") WHERE target_week IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reminder_rule_trigger_idx" ON "reminder_rule" USING btree ("trigger_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reminder_rule_active_idx" ON "reminder_rule" USING btree ("is_active");