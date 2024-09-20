import { DiagnosticsSchema } from '@/schemas/diagnostics'
import { z } from '@hono/zod-openapi'
import { json, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

type Diagnostics = z.infer<typeof DiagnosticsSchema>

export const diagnosticsTable = pgTable('diagnostics', {
	emrId: text('emr_id').notNull().primaryKey(),
	generationTime: timestamp('generation_time').notNull().defaultNow(),
	content: json('diagnostics').$type<Diagnostics>().notNull(),
})
