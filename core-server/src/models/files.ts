import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { patient } from './patient';

export const files = pgTable('files', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').references(() => patient.id),
  fileName: text('file_name').notNull(), // Name of the uploaded file
  fileType: text('file_type').notNull(), // Type of file (image, pdf, etc.)
  fileUrl: text('file_url').notNull(), // URL where file is stored
  summary: text('summary').notNull(), // Summary of the file

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
