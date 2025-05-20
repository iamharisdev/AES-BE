import { bigint, pgTable, serial, text, uuid } from 'drizzle-orm/pg-core';
import { diagnostics } from './diagnostics';
import { user } from './user';
import { examination } from './examination';
import { patient } from './patient';
import { redFlags } from './red-flags';
import { emr } from './emr';
import { hospital } from './hospital';

export const __migrations = pgTable('migrations', {
  id: serial('id').primaryKey().notNull(),
  hash: text('hash').notNull(),
  createdAt: bigint('created_at', { mode: 'number' })
});

export const tables = {
  user,
  hospital,
  emr,
  patient,
  redFlags,
  diagnostics,
  examination
};
