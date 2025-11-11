import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const reminderTemplate = pgTable('reminder_template', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(), // human-friendly code, e.g., 'week_28'
  provider: text('provider').notNull().default('twilio'),
  providerTemplateId: text('provider_template_id').notNull(), // Twilio Content SID
  channel: text('channel').notNull().default('whatsapp'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
