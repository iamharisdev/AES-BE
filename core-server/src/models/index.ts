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

export const table = {
  doctor: doctorTable,
  emr: turnEmrTable,
  patient: {
    info: patientTable
    // TODO: need to add auth table as well later on for patients to authenticate later on just like doctors
  },
  redFlags: redFlagsTable,
  diagnostics: diagnosticsTable,
  examinationDetails: examinationDetailsTable
};
