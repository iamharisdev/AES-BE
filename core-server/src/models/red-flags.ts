import { RedFlagsSchema } from '@/schemas/red-flags';
import { z } from '@hono/zod-openapi';
import { json, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { emr } from './emr';

type redflags = z.infer<typeof RedFlagsSchema>;
// doctor is for easy aliasing. This table actually stores details of Health Practitioners

export const redFlags = pgTable('red_flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id, { onDelete: 'cascade' }),
  redFlags: json('red_flags').$type<redflags>().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
