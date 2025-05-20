import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export enum UserRole {
  Doctor = 'doctor',
  Admin = 'admin',
  SuperAdmin = 'super_admin',
  HealthWorker = 'health_worker',
  Patient = 'patient',
}

export const user = pgTable('user', {
  id: uuid('id').primaryKey().defaultRandom(),
  phoneNumber: text('phone_number').notNull(),
  name: text('name').notNull(),
  encryptedPassword: text('encrypted_password').notNull(),
  role: text('role').notNull().default(UserRole.Doctor), // Use enum for type safety
  hospitalId: uuid('hospital_id').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
