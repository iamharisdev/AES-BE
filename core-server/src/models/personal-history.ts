import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';
import { emr } from './emr';

export const personalHistory = pgTable('personal_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id),
  smoking: boolean('smoking'),
  alcohol: boolean('alcohol'),
  diet: text('diet'),
  exercise: text('exercise'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
