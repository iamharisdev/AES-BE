import { pgTable, text } from 'drizzle-orm/pg-core'

export const PatientInfoTable = pgTable('patient_info', {
	phoneNumber: text('phone').notNull().primaryKey(),
	name: text('name').notNull(),
	location: text('location').notNull(),
})
