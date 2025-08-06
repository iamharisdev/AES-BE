import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { emr } from './emr';

export const files = pgTable('files', {
  id: uuid('id').primaryKey().defaultRandom(),
  emrId: uuid('emr_id')
    .notNull()
    .references(() => emr.id),
  fileName: text('file_name').notNull(), // Name of the uploaded file
  fileType: text('file_type').notNull(), // Type of file (image, pdf, etc.)
  fileUrl: text('file_url').notNull(), // URL where file is stored

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});
