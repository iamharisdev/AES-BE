import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  integer
} from 'drizzle-orm/pg-core';
import { patient } from './patient';

export const emr = pgTable('emr', {
  id: uuid('id').primaryKey().defaultRandom(),
  phone: text('phone').notNull(),
  visit: integer('visit').notNull(),
  patientProfile: jsonb('patient_profile'),
  presentingComplaint: jsonb('presenting_complaint'),
  currentPregnancy: jsonb('current_pregnancy'),
  secondThirdTrimesters: jsonb('second_third_trimesters'),
  obsHistory: jsonb('obs_history'),
  gynecologicalHistory: jsonb('gynecological_history'),
  pastMedicalHistory: jsonb('past_medical_history'),
  surgicalHistory: jsonb('surgical_history'),
  familyHistory: jsonb('family_history'),
  personalHistory: jsonb('personal_history'),
  socioEconomicHistory: jsonb('socio_economic_history'),
  vitals: jsonb('vitals'),
  redFlags: jsonb('red_flags'),
  followupQuestions: jsonb('followup_questions'),
  patientId: uuid('patient_id')
    .notNull()
    .references(() => patient.id),
  files: jsonb('files').default('[]'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
