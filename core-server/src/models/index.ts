import { bigint, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { diagnosticsTable } from './diagnostics';
import { doctorTable } from './doctor';
import { examinationDetailsTable } from './examination-details';
import { patientTable } from './patient';
import { redFlagsTable } from './red-flags';
import { turnEmrTable } from './turn-emr';

export const __migrations = pgTable('migrations', {
  id: serial('id').primaryKey().notNull(),
  hash: text('hash').notNull(),
  createdAt: bigint('created_at', { mode: 'number' })
});

export const tables = {
  doctor: doctorTable,
  emr: turnEmrTable,
  patient: patientTable,
  redFlags: redFlagsTable,
  diagnostics: diagnosticsTable,
  examinationDetails: examinationDetailsTable
};
