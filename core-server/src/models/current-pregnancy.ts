import { pgTable, timestamp, uuid, text } from "drizzle-orm/pg-core";
import { emr } from "./emr";

export const currentPregnancy = pgTable("current_pregnancy", {
  id: uuid("id").primaryKey().defaultRandom(),
  emrId: uuid("emr_id")
    .notNull()
    .references(() => emr.id),

  // ✅ MATCHED FIELDS (from JSON)
  currentProblems: text("current_problems"),
  pregnancyDetectionMethod: text("pregnancy_detection_method"),
  ultrasound: text("ultrasound"), // moved up from legacy for JSON match
  folicAcid: text("folic_acid"),
  bloodUrineTests: text("blood_urine_tests"), // matches blood_urine_test JSON id
  earlyPregnancySymptoms: text("early_pregnancy_symptoms"),
  pregnancyMethod: text("pregnancy_method"),


  // 📝 Remaining existing fields (not directly matched)
  bleeding: text("bleeding"),
  fever: text("fever"),
  headacheVision: text("headache_vision"),
  severePain: text("severe_pain"),
  convulsions: text("convulsions"),
  breathingDifficulty: text("breathing_difficulty"),
  otherConcerns: text("other_concerns"),
  earlyUltrasound: text("early_ultrasound"),
  ultrasoundLocation: text("ultrasound_location"),
  menstrualRegularity: text("menstrual_regularity"),
  testDetails: text("test_details"),
  pregnancyConsent: text("pregnancy_consent"),
  pregnancyClinicalFindings: text("pregnancy_clinical_findings"),
  uti_burn: text("uti_burn"),
  urineTest: text("urine_test"),
  bloodUrineTest: text("blood_urine_test"), // kept for backward compatibility
  bloodUrineTestTypes: text("blood_urine_test_types"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
