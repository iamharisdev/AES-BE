import { jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { user } from './user';
import { emr } from './emr';

export const examination = pgTable('examination', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id),
  updatedByUserId: uuid('updated_by_user_id').references(() => user.id),
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
  cvs: varchar('cvs'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
