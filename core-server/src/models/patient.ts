import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const patientTable = pgTable('patient', {
  patientId: uuid('patient_id').primaryKey().notNull(),
  phone: text('phone'),
  name: text('name'),
  location: text('location'),
  cnic: text('cnic'),
  generationTime: timestamp('generation_time').defaultNow().notNull(),
  prevPregnancies: jsonb('prev_pregnancies'),
  voiceNotes: jsonb('voice_notes').default('[]')
});
