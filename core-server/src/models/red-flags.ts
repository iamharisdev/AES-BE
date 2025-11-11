import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { emr } from './emr';

export const redFlags = pgTable('red_flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id),
  flag: text('flag'),
  justification: text('justification'),
  severity: text('severity'),
  actionTaken: text('action_taken'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
