import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { emr } from './emr';

export const personalHistory = pgTable('personal_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id),
  allergyStatus: text('allergy_status'), // Whether patient has allergies - "Aapko kisi cheez ya koi dawai se allergy tou nahi hai?"
  allergyType: text('allergy_type'), // Type of allergy if any - "If yes: konsi allergy hai?"
  substanceUse: text('substance_use'), // Whether patient or husband uses substances - "Maaf kijiye ga, kiya aap ya aap ka shohar cigarette noshi ya kisi qisam ka koi aur nasha kartay hain?"
  relationshipDomesticSituation: text('relationship_domestic_situation'), // Relationship quality and domestic abuse situation - "Aap ke shohar ke saath taluqaat theek hain? Apkay sath ghar per koi gali galoch/ mar peet ya zabardasti tou nahin kerta?"
  sleepIssues: text('sleep_issues'), // Sleep issues and reasons - "Aap ko neend theek aati hai? Agar nahi, kya wajah hai thora tafseelan batayein?"
  hungerIssues: text('hunger_issues'), // Hunger issues and reasons - "Bhook theek lagti hai? Agar nahi, kya wajah hai thora tafseelan batayein?"
  diet: text('diet'), // Diet and food consumption - "Apki ghiza kesi hai? Khaane mein phal, sabzian, gosht aur anday doodh ka istemaal karti hain?"
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
