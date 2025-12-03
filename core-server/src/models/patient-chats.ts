import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const patientChats = pgTable("patient_chats", {
  id: uuid("id").primaryKey().defaultRandom(),

  // store Mongo patient ObjectId as plain text
  patientId: text("patient_id").notNull(),

  sessionStarted: timestamp("session_started", {
    withTimezone: true,
  }).notNull(),

  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),

  // store the entire message array as JSONB
  messages: jsonb("messages").$type<
    {
      kind: string;
      msg_id: string;
      sender: string;
      message: string;
      direction: string;
      timestamp: string;
      current_flow: string;
      current_language: string;

      [key: string]: any;
    }[]
  >(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
