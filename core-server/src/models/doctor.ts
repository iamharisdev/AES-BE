import { pgTable, text, uuid } from 'drizzle-orm/pg-core';

export const doctorTable = pgTable('doctor', {
  doctorId: uuid('doctor_id').primaryKey().notNull(),
  phoneNumber: text('phone_number').notNull(),
  name: text('name').notNull(),
  encryptedPassword: text('encrypted_password').notNull(),
  maternityHomeName: text('maternity_home_name').notNull()
});
