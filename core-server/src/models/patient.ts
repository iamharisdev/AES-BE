import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { user } from './user';

export const patient = pgTable('patient', {
  id: uuid('id').primaryKey().defaultRandom(),
  phoneNumber: text('phone_number'),
  name: text('name'),
  location: text('location'),
  cnic: text('cnic'),
  prevPregnancies: jsonb('prev_pregnancies'),
  voiceNotes: jsonb('voice_notes').default('[]'),
  doctorId: uuid('doctor_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }), // FK to user (doctor role)
  hospitalId: uuid('hospital_id'), // Optional, can be inferred from user
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
