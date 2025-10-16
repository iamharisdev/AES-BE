import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { visits } from "./visit";

// 2️⃣ Vitals Table
export const vitals = pgTable("vitals", {
  id: uuid("id").primaryKey().defaultRandom(),
  visitId: uuid("visit_id")
    .notNull()
    .references(() => visits.id, { onDelete: "cascade" }),

  presentingComplaint: text("presenting_complaint"),
  bloodPressure: text("blood_pressure"),
  pulseRate: text("pulse_rate"),
  temperature: text("temperature"),
  respiratoryRate: text("respiratory_rate"),
  weight: text("weight"),
  visitDate: text("visit_date"),
});
