import { bigint, pgTable, serial, text } from 'drizzle-orm/pg-core'
import { diagnosticsTable } from './diagnostics'
import { doctorTable } from './doctor'
import { emrRecordTable } from './emr'
import { PatientInfoTable } from './patient-info'
import { redFlagsTable } from './red-flags'

export const __migrations = pgTable('migrations', {
	id: serial('id').primaryKey().notNull(),
	hash: text('hash').notNull(),
	createdAt: bigint('created_at', { mode: 'number' }),
})

export const table = {
	doctor: doctorTable,
	emr: emrRecordTable,
	patient: {
		info: PatientInfoTable,
		// TODO: need to add auth table as well later on for patients to authenticate later on just like doctors
	},
	redFlags: redFlagsTable,
	diagnostics: diagnosticsTable,
}
