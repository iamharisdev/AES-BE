import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { emr } from './emr';

export const medicalHistory = pgTable('medical_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id),

  // Current medications
  currentMedications: text('current_medications'), // Current medications being taken - "Kiya ap kisi maslay k liye koi dawai khaa rahi hain?"

  // Medical conditions (consolidated)
  medicalConditions: text('medical_conditions'), // All medical conditions including sugar, blood pressure, asthma, TB, jaundice, heart, kidney problems - "Kabhi sugar/Blood pressure/ dama/TB/Yarqan/dil ya gurdon ka masla tou nahin hua?"

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
