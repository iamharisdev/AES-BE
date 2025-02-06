import { pgTable, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { turnEmrTable } from './turn-emr';
import { doctorTable } from './doctor';

export const examinationDetailsTable = pgTable('examination_details', {
  generationTime: timestamp('generation_time').notNull(),
  emrId: uuid('emr_id').primaryKey().notNull().references(() => turnEmrTable.emrId),
  content: jsonb('content').notNull(),
  doctorId: uuid('doctor_id').notNull().references(() => doctorTable.doctorId),
});
