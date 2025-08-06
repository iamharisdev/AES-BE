import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { emr } from './emr';

export const presentingComplaint = pgTable('presenting_complaint', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id),
  problem: text('problem').notNull(), // Current problem or complaint - "Kya aap ko is waqt koi alamat ya taqleef mehsoos ho rahi hai?"
  detail: text('detail'), // Detailed description of the problem - "If yes: Thora tafseelan batayein?"
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
