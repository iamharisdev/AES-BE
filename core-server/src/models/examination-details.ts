import { jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { doctorTable } from './doctor';
import { turnEmrTable } from './turn-emr';

export const examinationDetailsTable = pgTable('examination_details', {
  generationTime: timestamp('generation_time').notNull(),
  emrId: uuid('emr_id')
    .primaryKey()
    .notNull()
    .references(() => turnEmrTable.emrId),
  doctorId: uuid('doctor_id')
    .notNull()
    .references(() => doctorTable.doctorId),
  modifiedDoctorId: uuid('modified_doctor_id').references(
    () => doctorTable.doctorId
  ),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  bloodPressure: varchar('blood_pressure'),
  pr: varchar('pr'),
  rr: varchar('rr'),
  temperature: varchar('temperature'),
  bilateralPedalEdema: varchar('bilateral_pedal_edema'),
  clubbing: varchar('clubbing'),
  jaundice: varchar('jaundice'),
  koilonychia: varchar('koilonychia'),
  lymphNodes: varchar('lymph_nodes'),
  pallor: varchar('pallor'),
  spine: varchar('spine'),
  nippleDeformity: varchar('nipple_deformity'),
  nippleDischarge: varchar('nipple_discharge'),
  sizeComparison: varchar('size_comparison'),
  swelling: varchar('swelling'),
  abdominalWallEdema: varchar('abdominal_wall_edema'),
  estimatedFetalWeight: varchar('estimated_fetal_weight'),
  fetalHeartRate: varchar('fetal_heart_rate'),
  fundalHeight: varchar('fundal_height'),
  hernialOrfices: varchar('hernial_orfices'),
  lie: varchar('lie'),
  liquor: varchar('liquor'),
  presentation: varchar('presentation'),
  prominentVeins: varchar('prominent_veins'),
  pulsations: varchar('pulsations'),
  scarTenderness: varchar('scar_tenderness'),
  shapeOfAbdomen: varchar('shape_of_abdomen'),
  striae: varchar('striae'),
  umbilicus: varchar('umbilicus'),
  perSpeculumFindings: varchar('per_speculum_findings'),
  perVaginalFindings: varchar('per_vaginal_findings'),
  cns: varchar('cns'),
  cvs: varchar('cvs')
});
