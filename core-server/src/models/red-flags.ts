import { RedFlagsSchema } from '@/schemas/red-flags';
import { z } from '@hono/zod-openapi';
import { json, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

type redflags = z.infer<typeof RedFlagsSchema>;
// doctor is for easy aliasing. This table actually stores details of Health Practitioners

export const redFlagsTable = pgTable('red_flags', {
  emrId: text('emr_id').notNull().primaryKey(),
  generationTime: timestamp('generation_time').notNull().defaultNow(),
  redFlags: json('red_flags').$type<redflags>().notNull()
});
