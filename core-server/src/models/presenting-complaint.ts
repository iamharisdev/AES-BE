import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { emr } from './emr';

export const presentingComplaint = pgTable('presenting_complaint', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id),
  symptom: text('primary_symptom').notNull(),
  symptomDuration: text('symptom_duration'),
  symptomSeverity: text('symptom_severity'),
  relatedSymptoms: text('related_symptoms'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
