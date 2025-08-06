import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { emr } from './emr';

export const familyHistory = pgTable('family_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id),
  familyMedicalConditions: text('family_medical_conditions'), // Medical conditions in family - "Kiya apkay ya apkay shohar k khandan men kisi ko sugar, blood pressure, dil, TB, ya bachon men banawti naqais tou nahin hain?"
  twinsFamilyHistory: text('twins_family_history'), // Whether twins run in family - "Kya apkay khandaan men pehlay koi jurwan bachay hoye hain?"
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
