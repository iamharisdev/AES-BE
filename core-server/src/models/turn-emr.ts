// turn-emr.ts
import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  integer
} from 'drizzle-orm/pg-core';
import { patientTable } from './patient';

export const turnEmrTable = pgTable('turn_emr', {
  phone: text('phone').notNull(),
  visit: integer('visit').notNull(),
  generationTime: timestamp('generation_time').defaultNow(),
  lastModifiedTime: timestamp('last_modified_time'),
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
  emrId: uuid('emr_id').primaryKey().notNull(),
  patientId: uuid('patient_id')
    .notNull()
    .references(() => patientTable.patientId),
  files: jsonb('files').default('[]')
});
