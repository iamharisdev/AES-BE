import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { user } from './user';

export const patient = pgTable('patient', {
  id: uuid('id').primaryKey().defaultRandom(),
  phoneNumber: text('phone_number').notNull(),
  name: text('name'),
  age: text('age'),
  maritalStatus: text('marital_status'),
  occupation: text('occupation'),
  location: text('location'),
  cnic: text('cnic'),
  education: text('education'),
  marriedYears: text('married_years'),
  pregnancyMonths: text('pregnancy_months'),
  miscarriage: text('miscarriage'),
  firstPregnancy: text('first_pregnancy'),
  familyMarriage: text('family_marriage'),
  voiceNotes: jsonb('voice_notes').default('[]'),
  doctorId: uuid('doctor_id').references(() => user.id, {
    onDelete: 'cascade'
  }), // FK to user (doctor role) - nullable by default
  hospitalId: uuid('hospital_id'), // Optional, can be inferred from user
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
