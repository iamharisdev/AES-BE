import { bigint, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { user } from './user';
import { diagnostics } from './diagnostics';
import { emr } from './emr';
import { examination } from './examination';
import { hospital } from './hospital';
import { patient } from './patient';
import { trimester } from './trimester';
import { presentingComplaint } from './presenting-complaint';
import { currentPregnancy } from './current-pregnancy';
import { obsHistory } from './obstetric-history';
import { gynecologicalHistory } from './gynecological-history';
import { medicalHistory } from './medical-history';
import { surgicalHistory } from './surgical-history';
import { familyHistory } from './family-history';
import { personalHistory } from './personal-history';
import { socioEconomicHistory } from './socio-economic-history';
import { vitals } from './vitals';
import { redFlags } from './red-flags';
import { followupQuestions } from './followup-questions';
import { files } from './files';
import { previousPregnancy } from './previous-pregnancy';

export const __migrations = pgTable('migrations', {
  id: serial('id').primaryKey().notNull(),
  hash: text('hash').notNull(),
  createdAt: bigint('created_at', { mode: 'number' })
});

export const tables = {
  user,
  patient,
  hospital,
  emr,
  examination,
  diagnostics,
  trimester,
  presentingComplaint,
  currentPregnancy,
  obsHistory,
  gynecologicalHistory,
  medicalHistory,
  surgicalHistory,
  familyHistory,
  personalHistory,
  socioEconomicHistory,
  vitals,
  redFlags,
  followupQuestions,
  files,
  previousPregnancy
} as const;
