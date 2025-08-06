import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { emr } from './emr';

export const socioEconomicHistory = pgTable('socio_economic_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id),
  noFamilyMembers: text('no_family_members'), // Number of family members - "Aapke ghar mein kitne afraad hain?"
  financialSituation: text('financial_situation'), // Husband's work and family financial situation - "Shohar kiya kaam kerta hai? Ghar main sirf aik kamanay wala hai? Guzara kaise hota hai?"
  livingSituation: text('living_situation'), // Living with in-laws or separately - "Ap susral k sath rehti hain ya alag rehti hain?"
  additionalInfo: text('additional_info'), // Monthly income and additional important information - "Ghar main andazan mahana tankhwa kitni aajati hogi? Iske ilawa aap kuch batana chahein gi? Aapke nazdeek zaroori ho?"
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
