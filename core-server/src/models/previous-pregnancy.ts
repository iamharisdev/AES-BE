import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { emr } from './emr';

export const previousPregnancy = pgTable('previous_pregnancy', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id),
  childAge: text('child_age'),
  childGender: text('child_gender'),
  fullTermBirth: text('full_term_birth'),
  birthMethod: text('birth_method'),
  birthPlace: text('birth_place'),
  contractions: text('contractions'),
  durationBirth: text('duration_birth'),
  operationReason: text('operation_reason'),
  postDeliveryProblems: text('post_delivery_problems'),
  childCondition: text('child_condition'),
  pregnancyProblems: text('pregnancy_problems'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
