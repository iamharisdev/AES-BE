import { pgTable, timestamp, uuid, text } from 'drizzle-orm/pg-core';
import { emr } from './emr';

export const currentPregnancy = pgTable('current_pregnancy', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id),
  pregnancyDetectionMethod: text('pregnancy_detection_method'), // How pregnancy was detected - "Aapko haml kese pata chala hai?"
  pregnancyConsent: text('pregnancy_consent'), // Whether pregnancy was consensual - "Kiya huml mein aapki marzi shamil thi?"
  pregnancyMethod: text('pregnancy_method'), // Whether pregnancy happened naturally or required medication - "Haml khudi hoa tha ya phir dawai khani pari?"
  pregnancyClinicalFindings: text('pregnancy_clinical_findings'), // Clinical findings during pregnancy
  urineTest: text('urine_test'), // Whether urine test was done - "Pishaab ka test kiya tha?"
  ultrasound: text('ultrasound'), // Whether ultrasound was done - "Shuru ke dino mein ultrasound karaya tha?"
  folicAcid: text('folic_acid'), // Whether folic acid was taken - "Aapne folic acid li huml se pehle aur shuru ke dino mein?"
  bloodUrineTest: text('blood_urine_test'), // Whether blood/urine tests were done - "Aapke koi khoon pishaab ke koi test hoye?"
  bloodUrineTestTypes: text('blood_urine_test_types'), // Types of blood/urine tests - "If yes, then konse hoye?"

  // Early pregnancy problems (consolidated)
  earlyPregnancySymptoms: text('early_pregnancy_symptoms'), // Early pregnancy symptoms including fever, headache, vomiting, urinary issues, burning, blood, pain - "Hamal ke shuru ke dino mein kiya apko in main se koi alamaat mehsoos hui hain?"

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
