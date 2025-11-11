import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { emr } from "./emr";

export const socioEconomicHistory = pgTable("socio_economic_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  emrId: uuid("emr_id")
    .notNull()
    .references(() => emr.id),

  // 🔹 Existing keys that match object ids
  hospitalAccompaniment: text("hospital_accompaniment"), // Q: "Aap kay saath hospital aur doctor ke paas kon aata hai?"
  livingSituation: text("living_situation"),
  financialSituation: text("financial_situation"), // Q: "Shohar kiya kaam kerta hai? Ghar main kon kon kamanay wala hai? Guzara theek se hojata hai?"
  monthlyIncome: text("monthly_income"), // Q: "Ghar main andazan mahana tankhwa kitni aajati hogi?"

  // Legacy field not match with object
  additionalInfo: text("additional_info"), // Additional important information
  noFamilyMembers: text("no_family_members"), // Q: "Aapke ghar mein kitne afraad hain?"

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
