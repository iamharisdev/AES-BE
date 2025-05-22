import {
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  integer
} from 'drizzle-orm/pg-core';
import { emr } from './emr';

export const trimester = pgTable('trimester', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id),
  fetalMovement: text('fetal_movement'),
  fetalHeartRate: integer('fetal_heart_rate'),
  fundalHeight: numeric('fundal_height'),
  presentation: text('presentation'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
