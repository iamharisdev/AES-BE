import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { emr } from './emr';

export const surgicalHistory = pgTable('surgical_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id),
  surgicalHistory: text('surgical_history'), // Past surgeries and details - "Apka kabhi kisi wajah se koi operation tou nae hua? Agar hua hai tou tafseelan bataiye."
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
