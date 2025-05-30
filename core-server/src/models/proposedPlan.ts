// drizzle/schema.ts
import { pgTable, serial, text, timestamp, jsonb ,   uuid} from "drizzle-orm/pg-core";

export const proposedPlanTable = pgTable("proposed_plan", {
  id: serial("id").primaryKey(),
  emrId: uuid('emr_id').notNull(),
  followupDate: timestamp("followup_date").notNull(),
  doctorNotes: text("doctor_notes").notNull(),
  additionalNotes: text("additional_notes"),
  advisedLabTests: jsonb("advised_lab_tests").default([]).notNull(),
});