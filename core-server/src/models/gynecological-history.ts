import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { emr } from './emr';

export const gynecologicalHistory = pgTable('gynecological_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id),
  familyPlanning: text('family_planning'), // Whether family planning methods were used - "Ap khandaani mansooba bandi k liye koi tareeq istemal kerti theen is se pehlay?"
  familyPlanningMethod: text('family_planning_method'), // Specific family planning method used - "If yes, konsa?"
  papSmearTest: text('pap_smear_test'), // Whether pap smear test was done - "Kiya ap nay kabhi bachaydaani k munh ka muaaiana (pap smear) kerwaya hain?"
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
