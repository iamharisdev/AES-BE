import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { emr } from './emr';

export const gynecologicalHistory = pgTable('gynecological_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id),
  section: text('section'),
  familyPlanning: text('family_planning'),
  familyPlanningMethod: text('family_planning_method'),
  papSmearTest: text('pap_smear_test'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
