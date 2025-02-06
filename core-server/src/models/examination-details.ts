import { jsonb, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { doctorTable } from './doctor'
import { turnEmrTable } from './turn-emr'

export const examinationDetailsTable = pgTable('examination_details', {
	generationTime: timestamp('generation_time').notNull(),
	emrId: uuid('emr_id').primaryKey().notNull().references(() => turnEmrTable.emrId),
	content: jsonb('content').notNull(),
	doctorId: uuid('doctor_id').notNull().references(() => doctorTable.doctorId),
})
