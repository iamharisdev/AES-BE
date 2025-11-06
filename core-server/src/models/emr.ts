import { pgTable, text, timestamp, uuid, integer } from 'drizzle-orm/pg-core';
import { patient } from './patient';

// Main EMR table
export const emr = pgTable('emr', {
  id: uuid('id').primaryKey().defaultRandom(),
  phone: text('phone').notNull(),
  visit: integer('visit').notNull(),
  patientId: uuid('patient_id')
    .notNull()
    .references(() => patient.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
