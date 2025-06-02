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
  fetusMovement: text('fetus_movement'),
  ultrasound: text('ultrasound'),
  checkupRegularity: text('checkup_regularity'),
  hbLevel: text('hb_level'),
  trimesterProblems: text('trimester_problems'),
  sugarBloodPressure: text('sugar_blood_pressure'),
  strengthMeds: text('strength_meds'),
  pregProblems: text('preg_problems'),
  additionalInfo: text('additional_info'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
