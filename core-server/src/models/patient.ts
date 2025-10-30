import {
  jsonb,
  pgTable,
  text,
  boolean,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./user";


export const patient = pgTable('patient', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  age: text('age'),
  cnic: text('cnic'),
  phoneNumber: text('phone_number').notNull(),
  education: text('education'),
  location: text('location'),
  occupation: text('occupation'),
  married_years: text('married_years'),
  total_pregnancies: text('total_pregnancies'),
  living_children: text('living_children'),
  lastMenstruationDate: text('last_menstruation_date'),
  pregnancyMonths: text('pregnancy_months'),
  firstPregnancy: text('first_pregnancy'),
  miscarriages: text('miscarriages'),
  miscarriageCount: text('miscarriage_count'),
  miscarriageTiming: text('miscarriage_timing'),
  stillbirths: text('stillbirths'),
  stillbirthCount: text('stillbirth_count'),
  neonatalDeaths: text('neonatal_deaths'),
  neonatalDeathCount: text('neonatal_death_count'),
  pretermBirths: text('preterm_births'),
  voiceNotes: jsonb('voice_notes').default('[]'),
 

  // 🔹 Other existing fields (not in object currently)
  husbandPhoneNumber: text("husband_phone_number"),
  maritalStatus: text("marital_status"),
  familyMarriage: text("family_marriage"),
  patientBloodGroup: text("patient_blood_group"),
  husbandBloodGroup: text("husband_blood_group"),
  miscarriage: text("miscarriage"), // legacy

  currentProblems: text("current_problems"),
  medicalConditions: text("medical_conditions"),
  currentMedications: text("current_medications"),

  // Foreign Keys
  doctorId: uuid('doctor_id').references(() => user.id, {
    onDelete: 'cascade'
  }),
  hospitalId: uuid('hospital_id'),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
