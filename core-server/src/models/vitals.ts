import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  numeric
} from 'drizzle-orm/pg-core';
import { emr } from './emr';

export const vitals = pgTable('vitals', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id),
  bloodPressure: text('blood_pressure'),
  pulse: integer('pulse'),
  temperature: numeric('temperature'),
  weight: numeric('weight'),
  height: numeric('height'),
  bmi: numeric('bmi'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
