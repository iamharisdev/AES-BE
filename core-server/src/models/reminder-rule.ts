import { pgTable, uuid, integer, text, boolean, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { reminderTemplate } from './reminder-template';

export const reminderRule = pgTable(
  'reminder_rule',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    templateId: uuid('template_id').notNull().references(() => reminderTemplate.id, { onDelete: 'cascade' }),
    targetWeek: integer('target_week'), // for week-based triggers (e.g., 8, 12, 28)
    triggerCode: text('trigger_code'), // for non-week triggers (e.g., 'inactivity_48h')
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueWeekRule: uniqueIndex('reminder_rule_unique_week').on(t.targetWeek).where(sql`target_week IS NOT NULL`),
    triggerIdx: index('reminder_rule_trigger_idx').on(t.triggerCode),
    activeIdx: index('reminder_rule_active_idx').on(t.isActive),
  })
);
