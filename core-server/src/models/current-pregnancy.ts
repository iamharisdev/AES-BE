import { date, integer, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { emr } from './emr';

export const currentPregnancy = pgTable('current_pregnancy', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id),
  lmp: date('lmp'),
  edd: date('edd'),
  gravida: integer('gravida'),
  para: integer('para'),
  abortions: integer('abortions'),
  liveBirths: integer('live_births'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
