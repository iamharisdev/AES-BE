import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { emr } from './emr'

export const sectionStatus = pgEnum('section_status', ['incomplete', 'complete'])

// Tracks per‑section progress for a given EMR, including answered/skipped question IDs
export const emrSectionProgress = pgTable('emr_section_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id').notNull().references(() => emr.id),
  section: text('section').notNull(),
  status: sectionStatus('status').notNull().default('incomplete'),
  answeredIds: jsonb('answered_ids').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  skippedIds: jsonb('skipped_ids').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  lastQuestionId: text('last_question_id'),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})
