import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { emr } from "./emr";

export const trimester = pgTable("trimester", {
  id: uuid("id").primaryKey().defaultRandom(),
  emrId: uuid("emr_id")
    .notNull()
    .references(() => emr.id),

  // 🔹 Existing keys
  fetusMovement: text("fetus_movement"),
  ultraSoundFiveMonths: text("ultrasound_five_months"),
  checkupRegularity: text("checkup_regularity"),
  sugarTest: text("sugar_test"),
  sugarMedication: boolean("sugar_medication"),
  bloodPressure: text("blood_pressure"),
  bpMedication: boolean("bp_medication"),
  recentUltrasound: text("recent_ultrasound"),
  additionalInfo: text("additional_info"),

  // ⚪ Extra fields converted to camelCase
  movementReduction: text("movement_reduction"),
  checkupVisits: text("checkup_visits"),
  sugarTestResult: text("sugar_test_result"),
  bloodPressureCheck: text("blood_pressure_check"),
  bloodPressureResult: text("blood_pressure_result"),
  recentUltrasoundIssues: text("recent_ultrasound_issues"),
  additionalPregnancyInfo: text("additional_pregnancy_info"),
  ultrasound: text("ultrasound"),
  scanResults: text("scan_results"),
  bloodUrineTests: text("blood_urine_tests"),
  hbLevel: text("hb_level"),
  hbSymptoms: text("hb_symptoms"),
  strengthMeds: text("strength_meds"),
  pregnancySymptoms: text("pregnancy_symptoms"),

  // 🕒 Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
