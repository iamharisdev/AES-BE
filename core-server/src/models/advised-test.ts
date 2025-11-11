import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { visits } from "./visit";

export const advisedTestStatusEnum = pgEnum("advised_test_status", [
  "not_submitted",
  "submitted",
]);

export const advisedTest = pgTable("advised_tests", {
  id: uuid("id").primaryKey().defaultRandom(),

  visitId: uuid("visit_id")
    .notNull()
    .references(() => visits.id, { onDelete: "cascade" }),

  testName: text("test_name").notNull(),

  status: advisedTestStatusEnum("status").default("not_submitted").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
