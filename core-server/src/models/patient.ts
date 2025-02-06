import { pgTable, text, uuid, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const patientTable = pgTable('patient', {
  patientId: uuid('patient_id').primaryKey().notNull(),
  phone: text('phone').notNull(),
  name: text('name').notNull(),
  location: text('location').notNull(),
  cnic: text('cnic').notNull(),
  generationTime: timestamp('generation_time').notNull().defaultNow(),
  prevPregnancies: jsonb('prev_pregnancies'),
});
