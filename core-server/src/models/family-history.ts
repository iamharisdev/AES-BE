import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { emr } from './emr';

export const familyHistory = pgTable('family_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id),
  currentMeds: text('current_meds'),
  sugarBloodPressure: text('sugar_blood_pressure'),
  familyMedicalConditions: text('family_medical_conditions'),
  twinsFamilyHistory: text('twins_family_history'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
