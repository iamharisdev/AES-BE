import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { emr } from './emr';

export const personalHistory = pgTable('personal_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id),
  allergyStatus: text('allergy_status'),
  allergyType: text('allergy_type'),
  bloodGroup: text('blood_group'),
  currentWeight: text('current_weight'),
  substanceUse: text('substance_use'),
  maritalStatus: text('marital_status'),
  sleepAndHunger: text('sleep_and_hunger'),
  diet: text('diet'),
  domesticAbuse: text('domestic_abuse'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
