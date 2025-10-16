import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { emr } from "./emr";

export const medicalHistory = pgTable("medical_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  emrId: uuid("emr_id")
    .notNull()
    .references(() => emr.id),

  // Past Medical Conditions (MERGED)
  medicalConditions: text("medical_conditions"), // Q: "Aapko kabhi bhi Sugar, Blood pressure, Dama, TB, Yarqan, dil ya gurdon ka masla tou nahin hua? Tafseelan batayein."

  // Current Medications
  currentMedications: text("current_medications"), // Q: "Kiya ap iss waqt kisi maslay k liye koi dawai khaa rahi hain? Konsi dawaii leti hain?"

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});
