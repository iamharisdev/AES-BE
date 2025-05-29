import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { emr } from './emr';

export const socioEconomicHistory = pgTable('socio_economic_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id),
  noFamilyMembers: text('no_family_members'),
  familyType: text('family_type'),
  livingSituation: text('living_situation'),
  moreInfo: text('more_info'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
