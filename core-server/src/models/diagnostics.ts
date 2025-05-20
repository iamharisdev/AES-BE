import { DiagnosticsSchema } from '@/schemas/diagnostics';
import { z } from '@hono/zod-openapi';
import { json, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { emr } from './emr';

type Diagnostics = z.infer<typeof DiagnosticsSchema>;

export const diagnostics = pgTable('diagnostics', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id, { onDelete: 'cascade' }),
  content: json('diagnostics').$type<Diagnostics>().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
