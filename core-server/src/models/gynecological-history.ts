import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { emr } from "./emr";

export const gynecologicalHistory = pgTable('gynecological_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id),

  // 🔹 Existing keys that match object id
  menstrualRegularity: text('menstrual_regularity'),
  familyPlanningMethod: text('family_planning_method'),
  papSmearTest: text('pap_smear_test'),
  papSmearDetails: text('pap_smear_details'),

  //Not exist in the object
  // familyPlanning: text("family_planning"), // Q: "Kya aap isse pehle khandaani mansooba bandi ka koi tareeqa istemal karti rahi hain?"
  // papSmearResult: text("pap_smear_result"), // Q: "IF YES: Tafseelan batayein, sab theek tha?"

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
