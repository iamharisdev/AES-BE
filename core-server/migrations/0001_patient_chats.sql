CREATE TABLE IF NOT EXISTS "patient_chats" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "patient_id" text NOT NULL,
    "session_started" timestamp with time zone NOT NULL,
    "last_message_at" timestamp with time zone,
    "messages" jsonb,
    "created_at" timestamp with time zone DEFAULT now()
);
