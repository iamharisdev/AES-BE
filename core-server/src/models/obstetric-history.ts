import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { emr } from './emr';

export const obsHistory = pgTable('obs_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id),
  previousPregnancies: integer('previous_pregnancies'),
  previousDeliveries: integer('previous_deliveries'),
  previousComplications: text('previous_complications'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
