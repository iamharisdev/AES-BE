import { pgTable, serial, timestamp, uuid } from "drizzle-orm/pg-core";
import { patient } from "./patient";

// 1️⃣ Visits Table
export const visits = pgTable("visits", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patient.id, { onDelete: "cascade" }),
 visitNumber: serial("visit_number").notNull(),
  visitDate: timestamp("visit_date", { withTimezone: true }).defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
