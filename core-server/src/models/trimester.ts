import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { emr } from './emr';

export const trimester = pgTable('trimester', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id),

  // Fetal movement and monitoring
  fetusMovement: text('fetus_movement'), // When fetal movement was first felt - "Apko bache ki harkat hona kab mahsoos hoyi?"
  movementReduction: text('movement_reduction'), // Whether fetal movement has reduced - "Bachay ki harkat may koi kami mehsoos to nahi huwi?"

  // Ultrasound and scans
  ultrasound: text('ultrasound'), // Whether ultrasound was done - "Apka panchwain mahinay main bachay ki banawat wala ultrasound (barra ultrasound) hua tha?"
  recentScan: text('recent_scan'), // Whether recent scan was done - "If in the third trimester, abhi ka koi recent scan hai apke paas?"
  scanResults: text('scan_results'), // Results of recent scan - "Koi masla tou nahi aya?"

  // Regular checkups
  checkupRegularity: text('checkup_regularity'), // Whether regular checkups were done - "Kiya ap nay baa-qaidgi se checkup kerwaya hai?"

  // Blood tests
  bloodUrineTests: text('blood_urine_tests'), // Whether blood/urine tests were done - "Aur khoon pishaab ke test hoye hain?"
  hbLevel: text('hb_level'), // Hemoglobin level and test date - "If yes, Hb kitni hai?"
  hbSymptoms: text('hb_symptoms'), // Symptoms when Hb test was not done - "If no, kya aapko thakawat, saans ka phoolna, ya dil ki dharkan tez hone ka masla hota hai?"

  // Sugar and blood pressure
  sugarTest: text('sugar_test'), // Whether sugar test was done - "Aapke sugar ke test hoye thay?"
  sugarTestResult: text('sugar_test_result'), // Results of sugar test - "If yes, test main kiya aya tha?"
  sugarMedication: text('sugar_medication'), // Whether sugar medication is being taken - "Aapko is masle ke liye koi dawai khaani parhti hai?"
  bloodPressure: text('blood_pressure'), // Whether blood pressure was checked - "Aapka blood pressure check huwa hai?"
  bloodPressureResult: text('blood_pressure_result'), // Blood pressure results - "If yes, kiya aya tha?"
  bpMedication: text('bp_medication'), // Whether BP medication is being taken - "Aapko is masle ke liye koi dawai khaani parhti hai?"

  // Medications
  strengthMeds: text('strength_meds'), // Whether strength medications are being taken - "Aap taqat ki dawain le rahi hain?"

  // Pregnancy problems (consolidated)
  pregnancySymptoms: text('pregnancy_symptoms'), // Pregnancy symptoms including leg pain, back pain, reduced fetal movement - "Kiya apko hamal k doran in main se koi alamaat mehsoos hui hain:"

  // Additional information
  additionalInfo: text('additional_info'), // Any additional pregnancy information - "Pregnancy ke baare mein koi aur maloomat jo aap share karna chahti hain?"

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
