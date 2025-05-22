import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { emr } from './emr';

export const gynecologicalHistory = pgTable('gynecological_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id),
  menstrualHistory: text('menstrual_history'),
  contraceptiveUse: text('contraceptive_use'),
  previousGynecologicalConditions: text('previous_gynecological_conditions'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
