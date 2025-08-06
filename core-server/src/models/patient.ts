import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { user } from './user';

export const patient = pgTable('patient', {
  id: uuid('id').primaryKey().defaultRandom(),
  phoneNumber: text('phone_number').notNull(), // Patient's contact number - "Apna ya apne shohar ka number likhein ta keh hum aapse raabta kar sakein"
  husbandPhoneNumber: text('husband_phone_number'), // Husband's contact number - "Apna ya apne shohar ka number likhein ta keh hum aapse raabta kar sakein"
  name: text('name'), // Patient's full name - "Aapka pura naam kya hai?"
  age: text('age'), // Patient's age - "Aapki umar kitni hai?"
  maritalStatus: text('marital_status'), // Marital status - Implied from marriage questions
  occupation: text('occupation'), // Housewife or working - "Aap ghar sambhalti hain? Ya kaam bhi karti hain?"
  location: text('location'), // Area/location where patient lives - "Aap kis ilaqe mein rehti hain?"
  cnic: text('cnic'), // Identity card number (CNIC) - "Aapka shanakhti card number kya hai?"
  education: text('education'), // Education level achieved - "Aap kis jamat tak parhi hain?"
  marriedYears: text('married_years'), // Years of marriage - "Shaadi ko kitna arsa ho g aya hai?"
  pregnancyMonths: text('pregnancy_months'), // Current pregnancy month - "Aapke hisaab se huml ka konsa mahina chal raha?"
  miscarriage: text('miscarriage'), // First pregnancy status - "Kya ye apka pehla huml hai?"
  firstPregnancy: text('first_pregnancy'), // Whether this is first pregnancy - "Kya ye apka pehla huml hai?"
  familyMarriage: text('family_marriage'), // Cousin marriage status - "Kiya apka shohar apka cousin hai?"
  patientBloodGroup: text('patient_blood_group'), // Patient's blood group - "App ka blood group kya hai?"
  husbandBloodGroup: text('husband_blood_group'), // Husband's blood group - "App kay shohar ka blood group kya hai?"
  lastMenstruationDate: text('last_menstruation_date'), // Last menstruation date - "Aapko mahwari ki aakhri date kab ayi thi?/ aakhri tareekh yaad hai?"

  // Pregnancy outcomes (from EMR flow)
  totalPregnancies: text('total_pregnancies'), // Total number of pregnancies - "Aapke kitnay hamal thehray?"
  miscarriages: text('miscarriages'), // Number of miscarriages - "Kitnay hamal zaya huway?"
  miscarriageTiming: text('miscarriage_timing'), // When miscarriages occurred - "Kitnay mahinon baad zaya huwa, agar aik se zyada hai tou aik hi message main sab ka batayein?"
  stillbirths: text('stillbirths'), // Number of stillbirths - "Kitnay bachay pait may fout huway ya murda paida huway?"
  neonatalDeaths: text('neonatal_deaths'), // Number of neonatal deaths - "kitnay bachay padaish ke baad fout huway?"
  livingChildren: text('living_children'), // Number of living children - "Aapke kitne bachay aap kay paas hain?"

  voiceNotes: jsonb('voice_notes').default('[]'), // Voice notes from patient
  doctorId: uuid('doctor_id').references(() => user.id, {
    onDelete: 'cascade'
  }), // FK to user (doctor role) - nullable by default
  hospitalId: uuid('hospital_id'), // Optional, can be inferred from user
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
