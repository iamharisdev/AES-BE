import { pgTable, text } from 'drizzle-orm/pg-core'

// doctor is for easy aliasing. This table actually stores details of Health Practitioners
export const doctorTable = pgTable('doctor', {
	phone: text('phone_number').notNull().primaryKey(),
	name: text('name').notNull(),
	encryptedPassword: text('encrypted_password').notNull(),
	maternityHomeName: text('maternity_home_name').notNull(),
})
