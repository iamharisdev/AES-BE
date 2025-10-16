import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { emr } from "./emr";

export const surgicalHistory = pgTable("surgical_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  emrId: uuid("emr_id")
    .notNull()
    .references(() => emr.id),

  // Past Surgeries
  surgicalHistory: text("surgical_history"), // Q: "Kiya aapka kabhi kisi wajah se koi operation hua hai? Agar hua hai tou tafseelan bataiye."

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
