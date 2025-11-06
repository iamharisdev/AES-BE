import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { emr } from "./emr";

export const personalHistory = pgTable("personal_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  emrId: uuid("emr_id")
    .notNull()
    .references(() => emr.id),

  // 🔹 Existing keys that match object ids
  allergyStatus: text("allergy_status"), // Q: "Kiya aapko kisi cheez ya kisi dawai se allergy hai?"
  diet: text("diet"), // Q: "Apki ghiza kesi hai? Khaane mein aap phal, sabzian, gosht aur anday, doodh ka istemaal karti hain?"
  substanceUse: text("substance_use"), // Q: "Maaf kijiye ga, kiya aap ya aap ky shohar cigarette noshi ya kisi qisam ka koi aur nasha kartay hain?"
  relationshipDomesticSituation: text("relationship_domestic_situation"),
  sleepIssues: text("sleep_issues"),
  hungerIssues: text("hunger_issues"), // Q: "Bhook theek se lagti hai? Agar nahi, kya wajah hai thora tafseelan batayein?"

  // Legacy field not match with object

  relationshipQuality: text("relationship_quality"), // Q: "Aap ke apne shohar ke saath taluqaat kaisay hain?"
  familyBehavior: text("family_behavior"), // Q: "Aap kay baaki ghar walon ka rawayya aap ke saath kaisy hai?"
  allergyType: text("allergy_type"), // Follow-up if yes

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
