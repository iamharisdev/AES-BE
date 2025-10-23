import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { emr } from "./emr";

export const familyHistory = pgTable("family_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  emrId: uuid("emr_id")
    .notNull()
    .references(() => emr.id),

  // Family Medical Conditions (MERGED)
  familyMedicalConditions: text("family_medical_conditions"), // Q: "Aap kay ya aap kay shohar kay khandan may kisi ko: sugar, BP, hepatitis, ya koyi bhi paidashi beemari hai? Thora tafseelan batayein."

  // Legacy field
  twinsFamilyHistory: text("twins_family_history"), // Whether twins run in family

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
