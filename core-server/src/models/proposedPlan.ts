// drizzle/schema.ts
import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const followups = pgTable("proposed_plan", {
  id: serial("id").primaryKey(),
  followupDate: timestamp("followup_date").notNull(),
  doctorNotes: text("doctor_notes").notNull(),
  additionalNotes: text("additional_notes"),
  advisedLabTests: jsonb("advised_lab_tests").default([]).notNull(),
});