import { pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core'
import { doctorTable } from './doctor'

export const PatientInfoTable = pgTable('patient_info', {
	// the doctor who adds this patient info
	doctorId: text('doctor_id').notNull().references(() => doctorTable.phone, { onDelete: 'cascade' }),
	phoneNumber: text('phone').notNull(),
	name: text('name').notNull(),
	location: text('location').notNull(),
	createdAt: timestamp('generation_time', { mode: 'string' }).notNull().defaultNow(),
}, (table) => ({
	pkWithCustomName: primaryKey({
		name: 'global_id',
		columns: [table.doctorId, table.phoneNumber],
	}),
}))
