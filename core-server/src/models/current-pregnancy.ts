import { pgTable, timestamp, uuid, text } from 'drizzle-orm/pg-core';
import { emr } from './emr';

export const currentPregnancy = pgTable('current_pregnancy', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id),
  pregnancyDetectionMethod: text('pregnancy_detection_method'),
  pregnancyConsent: text('pregnancy_consent'),
  pregnancyClinicalFindings: text('pregnancy_clinical_findings'),
  urineTest: text('urine_test'),
  ultrasound: text('ultrasound'),
  folicAcid: text('folic_acid'),
  bloodUrineTest: text('blood_urine_test'),
  bloodUrineTestTypes: text('blood_urine_test_types'),
  earlyPregProblems: text('early_preg_problems'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
