import {
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { emr } from './emr';

export const vitals = pgTable('vitals', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id),
  bloodPressure: text('blood_pressure'),
  pulse: text('pulse'),
  temperature: text('temperature'),
  weight: text('weight'),
  height: text('height'),
  bmi: text('bmi'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
