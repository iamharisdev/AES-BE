import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { emr } from './emr';

export const medicalHistory = pgTable('medical_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id),
  conditions: text('conditions'),
  allergies: text('allergies'),
  medications: text('medications'),
  diabetes: text('diabetes'),
  hypertension: text('hypertension'),
  heartDisease: text('heart_disease'),
  asthma: text('asthma'),
  thyroid: text('thyroid'),
  other: text('other'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
