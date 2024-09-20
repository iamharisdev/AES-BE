import { EmrGenerationRoute } from '@/routes/emr-generation'
import { EmrGenerationSchema } from '@/schemas/emr-combined'
import { z } from '@hono/zod-openapi'
import { json, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

// doctor is for easy aliasing. This table actually stores details of Health Practitioners
type EmrRecord = z.infer<typeof EmrGenerationSchema>
export const emrRecordTable = pgTable('emr_records', {
	emrId: text('emr_id').notNull().primaryKey(),
	// doctor Identifier is the doctor's Phone Number
	doctorId: text('doctor_id').notNull(),
	// patient Identifier is the patient's Phone Number
	patientId: text('patient_id').notNull(),
	generationTime: timestamp('generation_time').notNull().defaultNow(),
	content: json('content').$type<EmrRecord>().notNull(),
})
