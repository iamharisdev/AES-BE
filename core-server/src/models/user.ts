import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { hospital } from './hospital';

export enum UserRole {
  Doctor = 'doctor',
  Admin = 'admin',
  SuperAdmin = 'super_admin',
  HealthWorker = 'health_worker'
}

export const user = pgTable('user', {
  id: uuid('id').primaryKey().defaultRandom(),
  phoneNumber: text('phone_number').notNull(),
  email: text('email'),
  name: text('name').notNull(),
  encryptedPassword: text('encrypted_password').notNull(),
  role: text('role').notNull().default(UserRole.Doctor),
  hospitalId: uuid('hospital_id').references(() => hospital.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
