import {
  pgTable,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';
import { patient } from './patient';

export const qrCode = pgTable('qr_code', {
  id: uuid('id').primaryKey().defaultRandom(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  patientId: uuid('patient_id')
    .notNull()
    .references(() => patient.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
