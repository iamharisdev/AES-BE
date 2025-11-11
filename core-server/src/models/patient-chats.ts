import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const patientChats = pgTable("patient_chats", {
  id: uuid("id").primaryKey().defaultRandom(),

  // store Mongo patient ObjectId as plain text
  patientId: text("patient_id").notNull(),

  sessionStarted: timestamp("session_started", { withTimezone: true }).notNull(),

  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),

  // store the entire message array as JSONB
  messages: jsonb("messages").$type<
    {
      sender: string;
      message: string;
      timestamp: string;
      [key: string]: any;
    }[]
  >(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
