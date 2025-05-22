import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { emr } from './emr';

export const socioEconomicHistory = pgTable('socio_economic_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id),
  education: text('education'),
  occupation: text('occupation'),
  income: text('income'),
  livingConditions: text('living_conditions'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
