import { integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const turnEmrTable = pgTable('turn_emr', {
	phone: text('phone').notNull(),
	visit: integer('visit').notNull(),
	generationTime: timestamp('generation_time').notNull(),
	lastModifiedTime: timestamp('last_modified_time').notNull(),
	patientProfile: jsonb('patient_profile').notNull(),
	presentingComplaint: jsonb('presenting_complaint').notNull(),
	currentPregnancy: jsonb('current_pregnancy').notNull(),
	secondThirdTrimesters: jsonb('second_third_trimesters').notNull(),
	obsHistory: jsonb('obs_history').notNull(),
	gynecologicalHistory: jsonb('gynecological_history').notNull(),
	pastMedicalHistory: jsonb('past_medical_history').notNull(),
	surgicalHistory: jsonb('surgical_history').notNull(),
	familyHistory: jsonb('family_history').notNull(),
	personalHistory: jsonb('personal_history').notNull(),
	socioEconomicHistory: jsonb('socio_economic_history').notNull(),
	emrId: uuid('emr_id').primaryKey().notNull(),
})
