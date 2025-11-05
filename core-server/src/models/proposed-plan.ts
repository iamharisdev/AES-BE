import {
  boolean,
  date,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createdByEnum } from "../schemas/enums";

export const proposedPlan = pgTable("proposed_plan", {
  id: uuid("id").primaryKey().defaultRandom(),
  // emrId: uuid("emr_id")
  //   .notNull()
  //   .references(() => visits.id, { onDelete: "cascade" }),
  visitId: uuid("visit_id")
    .notNull(),
  generalPlan: text("general_plan"),
  medication: jsonb("medication").$type<string[]>(),
  nextFollowUpTiming: date("next_follow_up_timing"),
  advisedLabTests: text("advised_lab_tests").array(),
  editable: boolean("editable").notNull().default(false),
  doctorNotes: text("doctorNotes"),
  createdBy: text("created_by", { enum: createdByEnum })
    .notNull()
    .default("AI"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
