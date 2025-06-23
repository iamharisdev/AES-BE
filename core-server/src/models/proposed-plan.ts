import { pgTable, text, timestamp, uuid, date } from 'drizzle-orm/pg-core';
import { emr } from './emr';

export const proposedPlan = pgTable('proposed_plan', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id, { onDelete: 'cascade' }),
  generalPlan: text('general_plan'),
  medications: text('medications'),
  instructions: text('instructions'),
  nextFollowUpTiming: date('next_follow_up_timing'),
  nextFollowUpPurpose: text('next_follow_up_purpose'),
  advisedLabTests: text('advised_lab_tests').array(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
