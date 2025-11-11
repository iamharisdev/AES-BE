import { pgTable, uuid, text, integer, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { reminderTemplate } from './reminder-template';
import { reminderRule } from './reminder-rule';

export const reminderDelivery = pgTable(
  'reminder_delivery',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    patientId: uuid('patient_id').notNull(), // If you later add FK to patient, wire it here
    templateId: uuid('template_id').notNull().references(() => reminderTemplate.id, { onDelete: 'restrict' }),
    ruleId: uuid('rule_id').references(() => reminderRule.id, { onDelete: 'set null' }),
    scheduledFor: timestamp('scheduled_for', { mode: 'date' }), // date-only scheduling; drizzle stores as timestamp without time zone
    sentAt: timestamp('sent_at', { withTimezone: true }),
    status: text('status').notNull().default('pending'), // pending | sent | failed | skipped
    providerMessageId: text('provider_message_id'),
    error: text('error'),
    attemptCount: integer('attempt_count').notNull().default(0),
    lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqPatientTemplate: uniqueIndex('reminder_delivery_unique_patient_template').on(t.patientId, t.templateId),
    statusIdx: index('reminder_delivery_status_idx').on(t.status),
    scheduledIdx: index('reminder_delivery_scheduled_idx').on(t.scheduledFor),
    patientIdx: index('reminder_delivery_patient_idx').on(t.patientId),
  })
);
