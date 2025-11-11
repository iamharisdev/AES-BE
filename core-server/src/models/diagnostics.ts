import { z } from "@hono/zod-openapi";
import { jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { visits } from "./visit";

export const DiagnosticItemSchema = z.object({
  name: z.string(),
  uri: z.string().optional().nullable(),
});

export const DiagnosticsContentSchema = z.array(DiagnosticItemSchema);

export const DiagnosticsWrapperSchema = z.object({
  diagnostics: DiagnosticsContentSchema, // matches client payload
});

export type DiagnosticsContent = z.infer<typeof DiagnosticsWrapperSchema>;

export const diagnostics = pgTable("diagnostics", {
  id: uuid("id").primaryKey().defaultRandom(),
  visitId: uuid("visit_id").notNull(),

  diagnostics: jsonb("diagnostics").$type<DiagnosticsContent>().notNull(), // matches Zod wrapper

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
